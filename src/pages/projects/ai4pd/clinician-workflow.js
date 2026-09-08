import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { FaExternalLinkAlt } from 'react-icons/fa'
import Ai4pdLayout, { Ai4pdHead } from '../../../components/ai4pd/Ai4pdLayout'
import { AI4PD_BASE, PATIENT_PORTAL_URL } from '../../../components/ai4pd/links'

const blocks = [
  {
    title: 'Multimodal fusion',
    text: 'Integrating genetics, imaging, clinical assessments, molecular bio-specimens, and wearable data from diverse populations to build comprehensive disease profiles.',
  },
  {
    title: 'Cluster identification',
    text: 'Generative population modeling uncovers latent biomarker associations, grouping patients into distinct mechanistic subtypes such as tremor-dominant (slow progression), PIGD (rapid progression), and cognitive-behavioral clusters.',
  },
  {
    title: 'Patient application',
    text: 'Population-level knowledge translates into individual care, providing the neurologist with differential diagnosis support, prognostic trajectory insights, and therapeutic trial stratification.',
  },
  {
    title: 'The twin approach',
    text: 'Translational AI enables patient-level precision therapeutics and support without replacing clinical judgment, bridging the gap between large-scale population learning and individualized decision-making.',
  },
]

const steps = [
  {
    title: 'Input data',
    text: 'Imaging, wearable, clinical, and biospecimen features from the patient encounter.',
  },
  {
    title: 'Subgroup placement',
    text: 'The patient is mapped into a population-derived subgroup that shares biology and trajectory.',
  },
  {
    title: 'Similar patients',
    text: 'Nearest-neighbor lookup surfaces comparable cases and their longitudinal outcomes.',
  },
  {
    title: 'Decision support',
    text: 'Monitoring priorities, pathway burden, and intervention context presented to the clinician.',
  },
]

const outputs = [
  [
    'Subgroup label',
    'A biomarker-defined cluster assignment with population context, indicating which patient group the individual most closely resembles.',
  ],
  [
    'Nearest neighbors',
    'The closest patients in the population map with their longitudinal trajectories and treatment outcomes.',
  ],
  [
    'Pathway burden',
    'Motor, cognitive, and autonomic pathway contributions weighted by the patient’s multimodal signature.',
  ],
  [
    'Monitoring priorities',
    'Domain-specific flags highlighting which measures warrant closest follow-up and suggested assessment intervals.',
  ],
]

const ClinicianWorkflowPage = () => (
  <Ai4pdLayout section="clinician-workflow">
    <section className="ai4pd-hero">
      <div className="ai4pd-shell">
        <p className="ai4pd-eyebrow">Clinician workflow</p>
        <h1>How clinicians use multimodal insights</h1>
        <p className="ai4pd-lead">
          Our workflow takes multimodal patient data, discovers population-level subgroups, places
          each new patient into the nearest subgroup, and delivers interpretable decision support to
          the treating neurologist.
        </p>
        <div className="ai4pd-actions">
          <a
            href={PATIENT_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ai4pd-button ai4pd-button--primary"
          >
            Open the patient portal <FaExternalLinkAlt aria-hidden="true" />
          </a>
          <Link to={`${AI4PD_BASE}/approach/`} className="ai4pd-button ai4pd-button--quiet">
            How the twin works
          </Link>
        </div>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell">
        <div className="ai4pd-grid ai4pd-grid--4">
          {blocks.map(b => (
            <article key={b.title} className="ai4pd-card">
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Population subgroup discovery and patient placement</h2>
          <p>
            Rather than treating every Parkinson&apos;s patient identically, we use multimodal data
            to discover population-level subgroups: clusters of patients who share biology and
            disease trajectory.
          </p>
          <p>
            When a new patient arrives, their multimodal features are projected into this population
            map. The system identifies the nearest subgroup and retrieves comparable patients,
            providing the clinician with outcome context drawn from real cases.
          </p>
        </div>
        <h2 style={{ marginTop: '2.5rem' }}>The pipeline</h2>
        <div className="ai4pd-steps">
          {steps.map((s, i) => (
            <div key={s.title}>
              <span>{i + 1}</span>
              <h4>{s.title}</h4>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>What the clinician sees</h2>
        </div>
        <dl className="ai4pd-dl">
          {outputs.map(([t, d]) => (
            <React.Fragment key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </React.Fragment>
          ))}
        </dl>
        <p className="ai4pd-prose">
          Explore the interactive workflow in the{' '}
          <a href={PATIENT_PORTAL_URL} target="_blank" rel="noopener noreferrer">
            patient portal
          </a>
          : pick a participant record and watch the modeled gait on an anatomical figure.
        </p>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft ai4pd-anchor" id="workflow-1">
      <div className="ai4pd-shell ai4pd-prose">
        <p className="ai4pd-eyebrow">Workflow 1</p>
        <h2>Generative latent-space modeling</h2>
        <p>
          Workflow 1 constructs harmonized latent representations from imaging, diffusion, and
          clinical modalities using scalable, robust Bayesian co-clustering. Subject-level matrices
          of region-specific imaging biomarkers (DTI, DaT-SPECT, T1 MRI) and clinical scores (UPDRS,
          MoCA, UPSIT, SCOPA-AUT) feed into the SRVCC framework.
        </p>
        <h3>Core stages</h3>
        <ol className="ai4pd-list ai4pd-list--steps">
          <li>
            <strong>Data harmonization.</strong> Skull-stripping, registration, z-score
            normalization, and wearable signal filtering produce aligned feature spaces with shared
            metadata.
          </li>
          <li>
            <strong>Latent embedding.</strong> Dual encoders with Gaussian-mixture priors learn
            patient and feature embeddings; a joint latent captures cell-level interactions.
          </li>
          <li>
            <strong>Alignment losses.</strong> Mutual-information and compositional KL
            regularizations ensure diffusion and clinical manifolds stay in register.
          </li>
          <li>
            <strong>Subtype discovery.</strong> The resulting latent checkerboard reveals
            severity-aligned clusters that inform treatment trajectories and cohort stratification.
          </li>
        </ol>
        <h3>Outputs</h3>
        <ul className="ai4pd-list">
          <li>Multimodal latent codes exported for downstream policy learning and simulation.</li>
          <li>
            Quality-controlled, analysis-ready tables for replication and external validation.
          </li>
          <li>Diagnostics that flag outliers and monitor modality drift.</li>
        </ul>
        <p>
          Workflow 1 underpins the biomarker program by supplying stable, interpretable state
          estimates rooted in multimodal evidence.
        </p>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-anchor" id="workflow-2">
      <div className="ai4pd-shell ai4pd-prose">
        <p className="ai4pd-eyebrow">Workflow 2</p>
        <h2>Clinician-centered decision and visualization pipeline</h2>
        <p>
          Workflow 2 operationalizes latent inferences for neurologists through interactive tooling.
          Outputs from Workflow 1 flow into decision-support dashboards, motion visualization, and
          sensor-clinical correlation scores that support shared decision-making.
        </p>
        <h3>Experience design</h3>
        <ul className="ai4pd-list">
          <li>
            <strong>Patient timelines.</strong> Cross-visit overlays align gait, arm swing, and
            UPDRS-III subscores, exposing deviation from subtype baselines at a glance.
          </li>
          <li>
            <strong>Motion exploration.</strong> Animated gait and arm-swing reconstructions reveal
            asymmetries that standard in-clinic tests miss, with controls for patient selection,
            animation speed, and sensor segment inspection.
          </li>
          <li>
            <strong>Cohort intelligence.</strong> Sensor-clinical correlation dashboards highlight
            divergence events, while regulatory-ready documentation tracks provenance for audits.
          </li>
        </ul>
        <h3>Deployment pipeline</h3>
        <ol className="ai4pd-list ai4pd-list--steps">
          <li>Ingest harmonized multimodal outputs from Workflow 1.</li>
          <li>
            Validate dosage safety, contraindications, and sequencing within policy recommendations.
          </li>
          <li>
            Stream personalized insights to clinician workstations and remote collaborators through
            secure UT Austin infrastructure.
          </li>
        </ol>
        <p>
          This workflow closes the loop from data harmonization to bedside impact. Neurologists gain
          interpretable, case-ready insight backed by latent modeling, while patients benefit from
          personalized, continually updated intervention plans.
        </p>
      </div>
    </section>
  </Ai4pdLayout>
)

export default ClinicianWorkflowPage

export const Head = ({ location }) => (
  <Ai4pdHead
    title="Clinician workflow"
    location={location}
    description="How clinicians use AI4PD: multimodal fusion, population subgroup discovery, nearest-neighbor patient placement, and the decision support the treating neurologist sees, with a link to the patient portal."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
