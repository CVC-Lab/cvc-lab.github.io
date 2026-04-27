"""Smoke tests for the voice_run.py CLI.

Verifies that a synthetic 1 s sine WAV survives an end-to-end pass through both
CSMA and TDMA MAC layers, and that KPIs and reconstructed WAVs are produced.

Run with:
    DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib pytest experiments/tests
"""

from __future__ import annotations

import json
import math
import os
import struct
import subprocess
import sys
import wave
from pathlib import Path

import pytest


REPO_RADIO_SIM = Path(__file__).resolve().parent.parent.parent
CLI = REPO_RADIO_SIM / "experiments" / "voice_run.py"


def _python() -> str:
    """Use the same interpreter that runs pytest."""
    return sys.executable


def _make_sine_wav(path: Path, sample_rate: int = 16000, duration_s: float = 1.0) -> None:
    n = int(sample_rate * duration_s)
    raw = b"".join(
        struct.pack(
            "<h", int(0.5 * 32767 * math.sin(2 * math.pi * 440.0 * i / sample_rate))
        )
        for i in range(n)
    )
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(raw)


def _wav_duration_s(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / wf.getframerate()


def _run(args: list[str]) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env.setdefault("DYLD_FALLBACK_LIBRARY_PATH", "/opt/homebrew/lib")
    return subprocess.run(
        [_python(), str(CLI), *args],
        cwd=str(REPO_RADIO_SIM),
        check=True,
        capture_output=True,
        text=True,
        env=env,
    )


@pytest.fixture
def workspace(tmp_path: Path) -> Path:
    in_wav = tmp_path / "in.wav"
    _make_sine_wav(in_wav)
    return tmp_path


@pytest.mark.parametrize("mac", ["csma", "tdma"])
def test_voice_pipeline_runs(workspace: Path, mac: str) -> None:
    """Pipeline round-trips a 1 s clip through the chosen MAC and produces:
       (a) an output WAV with the same duration as the input,
       (b) a KPIs JSON whose `mac` matches and whose frames_total > 0.
    """
    out_wav = workspace / f"out_{mac}.wav"
    kpis = workspace / f"kpis_{mac}.json"
    extra: list[str] = []
    if mac == "tdma":
        # TDMA's default frame cadence (~30 ms/slot/node) cannot match a 50 fps
        # voice stream without buffering, so widen the playout window so the
        # ones that do arrive aren't marked late.
        extra += ["--playout-slack-ms", "1500"]

    _run(
        [
            "--in", str(workspace / "in.wav"),
            "--out", str(out_wav),
            "--kpis", str(kpis),
            "--mac", mac,
            "--num-nodes", "2",
            "--area-m", "10",
            "--seed", "42",
            *extra,
        ]
    )

    assert out_wav.exists()
    assert _wav_duration_s(out_wav) == pytest.approx(1.0, abs=0.05)

    payload = json.loads(kpis.read_text())
    assert payload["mac"] == mac
    assert payload["frames_total"] > 0
    assert payload["frames_received"] >= 0
    assert 0.0 <= payload["pdr"] <= 1.0


def test_voice_pipeline_csma_close_range_lossless(workspace: Path) -> None:
    """At very close range, CSMA with no contenders must deliver every frame."""
    out_wav = workspace / "out_csma_lossless.wav"
    kpis = workspace / "kpis_csma_lossless.json"
    _run(
        [
            "--in", str(workspace / "in.wav"),
            "--out", str(out_wav),
            "--kpis", str(kpis),
            "--mac", "csma",
            "--num-nodes", "2",
            "--area-m", "10",
            "--seed", "42",
        ]
    )
    payload = json.loads(kpis.read_text())
    assert payload["pdr"] == pytest.approx(1.0)
    assert payload["frames_lost"] == 0
