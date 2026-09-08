---
title: 'AI4PD Thrust 4: Mechanism Inference'
slug: '/projects/ai4pd/thrusts/mechanism'
date: '2025-06-01'
---

# Mechanism-Inference Thrust

_Part of [AI4PD](/projects/ai4pd/) · [Approach](/projects/ai4pd/approach/#thrusts)_

This thrust reframes Parkinson's disease analysis around biological pathways rather than symptom clusters. Using rigorously harmonized datasets from the PPMI (n = 14,473) and LRRK2 Consortium (n = 2,958), we verify 36 evidence-backed claims that map multimodal signatures to mechanistic hypotheses such as LRRK2 kinase hyperactivity, differential striatal vulnerability, and brainstem α-synucleinopathy.

## Datasets and Rigor

- **Baseline-first integration:** merges 4,775 unique patients across 388 features while avoiding longitudinal duplication.
- **No imputation policy:** only measured values enter analyses, preserving data provenance.
- **Uncertainty quantification:** Bayesian Gaussian mixture models with Dirichlet process priors determine the optimal number of phenotypes and surface mixed-pathology cases.

### Modalities and Sample Sizes

| Cohort / Dataset     | Modality Focus                               | Sample Size (n) |
| -------------------- | -------------------------------------------- | --------------- |
| PPMI Core Motor      | MDS-UPDRS III baseline assessments           | 4,166           |
| PPMI Prodromal       | UPSIT olfaction, REM sleep behavior disorder | 5,122 / 1,548   |
| LRRK2 Consortium     | LRRK2 G2019S genetic status                  | 2,958           |
| PPMI Wearables       | Arm swing asymmetry, dual-task gait metrics  | 172–178         |
| Biomarker Substudies | CSF SAA, urinary phospho-LRRK2               | 884 / 145       |

## Tier 1 Discoveries

- **Genetic pathway:** LRRK2 G2019S carriers exhibit a 1.89× increased PD risk (_χ²_ = 167.263, _p_ < 0.001), suggesting kinase hyperactivity accelerates dopaminergic degeneration. (The published preprint reports the person-level prevalence ratio as 1.92 with aOR 2.73; see the [Evidence page](/projects/ai4pd/evidence/#paper-biomarkers).)
- **Dopaminergic pathway:** Five motor phenotypes emerge from unsupervised clustering (Silhouette = 0.535), reflecting differential striatal vulnerability.
- **Cholinergic pathway:** 50.2% hyposmia prevalence (UPSIT < 25) and 37.5% REM sleep behavior disorder prevalence signal early brainstem α-synucleinopathy.
- **Wearable pathway:** Objective IMU metrics align with clinical severity, bridging digital phenotyping with mechanistic interpretation.

## Impact

Mechanism inference contextualizes findings from the other thrusts and workflows. Claims are documented with reproducible code, linking biomarker shifts to biological hypotheses and informing how policy agents prioritize interventions. Reference: Tirhekar & Yadav (2025).
