#!/usr/bin/env python3
"""Rebuild the six illustrated records from frozen analyses, without refitting.

Only display aliases, rounded measurements and relative months are exported.
The selection maps and participant identifiers stay in the controlled workspace.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
import numpy as np
import pandas as pd

REPO = Path(__file__).resolve().parents[1]
WORKSPACE = REPO.parent.parent
PROJECT = WORKSPACE / "Mechanism2026"
RESULTS = PROJECT / "results"
ASSETS = REPO / "static/projects/pd-research-companion/assets"
KEY = ["PATNO", "cutoff_month"]
AXES = {"dopaminergic": "Dopaminergic", "injury_glial": "Injury / glial",
        "copathology_cognitive": "Co-pathology / cognitive", "lysosomal": "Lysosomal"}


def number(value, digits=4):
    return None if pd.isna(value) else round(float(value), digits)


def source(name, value, age, role):
    return {"name": name, "value": value, "age": number(age, 0), "role": role}


def read_module(filename, name):
    sys.path.insert(0, str(PROJECT / "scripts"))
    spec = importlib.util.spec_from_file_location(name, PROJECT / "scripts" / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def paper1():
    selection = pd.read_csv(RESULTS / "sept11_patient_revision/paper1_selection_controlled.csv")
    rolling = pd.read_csv(RESULTS / "ppmi_pd_rolling_origin_dynamics.csv")
    states = pd.read_csv(RESULTS / "transparent_evidence_composition_states.csv")
    selected = selection.merge(rolling, on=KEY, validate="one_to_one").merge(states, on=KEY, validate="one_to_one")
    pred = pd.read_csv(RESULTS / "time_valid_benchmark_predictions.csv")
    pred = pred[pred.evaluation.eq("internal_participant_cv")]
    comp = pd.read_csv(RESULTS / "transparent_evidence_composition_predictions.csv")
    uq = pd.read_csv(RESULTS / "global_selective_uq_predictions.csv")
    uq = uq[uq.evaluation.eq("participant_cv") & uq.uncertainty_model.eq("source_aware_uncertainty")]
    hist = pd.read_csv(RESULTS / "ppmi_dated_multiscale_snapshots.csv", usecols=["PATNO", "observed_month", "NP3TOT"])
    molecules = pd.read_csv(RESULTS / "sept11_patient_revision/paper1_molecular_sources_controlled.csv")
    result = []
    for _, row in selected.iterrows():
        matching = lambda frame: frame[frame.PATNO.eq(row.PATNO) & frame.cutoff_month.eq(row.cutoff_month)]
        p, c, u = matching(pred).set_index("model"), matching(comp).set_index("model"), matching(uq)
        assert len(u) == 1 and len(p) == 4 and len(c) == 5
        u = u.iloc[0]
        history = hist[hist.PATNO.eq(row.PATNO)].copy()
        dates, cutoff = pd.to_datetime(history.observed_month), pd.Timestamp(row.cutoff_month)
        history["relative"] = (dates.dt.year - cutoff.year) * 12 + dates.dt.month - cutoff.month
        history = history[history.relative.between(-24, 0)].dropna(subset=["NP3TOT"])
        history = history.groupby("relative", as_index=False).NP3TOT.median().sort_values("relative")
        assert np.isclose(history[history.relative.eq(0)].NP3TOT.iloc[0], row.last_np3)
        sources = [source("DaT-SPECT mean putamen SBR", number(row.dat_putamen_mean_sbr, 3), row.dat_gap_months, "Observed source"),
                   source("MoCA (out of 30)", number(row.moca_total, 0), row.moca_gap_months, "Observed source"),
                   source("LEDD (mg/day)", number(row.ledd_active_at_cutoff, 0), np.nan, "Treatment context")]
        molecular = molecules[molecules.case.eq(row.case)].set_index("field")
        for key, label in [("mol_nfl", "NfL"), ("mol_gcase_activity", "GCase")]:
            present = key in molecular.index
            sources.append(source(label, "Recorded" if present else None,
                molecular.loc[key, "capped_age_months"] if present else np.nan, "Assay evidence"))
        models = [{"name": label, "value": number(p.loc[key, "prediction"])} for key, label in [
            ("Clinical trajectory + context", "Clinical history"), ("Clinical + dated source values", "+ Dated values"),
            ("Clinical + observation process", "+ Observation process"), ("Full source-time history", "Full source-time history")]]
        models += [{"name": label, "value": number(c.loc[key, "prediction"]), "separate": True} for key, label in [
            ("hard_dominant_evidence", "Hard evidence state"), ("continuous_evidence_composition", "Continuous evidence state")]]
        result.append({"id": row.case, "motor": number(row.last_np3, 0), "slope": number(row.np3_velocity_per_year, 1),
            "visits": int(row.history_visits), "span": int(row.history_span_months), "sources": sources,
            "axes": [{"name": label, "score": number(row[f"evidence__{key}"]), "reliability": number(row[f"reliability__{key}"])} for key, label in AXES.items()],
            "history": [{"month": int(h.relative), "value": number(h.NP3TOT, 0)} for h in history.itertuples()],
            "baseline": number(row.last_np3, 0), "gap": int(row.outcome_gap_months),
            "observed": number(row.annualized_delta_np3_12m),
            "futureMotor": number(row.last_np3 + row.annualized_delta_np3_12m * row.outcome_gap_months / 12, 0),
            "forecasts": models, "uq": {"name": "Separate nested UQ mean", "center": number(u.mean_prediction),
                "low": number(u.mean_prediction - u.interval_half_width), "high": number(u.mean_prediction + u.interval_half_width)}})
    return result


def anatomy(renderer, atlas):
    """Reference geometry has a fixed neutral appearance, not invented tracer uptake."""
    fig, ax = plt.subplots(figsize=(6.2, 3.0))
    ax.set(xlim=(0, 1), ylim=(0, 1))
    ax.axis("off")
    for side, center in [("L", .26), ("R", .74)]:
        polygons = renderer.atlas_putamen_polygons(atlas, f"Allen_putamen_{side}",
            x_center=center, y_center=.55, width=.23, height=.57)
        ax.add_collection(PolyCollection(polygons, facecolors="#e4e7e8", edgecolors="#737d83", linewidths=.22, transform=ax.transAxes))
        ax.text(center, .1, "Left putamen" if side == "L" else "Right putamen", ha="center", fontsize=13, color="#182129")
    fig.subplots_adjust(left=.02, right=.98, bottom=.01, top=.99)
    fig.savefig(ASSETS / "images/reference_putamen.png", dpi=180, facecolor="white")
    plt.close(fig)


def paper2():
    renderer = read_module("66_build_aug14_case_dossiers.py", "cvc_dossiers")
    module = renderer.load_history_module()
    selected, histories, candidates, cohort = renderer.load_selected(module)
    assert len(candidates) == 32 and len(cohort) == 1204
    atlas = renderer.GLBAtlas(renderer.ATLAS_PATH)
    anatomy(renderer, atlas)
    result = []
    for _, row in selected.iterrows():
        left, right = module.reconstruct_pair(row.putamen_mean_sbr, row.putamen_signed_asymmetry)
        ml, mr = module.clinical_pair(row, "baseline")
        history = histories[histories.case.eq(row.case) & histories.relative_month.between(-24, 0)].dropna(subset=["clinical_laterality_signed"])
        result.append({"id": row.case, "motor": number(row.baseline_np3, 0),
            "leftSbr": number(left, 2), "rightSbr": number(right, 2), "leftMotor": number(ml, 0), "rightMotor": number(mr, 0),
            "imaging": number(row.putamen_signed_asymmetry), "baseline": number(row.baseline_laterality),
            "sources": [source("DaT-SPECT bilateral SBR", f"L {left:.2f}; R {right:.2f}", row.scan_clinical_gap_months, "Forecast input"),
                source("MoCA (out of 30)", number(row.moca_total, 0), row.moca_age_months, "Context only"),
                source("SAA", str(row.saa_call).capitalize(), row.saa_age_months, "Context only"),
                source("CSF alpha-synuclein / NfL", f"P{row.alpha_syn_percentile:.1f} / P{row.nfl_percentile:.1f}", row.molecular_age_months, "Context only; percentiles within 32 records"),
                source("Treatment", module.treatment_label(row), np.nan, "Forecast input")],
            "history": [{"month": int(h.relative_month), "value": number(h.clinical_laterality_signed)} for h in history.itertuples()],
            "gap": int(row.outcome_12_gap_months), "observed": number(row.outcome_12_laterality),
            "forecasts": [{"name": name, "value": number(row[f"prediction__{key}"])} for key, name in [
                ("Clinical state", "Clinical state"), ("Overall dopaminergic burden", "+ Mean SBR"),
                ("Magnitude-only imaging", "+ Magnitude only"), ("Direction-aware imaging", "+ Signed DaT")]],
            "uq": {"name": "Separate CQR median", "center": number(row.cqr_median), "low": number(row.cqr_lower), "high": number(row.cqr_upper)}})
    return result


def validate(data):
    assert [c["id"] for c in data["paper1"]] == ["P1-A", "P1-B"]
    assert [c["id"] for c in data["paper2"]] == list("ABCD")
    for paper in ["paper1", "paper2"]:
        for case in data[paper]:
            assert 9 <= case["gap"] <= 15
            assert case["history"] and all(-24 <= h["month"] <= 0 for h in case["history"])
            at_zero = [h for h in case["history"] if h["month"] == 0]
            assert len(at_zero) == 1 and np.isclose(at_zero[0]["value"], case["baseline"], atol=.0001)
            assert case["uq"]["low"] <= case["uq"]["center"] <= case["uq"]["high"]
            assert all(s["age"] is None or s["age"] >= 0 for s in case["sources"])
    serialized = json.dumps(data, allow_nan=False)
    for forbidden in ["PATNO", "cutoff_month", "anchor_month", "INFODT", "tie_hash", "/scratch/", "/home1/"]:
        assert forbidden not in serialized


def main():
    data = {"paper1": paper1(), "paper2": paper2()}
    validate(data)
    ASSETS.mkdir(parents=True, exist_ok=True)
    (ASSETS / "patient-evidence-data.js").write_text(
        "// Generated from the frozen illustrated cases; no participant identifiers or calendar dates.\n"
        + "window.PD_PATIENT_EVIDENCE = " + json.dumps(data, indent=2, allow_nan=False) + ";\n", encoding="ascii")
    print("Built 2 + 4 illustrated cases; baseline, timing, interval and export checks passed.")


if __name__ == "__main__":
    main()
