import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Ai4pdLayout, {
  Ai4pdHead,
  Ai4pdFigure,
  SmartLink,
  LinkIcon,
} from '../../../components/ai4pd/Ai4pdLayout'
import { COMPANION_URL } from '../../../components/ai4pd/links'

const intro = [
  'AI4PD rests on a retrospective, hypothesis-generating evidence base, not on prospective clinical proof. Every result below comes from existing PD research cohorts (PPMI, BioFIND, PDBP, FoxInsight, S4, the LRRK2 Cohort Consortium) analyzed after the fact. These studies establish biomarker validity, cross-modal associations, and reproducible motor-phenotype structure. They do not establish per-patient clinical utility, and none is a diagnostic tool. The trial-enrichment companion manuscript is still in preparation and not public; its figures are not shown here.',
  'One caveat belongs at the top because it shapes the headline numbers. The motor-state results use a full aligned PPMI table of 4,773 participant identifiers that is not restricted to confirmed PD; stricter PD-only cohorts (1,123–1,923 patients) show lower stability and far higher transition rates, and no single primary cohort was prespecified. Read the rest of this page with that denominator in mind.',
  'This page lists, per study: cohorts, methods, effect sizes, limitations, and the source for each number. Where a finding is a candidate rather than a validated tool, it is labeled that way, in the authors’ own wording.',
  'The studies form one arc. We open with the two 2026 manuscripts that ask what a longitudinal claim must survive and what a signed biological coordinate reveals, then the clinical motor-state results, then the genetic, molecular, and wearable signals that move a patient toward higher risk, then the imaging-circuit mechanism beneath that heterogeneity, and we close with the co-clustering method the rest stand on.',
]

const papers = [
  {
    id: 'paper-validity-gates',
    badge: 'Manuscript, 2026',
    title: 'Validity Gates Expose Limits of Longitudinal Multimodal Parkinson Disease Prediction',
    lead: 'A model does not earn credibility from one favorable score. This study asks seven separate questions of a longitudinal multimodal prediction: was the future hidden, were people and sites separated, is the gain large enough to matter, does it survive calendar change, can uncertainty identify safer forecasts, and does the result travel to another cohort.',
    authors: 'Tirhekar, H.M., Yadav, P., Bajaj, C. (UT Austin)',
    statusNote:
      'Manuscript, 2026; arXiv submission in preparation. Full figures, the complete seven-gate audit, and the claim contract are in the research companion.',
    claim:
      'Dated multimodal history contains a reproducible internal increment for 9-to-15-month motor prediction, but the effect is clinically tiny, temporally fragile, and not externally transportable in the available export, so the protocol stops the claim before deployment language begins.',
    cohorts: [
      'Rolling-origin benchmark: 1,058 PPMI participants, 5,404 future-only prediction cutoffs; every person stays in one fold.',
      'Strict-calendar challenge: 442 later-era participants. Site-disjoint challenge: 951 people across 52 sites.',
      'Gate stress test: 8,000 controlled semisynthetic experiments. PDBP clinical transport: 77 calibration and 156 untouched test participants.',
    ],
    methods:
      'Every forecast begins at a dated cutoff; only measurements already available at that moment describe the state, with their age and absence visible, and the future examination stays hidden until evaluation. The model receives each source’s most recent eligible value, age, availability, and observation context. Seven independent gates (future-only chronology, participant separation, site separation, effect magnitude, calendar stability, selective uncertainty, external PDBP transport) each permit only their own claim.',
    primary: [
      'Chronology, participant, and site gates pass. Dated DaT-SPECT and MoCA history improve internal prediction over clinical trajectory by delta R-squared 0.015 and delta MAE −0.060 MDS-UPDRS Part III points: a measurable increment below the prespecified promotion magnitude.',
      'Calendar stability fails: the added value is not established across enrollment era. Selective uncertainty returns ABSTAIN: source-aware 90% intervals covered every eligible forecast for 90.6% of participants, yet interval width did not rank future error better than the clinical reference and reversed under calendar shift.',
      'External transport fails: a six-variable clinical model reached internal PPMI R-squared 0.134 but fell to −0.077 under raw PDBP transport; recalibration reached 0.005 and did not beat the PDBP mean reference on MAE.',
    ],
    supporting: [
      'Across 8,000 controlled experiments, the full gate limited null promotion to 0.35%, detected constructed leakage, and blocked 94.75% of calendar reversals.',
      'The local PDBP imaging export contained no eligible diagnosis-modality-time intersection, so this is a failed transport and interoperability result, not external multimodal validation.',
    ],
    limitations: [
      'The work contributes a future-only rolling-origin patient representation and executable stopping decisions; it does not claim individual clinical prognosis, calibrated mechanism probability, treatment selection, or successful external multimodal validation.',
    ],
    link: `${COMPANION_URL}pd-validity-gates/`,
    linkKind: 'static',
    linkLabel: 'Open the research companion (validity gates)',
  },
  {
    id: 'paper-signed-laterality',
    badge: 'Manuscript, 2026',
    title:
      'Signed Dopaminergic Asymmetry Tracks Contralateral Motor Laterality in Parkinson’s Disease',
    lead: 'A magnitude says that two hemispheres differ. A sign reveals which putamen has lower binding, which body side carries greater motor burden, and whether two sources agree. Preserving that direction recovers reproducible anatomy while keeping future uncertainty visible.',
    authors: 'Tirhekar, H.M., Yadav, P., Bajaj, C. (UT Austin)',
    statusNote:
      'Manuscript, 2026; arXiv submission in preparation. The outcome-blind selection audit, the 32-state map, and four de-identified patient dossiers are in the research companion.',
    claim:
      'Signed putamen asymmetry, with the sign convention frozen before analysis, aligns with contralateral MDS-UPDRS Part III laterality and replicates in an independent cohort; it is biological evidence, not a calibrated mechanism probability.',
    cohorts: [
      'PPMI biological analysis: n = 1,367. Independent S4 replication: n = 56, same sign map, neither reversed nor retuned.',
      'Future-only PPMI analysis: 1,204 landmarks; 32 records met the strict same-month multimodal completeness gate, from which four illustrative dossiers (concordant, mirror-concordant, near-symmetric, cross-source conflict) were selected before their futures were viewed.',
    ],
    methods:
      'Positive imaging values are fixed to relatively lower left putamen binding; positive clinical values to greater right-body burden. The orientation is defined before analysis and carried unchanged across PPMI, S4, and future outcomes. Records are selected using only landmark evidence, source freshness, model disagreement, interval width, and a hashed tie-breaker; future value, sign, and error never enter the selection.',
    primary: [
      'Signed putamen asymmetry aligned with contralateral clinical laterality in PPMI (r = 0.676) and independently in S4 (r = 0.551).',
      'In 1,204 PPMI landmarks, each 0.1 increase in baseline signed putamen asymmetry corresponded to a 0.0507 increase in 12-month clinical laterality (95% CI 0.0387–0.0626); held-out R-squared improved by 0.0176 over a non-directional comparator, a measurable but modest increment.',
    ],
    supporting: [
      'Greater imaging-clinical disagreement was associated with lower directional persistence (odds ratio 0.491 per IQR-standardized unit). Disagreement is retained rather than forced into one label.',
      'Case labels are arbitrary and one-use, time is relative to each landmark, and displayed values are rounded; the dossiers contain no identifier, calendar date, source record, or participant scan.',
    ],
    limitations: [
      'Replication supports a transferable anatomical coordinate; it does not establish a causal mechanism, clinical diagnosis, or treatment target. A clear current state does not guarantee a precise future state.',
    ],
    link: `${COMPANION_URL}pd-signed-laterality/`,
    linkKind: 'static',
    linkLabel: 'Open the research companion (signed laterality)',
  },
  {
    id: 'paper-motor-states',
    badge: 'bioRxiv 2026 · MICCAI 2026',
    title:
      'Posterior-Calibrated Multimodal Motor States Reveal Longitudinal and Imaging-Associated Heterogeneity in Parkinson’s Disease',
    lead: 'This work asks where a patient sits among motor profiles and how that position moves over time. It models PD motor phenotype as calibrated posterior trajectories over a small set of severity-aware states, drawn from the PPMI motor record.',
    authors: 'Tirhekar, H.M., Yadav, P., Bajaj, C. (UT Austin)',
    statusNote:
      'Preprint, bioRxiv 2026.06.12.732003. A conference version, “Posterior-Aware Motor Phenotyping with Multimodal Imaging Validation in Parkinson’s Disease,” is accepted at MICCAI 2026 (paper 4053) and has its own interactive paper page.',
    claim:
      'PD motor phenotype is better represented as calibrated, dynamic posterior trajectories over a small set of severity-aware motor-state profiles than as fixed biological subtypes.',
    cohorts: [
      'Primary analytic cohort: the full aligned table of 29,366 complete MDS-UPDRS-III motor visits across 4,773 unique PPMI participant identifiers. This is an alignment-table ID count, not a vetted confirmed-PD patient count, and was not prespecified as the primary clinical cohort.',
      'Stricter PD-only definitions are reported only as sensitivity cohorts: PRIMDIAG==1 = 19,032 visits / 1,923 patients; PD cohort = 16,899 / 1,602; PD-cohort-and-enrolled = 12,143 / 1,123.',
      'Subsets within the full table: 2,014 patients with ≥5 visits; 24,593 next-visit prediction rows from 3,775 patients; a fused-imaging subset of 1,041 patients with DaTSCAN + FreeSurfer; 48 matched severe-tremor vs severe-axial patient pairs; SHAP on a 500-patient sample.',
      'External validation: BioFIND, 344 post-dose MDS-UPDRS-III visits from 225 patients, used for face validity and distribution-shift only, with no ground-truth state labels.',
    ],
    methods:
      'A frozen 5-component Bayesian Gaussian mixture, selected from a prior 2,912-config sweep, assigns probabilistic visit-level motor states, which are averaged to a patient-level phenotype-family posterior. “Calibration” here means refit stability (250 patient-blocked bootstrap refits with Hungarian label alignment, ECE_stab), not calibration to any biological ground truth. Severity is residualized out to test for residual profile structure. Patient-held-out (GroupKFold) tree and boosting models predict next-visit transition, future axial burden, and the 5-D soft posterior from DaTSCAN SBR plus FreeSurfer ASEG features. BioFIND transfer reassigns states and tests endpoint gradients (Kruskal-Wallis eta²) with 1,000-replicate bootstrap CIs.',
    primary: [
      'Patient-level stability is high: mean modal-family fraction 0.925 (95% CI 0.921–0.930), mean modal-state fraction 0.918, mean dwell time 3.35 visits.',
      'The model reports its own overconfidence: mean nominal posterior confidence 0.989 against mean bootstrap label consistency 0.849, with full-table ECE_stab 0.140 and Brier-like inconsistency 0.084 (95% CI 0.080–0.090). The gap is measured, not hidden.',
      'Imaging is associated with the states but does not independently recover the taxonomy. Supervised, fused DaTSCAN + FreeSurfer features predict the soft posterior (RF JSD 0.209, 95% CI 0.199–0.220; macro-AUROC 0.692; soft-label ECE 0.034). Unsupervised imaging clusters do not reproduce the motor states (DaTSCAN-only ARI 0.005, MRI-only 0.023, fused-inner 0.015, against motor-only ARI 0.451).',
    ],
    supporting: [
      'Dynamics: 25.5% of patients changed motor state at least once over follow-up (95% CI 24.1–26.7%). In the stricter PD-only sensitivity cohorts the transition fraction is far higher (58.0% / 61.6% / 63.8%) and modal-family is lower (0.830 / 0.820 / 0.812). The wider, non-PD-restricted denominator is why the headline transition rate looks low.',
      'Severity dominates motor-domain variance (bradykinesia R²=0.850, rigidity 0.696, bulbar 0.674, axial 0.448, tremor 0.423), yet the residual mixture still retains 5 active components; raw-versus-residual ARI 0.228, NMI 0.147, so the residual profile is a different axis from raw burden.',
      'Imaging attribution: adding severity and demographics improves prediction to JSD 0.188 (ECE 0.015); DaTSCAN-only (JSD 0.213) is more informative than MRI-only (JSD 0.266). The strongest single imaging predictor is mean putamen SBR (held-out permutation ΔJSD 0.036), then caudate asymmetry (0.013).',
      'Temporal prediction (patient-held-out): future axial burden, best XGBoost R²=0.605 against an autoregressive baseline of 0.505; future state transition (19.0% of rows) XGBoost AUC 0.830 (95% CI 0.822–0.837), Cox concordance 0.620.',
      'BioFIND face validity (344 visits / 225 patients): PPMI-versus-BioFIND distribution JSD 0.069 (a modest shift); assigned-state endpoint gradients eta² severity 0.628 (95% CI 0.537–0.712), H&Y 0.568, axial 0.550, tremor 0.541, bradykinesia 0.513; tremor-minus-axial profile eta² 0.370.',
    ],
    limitations: [
      'The headline denominator was not prespecified. The full aligned 4,773-identifier table is used, while defensible PD-only filters give much smaller Ns (1,123–1,923) and lower stability.',
      'The 5-state space was frozen and discovered before downstream validation. A fully nested train-patient discovery plus test-patient assignment loop was not done and is the strongest remaining leakage sensitivity.',
      '“Calibration” means refit stability, not calibration to biological ground truth; the latent states have no gold-standard labels.',
      'Imaging is ROI-level only (DaTSCAN plus FreeSurfer); no voxel-level CNN or transformer models were tested. MRI contributes only modest complementary signal in this early/progression cohort.',
      'BioFIND validation is limited by sample size and modalities. It is endpoint face validity and distribution-shift, not proof of transportability or a subtype taxonomy.',
      'The authors explicitly do not claim five true biological subtypes. The 5 states are calibrated, dynamic, severity-aware motor phenotypic profiles, not a subtype ontology. Therapy-response, DBS-target, and multi-omics uses are forward-looking hypotheses, not results.',
    ],
    link: 'https://doi.org/10.64898/2026.06.12.732003',
    linkKind: 'external',
    linkLabel: 'View preprint (bioRxiv)',
    secondLink: {
      href: '/projects/posterior-aware-pd-phenotyping-miccai/',
      kind: 'static',
      label: 'MICCAI 2026 interactive paper page',
    },
    companion: {
      title: 'Companion manuscript, trial enrichment (in preparation)',
      intro:
        'A separate in-preparation manuscript by the same group reuses motor-phenotype machinery for a different question: finding rapid progressors for trial enrichment. These are two distinct manuscripts; the numbers do not transfer between them. The work above is PPMI-only, uses a 5-component Bayesian Gaussian mixture, and reports the stability, transition, imaging-recovery, and BioFIND face-validity figures. The companion below is a four-cohort study, uses HDBSCAN, and reports 70 phenotypes and a Silhouette of 0.9175. Do not carry numbers across.',
      cohorts:
        'A deduplicated multi-cohort set of 62,543 unique patients and 221,437 motor assessments across four initiatives (PPMI, FoxInsight, PDBP, BioFIND), spanning 2010–2025. Per-cohort denominators are deliberately not stated here: the manuscript’s two cohort tables disagree (for example PPMI 1,758 versus 4,786; BioFIND 124 versus 215), though both tables sum to 62,543. This BioFIND constituent is a different extraction from, and should not be confused with, the 344-visit / 225-patient BioFIND face-validity sample used by the motor-states work above. The longitudinal trajectory analysis is run on a 3,261-patient cohort with ≥3 visits.',
      methods:
        'HDBSCAN (min_cluster_size=30, min_samples=15) selected via 5×5 nested cross-validation by Silhouette, with 1,000-resample bootstrap uncertainty and a LRRK2 G2019S burden analysis (Mann-Whitney U, Cohen’s d, bootstrap CI).',
      findings: [
        'HDBSCAN discards roughly 77% of patients as noise by design (a high-confidence-core approach). The reported Silhouette of 0.9175 is computed on retained core points only and is far above the 0.35–0.55 typical of prior PD clustering, so it should not be read as out-of-sample separation. Bootstrap runs put the cluster count at 78–116, against a headline of 70; the manuscript reports this instability but does not fully reconcile it.',
        'Within the 3,261-patient ≥3-visit trajectory cohort, three trajectories emerge: Improvers 19.0% (n=617), Stable 64.5% (n=2,102), and a Rapid Progressor subgroup of 16.6% (n=542). The Rapid Progressor group worsens by +2.02 MDS-UPDRS-III points per ~6-month visit (about +4 points/year). That annual figure assumes roughly 6-month, regularly spaced visits and linear progression, which the authors have not yet modeled with an irregular-time progression model. They call this a candidate trial-enrichment signal, not a validated biomarker.',
        'The companion also reports the LRRK2 G2019S motor-burden effect (+4.35 points). This is the same LRRK2-consortium analysis that is the headline of the integrated-biomarkers preprint below; one analysis in two manuscripts, not an independent replication.',
      ],
      limitations:
        'The Rapid Progressor signal and all trial-efficiency projections are explicitly illustrative and require prospective and regulatory confirmation. The primary Silhouette (0.9175) sits well above the bootstrap mean (0.859), and a sex-difference table reports values likely contaminated by the data-entry anomalies its own QC flags.',
    },
  },
  {
    id: 'paper-biomarkers',
    badge: 'medRxiv 2025',
    title:
      'Integrated Genetic, Molecular, and Wearable Sensor Biomarkers Enable Bayesian Machine Learning-Driven Precision Stratification in Parkinson’s Disease',
    lead: 'Where the motor-state work models where a patient sits among motor profiles over time, this study asks what signals move a patient toward higher risk and severity: genetics, molecular assays, wearable gait, prodromal markers, and clinical scales. It draws on the same PPMI substrate plus the LRRK2 Cohort Consortium.',
    authors:
      'Tirhekar, H.M., Yadav, P., Bajaj, C. (Computational Visualization Center, Oden Institute, UT Austin)',
    statusNote: 'Preprint, medRxiv 2025.12.02.25340302 (posted 2025-12-04), not peer-reviewed.',
    claim:
      'Genetics (LRRK2 G2019S), molecular assays, wearable gait features, prodromal signals, and clinical scales can be combined into Bayesian patient phenotypes for cross-sectional precision stratification.',
    cohorts: [
      'PPMI: 4,775 unique patients, 14,473 longitudinal assessment records, 14.5-year span. Per-modality baseline Ns: motor MDS-UPDRS-III 4,166 assessments / 3,991 patients; MoCA 13,835 / 3,842; UPSIT 5,122 / 3,805; RBD 1,548 / 1,015; SCOPA-AUT 14,284 / 3,854; gait IMU substudy 172–186 assessments / 93–100 patients.',
      'LRRK2 Cohort Consortium: 627 individuals (347 G2019S carriers, 280 age-matched non-carrier controls), 2,958 specimens across six tissue types, Ashkenazi-enriched, analyzed at the person level. Molecular substudies: urinary phospho-S1292-LRRK2 n=884; CSF alpha-synuclein RT-QuIC n=145.',
      'Tri-modal complete subset (MoCA + UPSIT + gait) n=204, used to train and internally validate the risk model. Cross-sectional, complete-case, no imputation.',
    ],
    methods:
      'Person-level chi-square and log-transformed Wald prevalence ratios plus sex-adjusted multivariable logistic regression for the LRRK2-PD association; Mann-Whitney rank-sum with rank-biserial r (1,000-iteration bootstrap CIs) for motor-severity comparisons; paired t-tests with Cohen’s d_z for dual-task gait; Bayesian Gaussian Mixture Models with Dirichlet Process priors selected via ELBO and validated by Silhouette / Davies-Bouldin / Calinski-Harabasz and 200-iteration bootstrap Jaccard; penalized logistic regression with nested 5×5 CV, DeLong CIs, calibration, and decision-curve analysis for the integrated risk model. Benjamini-Hochberg FDR (q=0.05) within hypothesis families.',
    primary: [
      'LRRK2 G2019S PD prevalence ratio 1.92 (95% CI 1.54–2.40): 50.1% (174/347) in carriers versus 26.1% (73/280) in non-carriers; chi-square(1)=36.6, p=1.44×10⁻⁹. Sex-adjusted odds ratio aOR 2.73, with full adjustment for age, duration, site, and ancestry noted as pending.',
      'Carriers with PD show a +4.35-point higher baseline MDS-UPDRS-III (95% CI 1.95–6.47; 12.63±14.13 versus 8.27±12.99; Mann-Whitney U=44,082, p=7.31×10⁻⁸; Cohen’s d=0.318), about a 12–15% relative increase. This is the same LRRK2-consortium analysis referenced by the trial-enrichment companion above; one analysis in two manuscripts, not an independent replication.',
      'Prodromal prevalence: hyposmia (UPSIT<25) 50.2% (2,573/5,122 from 3,805 patients); RBD 37.5% (581/1,548 from 1,015 patients); cognitive impairment (MoCA<26) 25.9%.',
    ],
    supporting: [
      'The LRRK2 paradox: carriage raised PD prevalence as above while carriers showed better olfaction and lower CSF seed-amplification positivity than expected, a synuclein-low / kinase-high pattern the authors flag for follow-up.',
      'Wearable gait: arm-swing asymmetry, 27% (48/178 assessments from 94 patients) exceed the 20% pathological lateralization threshold; dual-task cost 14.87%±12.93% gait-speed degradation under cognitive load (paired t=14.98, df=171, p<0.001, Cohen’s d_z=1.15, n=172 / 93); Timed Up and Go, 29% (54/186 from 100 patients) exceed the >12s threshold.',
      'Bayesian GMM selected K=4 by ELBO; Silhouette 0.535, bootstrap Jaccard 0.769±0.161; two major phenotypes (mild 87.3%, moderate-severe 12.6%) plus two singleton outliers; superior to K-means (0.170).',
      'Integrated tri-modal risk model (UPSIT plus gait, MoCA<26 outcome): AUC 0.717±0.163, Brier 0.205±0.043, calibration slope 1.197, with positive net benefit across thresholds of roughly 0.10–0.80.',
    ],
    figures: true,
    limitations: [
      'Primarily cross-sectional (baseline-first): establishes biomarker validity and cross-modal associations, not temporal or causal precedence or progression. Longitudinal and time-to-event modeling are deferred.',
      'Complete-case, no imputation, which may limit generalizability if missingness is non-random.',
      'The aOR (2.73) controlled only for sex; full adjustment for age, duration, site, and ancestry principal components is planned, not done.',
      'Genetics rest on a single high-penetrance variant (G2019S) in an Ashkenazi-enriched consortium; SNCA, GBA1, PINK1, PRKN, VPS35, and polygenic scoring are not incorporated, so findings may not generalize to idiopathic or other-genetic PD.',
      'The risk model was trained and internally validated on n=204 with no external cohort; the calibration slope of 1.197 indicates slight overconfidence.',
      'Molecular assay performance figures are cited from prior literature, not newly benchmarked. This is a non-peer-reviewed preprint.',
    ],
    link: 'https://doi.org/10.64898/2025.12.02.25340302',
    linkKind: 'external',
    linkLabel: 'View preprint (medRxiv)',
    secondLink: {
      href: '/projects/integrated-pd-precision-stratification',
      kind: 'internal',
      label: 'Project page',
    },
  },
  {
    id: 'paper-pathway',
    badge: 'bioRxiv 2025',
    title:
      'Pathway-Anchored Multimodal Clustering Reveals Circuit-Level Signatures in Parkinson’s Disease',
    lead: 'The preceding papers describe heterogeneity from clinical, genetic, and wearable signals. This one asks whether that heterogeneity has an imaging-circuit mechanism, fusing structural MRI, diffusion MRI, and DaT-SPECT inside six predefined anatomical pathways.',
    authors:
      'Vinod, A., Ellendula, A.S., Bhardwaj, S., Dev, A., Dominic, A., Bajaj, C. (UT Austin; Amrita Vishwa Vidyapeetham)',
    statusNote:
      'Preprint, bioRxiv 2025.12.15.694278 (posted Dec 18, 2025; CC-BY 4.0), not peer-reviewed.',
    claim:
      'Fusing structural MRI, diffusion MRI, and DaT-SPECT inside six predefined anatomical circuits yields an interpretable, pathway-level imaging map of PD heterogeneity that tracks motor and cognitive burden.',
    cohorts: [
      'PPMI, single cohort, cross-sectional. Full N=294 participants: 185 PD (62.9%), 72 healthy controls (24.5%), 37 SWEDD (12.6%).',
      'Baseline (PD): age 64.2±9.1, disease duration 1.9±1.1 years (early-stage), MoCA 26.3±2.4, MDS-UPDRS-III 21.7±9.6 (versus HC 1.6±2.1).',
      'Imaging (T1, DTI/FWE-DTI, DaTSCAN SPECT) was acquired for all 294; after QC, the effective N for the MPIS and MPIS-clinical analyses is n=283, and the cluster-composition table (PD/SWEDD only) totals 167. The correlation statistics below are computed on n=283, not on the full 294.',
    ],
    methods:
      'Region-wise structural (T1 volumes), diffusion (FA/MD, free-water-corrected), and DaT-SPECT (striatal SBR) features were extracted via a FastSurferCNN/DKT-atlas pipeline, binned into six PD-relevant pathways, and aggregated into a per-subject Multimodal Pathway Integrity Score (MPIS, an equal-weight z-scored composite with MD entered negatively). A Scaled Robust Variational Compositional Co-clustering (SRVCC) model jointly learned patient and feature clusters (K_r=K_c=5 by model selection). Pathway MPIS were related post hoc to MDS-UPDRS-III, MoCA, and QUIP via Spearman correlations with Benjamini-Hochberg FDR (q=0.05) and covariate-adjusted regression.',
    primary: [
      'Six predefined pathways (nigrostriatal motor, frontostriatal-executive, cerebello-thalamo-cortical, limbic/mesolimbic, microvascular-burden, sensory/visuospatial), summarized via MPIS, and five imaging-driven patient clusters (K_r=K_c=5; stability median ARI 0.82, IQR 0.78–0.86 across 10 seeds; NMI median 0.88).',
      'Lower nigrostriatal integrity tracks higher motor burden: Spearman rho=−0.201, q=6.8×10⁻⁴ (95% CI −0.30 to −0.09), with strong cross-cluster separation (Kruskal-Wallis H=167.15, eta²=0.587).',
      'Higher sensory/visuospatial integrity tracks better cognition: rho=0.163, q=0.0071 (95% CI 0.04–0.28), with cluster separation H=170.68, eta²=0.629.',
    ],
    supporting: [
      'Frontostriatal-executive versus MDS-UPDRS-III: rho=−0.191, q=0.0014, a second motor-anchored circuit. Limbic/mesolimbic versus MoCA: rho=0.119, q=0.045, a modest positive cognition link.',
      'The microvascular-burden pathway stratifies imaging strongly (H=127.11, eta²=0.445) but shows near-zero clinical correlation (all q>0.1), consistent with a modifier rather than a primary-effect role.',
      'All MPIS-clinical associations are FDR-controlled; covariate-adjusted coefficients remained directionally consistent. Conclusions were robust to MPIS modeling choices (primary versus ICV-normalized, reweighted, or unsigned-MD variants were highly correlated, median Pearson r ≈ 0.96).',
    ],
    limitations: [
      'A single, deeply phenotyped cohort (PPMI), enriched for early-stage PD; generalizability to diverse populations, later stages, and community samples is unestablished.',
      'Cross-sectional only; no longitudinal or progression modeling.',
      'Residual confounds may persist despite QC (site/scanner effects, diffusion artefacts, DaTSCAN-to-T1 coregistration, partial-volume effects).',
      'A restricted imaging feature set (no cortical thickness, advanced diffusion indices, or cholinergic nuclei).',
      'Effect sizes are explicitly “generally modest.” The framework is explicitly not a diagnostic tool, and cluster labels should not be applied to individual patients.',
      'Substantial QC attrition: of 294 acquired scans per modality only 167 passed, so the effective sample (n=283; cluster tables 167) is well below the headline cohort of 294.',
    ],
    link: 'https://doi.org/10.64898/2025.12.15.694278',
    linkKind: 'external',
    linkLabel: 'View preprint (bioRxiv)',
    secondLink: {
      href: '/projects/pathway-anchored-pd-clustering',
      kind: 'internal',
      label: 'Project page',
    },
  },
  {
    id: 'paper-coclustering',
    badge: 'arXiv 2025',
    title: 'Scalable Robust Bayesian Co-Clustering with Compositional ELBOs (SRVCC)',
    lead: 'The papers above all rest on one assumption: that patients and features can be jointly clustered in a robust latent space. This methods paper is that substrate. We place it last for the reader, but it is foundational, the floor the clinical results stand on, not a clinical result itself.',
    authors: 'Vinod, A., Bajaj, C. (UT Austin)',
    statusNote:
      'Preprint, arXiv:2504.04079v2 (8 Apr 2025), a machine-learning methods contribution. The PD application appears only in the appendix as preliminary, future work.',
    claim:
      'SRVCC provides the learned latent space AI4PD’s stratification could build on, jointly learning patient and feature clusters with built-in noise and missing-input robustness. In this paper the PD use is appendix-level, exploratory future work, not a clinical result.',
    cohorts: [
      'The main empirical results use general-ML benchmark datasets, not a PD cohort: Coil20, Yale, Fashion-MNIST-test, and several Web/text sets (the WebKB family, IMDb).',
      'The PD application is confined to the appendix: PPMI, roughly 107 patients × 210 features (UPDRS-III, MoCA, QUIP, T1-MRI volumetrics, DTI integrity, DaTSCAN binding). The cluster count was a fixed hyperparameter, not inferred from data. There is no train/test split, external validation, or outcome prediction for the PD analysis.',
    ],
    methods:
      'SRVCC is a fully variational co-clustering framework: two VAEs (one over rows/instances, one over columns/features), each with a Gaussian Mixture Model latent prior, plus a third joint latent (z_rc) capturing cell-level row-column interactions, so patient and feature clusters are learned jointly end-to-end without a post-hoc clustering step. The objective is a compositional ELBO combining per-side reconstruction, a doubly reparameterized gradient (DREG) estimator, an InfoNCE contrastive cross-loss, and a mutual-information term aligning the row and column partitions; the joint latent absorbs cell-specific noise for robustness to corrupted and missing inputs.',
    primary: [
      'The method provides a population latent-space substrate via VAE embeddings (z_r for patients, z_c for features, z_rc for cell-level joint structure), the kind of learned space a digital twin can build on. The authors’ stated future direction is early PD biomarker discovery and longitudinal analysis.',
      'It jointly produces patient (row) and feature (column) co-clusters in one model, plus cell-level memberships, and demonstrates missing-input robustness: it recovers coherent co-clusters under 70% noise plus 30% missing values.',
    ],
    supporting: [
      'Benchmark accuracy (ACC) against the prior best DeepCC: Yale 58.1 (DeepCC 53.3), Fashion-MNIST-test 68.2 (62.7), WebKB4 83.2 (71.8); SRVCC wins on most web/text sets and on Yale and Fashion-MNIST, but is comparable or slightly worse on Coil20. Ablation: the two-stage compositional ELBO beats a simple cascade, and adding DREG further improves ACC/NMI.',
      'PPMI/PD (appendix, exploratory only): co-clustering separated PD patients by motor and cognitive severity and imaging, flagging striatal DaTSCAN (especially putamen) and ventricular/subcortical volumes as leading candidate biomarkers. These are qualitative observations, not validated effect sizes.',
    ],
    limitations: [
      'The PD analysis is explicitly preliminary, future work; the digital-twin and biomarker-discovery framing is aspirational, not an established clinical result.',
      'No PD validation: no train/test split, no external or replication cohort, no progression prediction, no effect sizes or CIs; PD clusters are interpreted narratively.',
      'Cluster counts are user-set hyperparameters, not inferred (DP priors were avoided for scalability). There is no human-subjects or prospective clinical evaluation anywhere in the paper.',
    ],
    link: 'https://arxiv.org/abs/2504.04079',
    linkKind: 'external',
    linkLabel: 'View preprint (arXiv)',
    secondLink: {
      href: '/projects/scalable-robust-bayesian-co-clustering/',
      kind: 'internal',
      label: 'Project page',
    },
  },
]

const Findings = ({ heading, items }) => (
  <>
    <h3>{heading}</h3>
    <ul className="ai4pd-list">
      {items.map(t => (
        <li key={t.slice(0, 60)}>{t}</li>
      ))}
    </ul>
  </>
)

Findings.propTypes = {
  heading: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
}

const BiomarkerFigures = () => (
  <div className="ai4pd-figure-row">
    <Ai4pdFigure
      name="03_moca_upsit_distributions"
      alt="MoCA and UPSIT score distributions in PPMI"
      caption="MoCA (n=13,835): 25.9% below the MCI threshold. UPSIT (n=5,122): 50.2% hyposmic. Prodromal-marker prevalence in the PPMI cohort."
    />
    <Ai4pdFigure
      name="05_arm_swing_asymmetry"
      alt="Wearable arm-swing asymmetry distribution across 178 assessments"
      caption="Wearable arm-swing asymmetry: 27% of 178 assessments (94 patients) exceed the 20% pathological lateralization threshold."
    />
    <Ai4pdFigure
      name="09_tug_performance"
      alt="Timed Up and Go performance distribution across 186 assessments"
      caption="Timed Up and Go (n=186): 29% exceed the >12 s impairment threshold (54/186 from 100 patients)."
    />
  </div>
)

const EvidencePage = () => (
  <Ai4pdLayout section="evidence">
    <section className="ai4pd-hero">
      <div className="ai4pd-shell">
        <p className="ai4pd-eyebrow">Evidence</p>
        <h1>Cohorts, methods, effect sizes, and limits, per study</h1>
        {intro.map(p => (
          <p
            key={p.slice(0, 40)}
            className="ai4pd-lead"
            style={{ fontSize: '1.05rem', marginBottom: '1rem' }}
          >
            {p}
          </p>
        ))}
        <nav
          className="ai4pd-jump"
          aria-label="Studies on this page"
          style={{ marginTop: '1.5rem' }}
        >
          On this page:{' '}
          {papers.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 && ' · '}
              <a href={`#${p.id}`}>{p.title.split(':')[0].split(' Reveal')[0].slice(0, 48)}</a>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </section>

    <div className="ai4pd-shell">
      {papers.map(p => (
        <section key={p.id} id={p.id} className="ai4pd-evidence ai4pd-anchor ai4pd-prose">
          <span
            className={`ai4pd-badge${/^Manuscript/.test(p.badge) ? '' : ' ai4pd-badge--public'}`}
          >
            {p.badge}
          </span>
          <h2>{p.title}</h2>
          <p>{p.lead}</p>
          <p className="ai4pd-meta">
            <strong>Authors:</strong> {p.authors}
          </p>
          <p className="ai4pd-meta">
            <strong>Status:</strong> {p.statusNote}
          </p>

          <h3>Claim</h3>
          <p>{p.claim}</p>

          <h3>Cohorts</h3>
          <ul className="ai4pd-list">
            {p.cohorts.map(c => (
              <li key={c.slice(0, 60)}>{c}</li>
            ))}
          </ul>

          <h3>Methods</h3>
          <p>{p.methods}</p>

          <Findings heading="Primary findings" items={p.primary} />
          <Findings heading="Supporting metrics" items={p.supporting} />

          {p.figures && <BiomarkerFigures />}

          <Findings heading="Limitations" items={p.limitations} />

          {p.companion && (
            <div className="ai4pd-evidence__companion">
              <h3>{p.companion.title}</h3>
              <p>{p.companion.intro}</p>
              <h4>Cohorts</h4>
              <p>{p.companion.cohorts}</p>
              <h4>Methods</h4>
              <p>{p.companion.methods}</p>
              <h4>Findings</h4>
              <ul className="ai4pd-list">
                {p.companion.findings.map(t => (
                  <li key={t.slice(0, 60)}>{t}</li>
                ))}
              </ul>
              <h4>Limitations</h4>
              <p>{p.companion.limitations}</p>
            </div>
          )}

          <p className="ai4pd-evidence__link">
            <SmartLink href={p.link} kind={p.linkKind} className="ai4pd-inline-link">
              {p.linkLabel} <LinkIcon kind={p.linkKind} />
            </SmartLink>
            {p.secondLink && (
              <>
                {' '}
                &middot;{' '}
                <SmartLink
                  href={p.secondLink.href}
                  kind={p.secondLink.kind}
                  className="ai4pd-inline-link"
                >
                  {p.secondLink.label} <LinkIcon kind={p.secondLink.kind} />
                </SmartLink>
              </>
            )}
          </p>
        </section>
      ))}
    </div>

    <section className="ai4pd-section ai4pd-section--dark" style={{ marginTop: '2rem' }}>
      <div className="ai4pd-shell">
        <div className="ai4pd-section-heading">
          <p className="ai4pd-eyebrow">All listings</p>
          <h2>Every paper, in one list</h2>
          <p>
            The same studies as citable entries. All of them also appear on the CVC{' '}
            <Link to="/publications/" style={{ color: '#f3b681' }}>
              publications page
            </Link>
            .
          </p>
        </div>
        <ol className="ai4pd-paper-list">
          {papers.map((p, i) => (
            <li key={p.id}>
              <span className="ai4pd-paper__number">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{p.title}</h3>
                <p>
                  {p.authors}. {p.badge}.
                </p>
                <SmartLink href={p.link} kind={p.linkKind}>
                  {p.linkLabel} <LinkIcon kind={p.linkKind} />
                </SmartLink>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  </Ai4pdLayout>
)

export default EvidencePage

export const Head = ({ location }) => (
  <Ai4pdHead
    title="Evidence"
    location={location}
    description="The AI4PD evidence base, study by study: cohorts, methods, effect sizes, limitations, and sources for the validity-gates and signed-laterality manuscripts, the posterior-calibrated motor-state work, integrated biomarkers, pathway-anchored imaging, and SRVCC co-clustering."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
