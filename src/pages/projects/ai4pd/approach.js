import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Ai4pdLayout, {
  Ai4pdHead,
  Ai4pdFigure,
  LinkIcon,
} from '../../../components/ai4pd/Ai4pdLayout'
import { AI4PD_BASE, PATIENT_PORTAL_URL } from '../../../components/ai4pd/links'

const thrusts = [
  {
    label: 'Imaging',
    text: 'DaT-SPECT and T1 MRI run through automated atlas-constrained segmentation and MNI coregistration; per-ROI features fuse with clinical and molecular measures.',
    to: `${AI4PD_BASE}/thrusts/imaging/`,
  },
  {
    label: 'Diffusion and clinical co-clustering',
    text: 'Free-water-corrected DTI is fused with UPDRS and MoCA scores in a robust variational co-clustering framework that aligns microstructural and clinical manifolds into observational subtypes.',
    to: `${AI4PD_BASE}/thrusts/diffusion/`,
  },
  {
    label: 'Wearable and cognitive phenotyping',
    text: 'APDM Opal IMUs over sway, TUG, and dual-task walk yield 50+ gait and arm-swing features, combined with cognitive batteries. These help mainly when fused: the gait IMU substudy is roughly 93–100 patients and the integrated risk model is internally validated on n=204 with no external cohort, so treat it as hypothesis-generating.',
    to: `${AI4PD_BASE}/thrusts/wearable/`,
  },
  {
    label: 'Mechanism inference',
    text: 'Statistical testing across harmonized PPMI and LRRK2-consortium cohorts associates biomarkers with candidate pathways. These are FDR-controlled, cross-sectional associations and hypotheses for follow-up, not causal claims, and cluster labels are not applied to individual patients.',
    to: `${AI4PD_BASE}/thrusts/mechanism/`,
  },
]

const components = [
  {
    term: 'H, an energy-like storage function',
    def: 'A model-internal latent used as a compact summary of control margin. It is not a measured biological reserve and has no validated clinical referent; its values are meaningful only relative to the fitted model.',
  },
  {
    term: 'J, interconnection geometry',
    def: 'How the motor, autonomic, and cognitive subsystems exchange influence.',
  },
  {
    term: 'R, dissipation',
    def: 'The structural term that makes the storage function decay rather than persist. It is a modeling device for irreversibility, not a measurement of a patient’s neurodegeneration rate.',
  },
  {
    term: 'Therapy ports',
    def: 'Where medication, rehabilitation, and stimulation enter the dynamics.',
  },
]

const outputs = [
  {
    term: 'Current patient state',
    def: 'Motor, cognitive, and functional estimates from EHR, imaging, biomarkers, wearables, medication history, and DBS/LFP signals when available; autonomic estimates are an aspirational layer not yet backed by a dedicated validated result.',
  },
  {
    term: 'Differential-diagnosis support (planned, not validated)',
    def: 'Intended ranked support for Parkinson’s versus look-alikes (MSA, PSP, DLB) with uncertainty and missing-evidence flags. This is contributory to, not a replacement for, expert assessment; discriminating PD from these look-alikes is difficult even for specialists, and no cited result yet evaluates this differential.',
  },
  {
    term: 'Progression forecast (research aim, not validated)',
    def: 'The twin is being designed to estimate longitudinal trajectories. Specific endpoints such as 12-month MDS-UPDRS-III change and time-to-motor-fluctuation are pre-registered validation targets, not demonstrated predictions; the current evidence base is cross-sectional, individual-level prediction has not been established, and any forecast must report ON/OFF medication state and is not a substitute for clinical follow-up.',
  },
  {
    term: 'Medication and therapy planning',
    def: 'Levodopa-response support, rehabilitation planning, and ranked options filtered through safety agents.',
  },
  {
    term: 'DBS planning support (planned, see above)',
    def: 'Twin-side simulation of candidate stimulation changes before any patient parameter is altered.',
  },
  {
    term: 'Follow-up and evidence gaps',
    def: 'Personalized next steps for monitoring, reassessment, and uncertainty reduction.',
  },
]

const ApproachPage = () => (
  <Ai4pdLayout section="approach">
    <section className="ai4pd-hero">
      <div className="ai4pd-shell">
        <p className="ai4pd-eyebrow">How AI4PD works</p>
        <h1>A structure-preserving digital twin that reconstructs hidden Parkinson&apos;s state</h1>
        <p className="ai4pd-lead">
          Parkinson&apos;s progresses through neural circuits and physiological systems that no
          single clinical test measures directly. AI4PD frames this as an ill-posed inverse problem:
          reconstruct a patient&apos;s hidden, evolving state from sparse, asynchronous, partially
          observed evidence. It approaches the problem with a structure-preserving model rather than
          a black box, which regularizes the reconstruction under stated identifiability
          assumptions, exposes per-subsystem reasoning to inspection, and is designed to report
          uncertainty rather than hide it. The empirical results behind each layer live on the{' '}
          <Link to={`${AI4PD_BASE}/evidence/`}>Evidence page</Link>; this page explains the design.
        </p>
        <div className="ai4pd-actions">
          <Link
            to={`${AI4PD_BASE}/clinician-workflow/`}
            className="ai4pd-button ai4pd-button--primary"
          >
            See the clinician workflow
          </Link>
          <Link to={`${AI4PD_BASE}/evidence/`} className="ai4pd-button ai4pd-button--quiet">
            Review the evidence base
          </Link>
        </div>
        <Ai4pdFigure
          name="ai4pd-architecture-figure1"
          alt="AI4PD architecture: clinical partners and multimodal evidence feed a Texas-core AI platform that maintains a patient-specific twin and returns clinician-facing guidance"
          loading="eager"
          caption="Read left to right: clinical partners and multimodal evidence feed a Texas-core AI platform; the platform builds a shared patient-specific longitudinal twin from cohort latent spaces and mechanism-informed circuit knowledge; clinician-facing outputs return diagnosis, intervention, and follow-up guidance through a secure portal."
        />
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--tight">
      <div className="ai4pd-shell">
        <nav className="ai4pd-jump" aria-label="On this page">
          On this page: <a href="#twin-core">the twin core</a> · <a href="#thrusts">inputs</a> ·{' '}
          <a href="#agents">reasoning</a> · <a href="#dbs">DBS</a> ·{' '}
          <a href="#clinician-view">clinician view</a>
        </nav>

        <div className="ai4pd-prose ai4pd-anchor" id="twin-core">
          <p className="ai4pd-eyebrow">The living twin</p>
          <h2>One living model per patient, organized by a port-Hamiltonian core</h2>
          <p>
            AI4PD is designed to maintain a single longitudinal model per patient and to update it
            as evidence arrives: a single intake, each clinic visit, a continuous wearable stream,
            or DBS sessions only. Its dynamics are organized by a port-Hamiltonian core, an
            interpretable structured prior, not a literal-physics claim.
          </p>
        </div>
        <dl className="ai4pd-dl">
          {components.map(c => (
            <React.Fragment key={c.term}>
              <dt>{c.term}</dt>
              <dd>{c.def}</dd>
            </React.Fragment>
          ))}
        </dl>
        <div className="ai4pd-prose">
          <p>
            Parkinson&apos;s has no conserved physical energy; the structure is an inductive bias,
            not a recovery of real physics. What it buys is concrete: bounded, stable forecasts
            under missing modalities, and interventions expressed as port inputs rather than hidden
            coefficients. We state the identifiability assumptions explicitly and test whether the
            structure earns its place with planned ablations against calibrated neural-ODE and
            unstructured baselines.
          </p>
          <p>
            Supporting methods:{' '}
            <Link to="/projects/phast/">PHAST port-Hamiltonian forecasting</Link>;{' '}
            <Link to="/projects/perennial-learning-kolmogorov/">perennial learning</Link>.
          </p>
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft ai4pd-anchor" id="thrusts">
      <div className="ai4pd-shell">
        <div className="ai4pd-section-heading">
          <p className="ai4pd-eyebrow">Inputs</p>
          <h2>Four method thrusts turn raw evidence into features the twin can use</h2>
          <p>
            Multimodal evidence has to become analysis-ready features before the twin can reason
            over it. Four method thrusts do this. Each is a standalone brief with full methods,
            figures, and references.
          </p>
        </div>
        <div className="ai4pd-grid ai4pd-grid--2">
          {thrusts.map(t => (
            <article key={t.to} className="ai4pd-card">
              <h3>{t.label}</h3>
              <p>{t.text}</p>
              <Link to={t.to} className="ai4pd-card__link">
                Read the brief <LinkIcon kind="internal" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-anchor" id="agents">
      <div className="ai4pd-shell">
        <div className="ai4pd-grid ai4pd-grid--2">
          <div className="ai4pd-prose">
            <p className="ai4pd-eyebrow">Reasoning</p>
            <h2>Modality-specialized agents with evidence arbitration</h2>
            <p>
              Collaborative-filtering signals, what the model has learned across many patients,
              sharpen the plausible state space for one new patient, while every candidate stays
              grounded in that patient&apos;s own data, mechanism, literature, and clinical context.
            </p>
            <ul className="ai4pd-list">
              <li>
                <strong>Diagnostic agents</strong> specialize by modality: they interpret EHR,
                imaging, biomarkers, wearables, clinical history, medication context, and DBS/LFP
                signals where available. Each is intended to return a state estimate, a differential
                where appropriate, and explicit uncertainty and evidence gaps; single-modality
                differentials are contributory, not standalone.
              </li>
              <li>
                <strong>Therapy-planning agents</strong> reason over medication, neuromodulation,
                rehabilitation, monitoring, and safety.
              </li>
              <li>
                <strong>A dynamic AI-knowledge network</strong> of literature, biomedical
                mechanisms, population histories, and clinical EHR knowledge continually informs the
                agents.
              </li>
              <li>
                <strong>Evidence arbitration</strong> compares and reconciles the agents&apos;
                claims, resolves conflicts, filters unsafe or inconsistent options, ranks what
                remains by supporting evidence, and reports uncertainty and remaining evidence gaps.
              </li>
            </ul>
          </div>
          <Ai4pdFigure
            name="ai4pd-multi-agent-architecture"
            alt="AI4PD multi-agent reasoning: a secure portal connects to the patient twin; diagnostic and therapy-planning agents reason over it; a dynamic knowledge network updates context; evidence arbitration returns clinician guidance"
          />
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft ai4pd-anchor" id="dbs">
      <div className="ai4pd-shell ai4pd-prose">
        <p className="ai4pd-eyebrow">A research direction</p>
        <h2>Planning DBS changes in the twin (not yet validated)</h2>
        <p>
          At the circuit level, Parkinson&apos;s motor signs are associated with pathological
          beta-band hypersynchrony in the subthalamic–cortical loop, and desynchronization is the
          therapeutic principle behind deep brain stimulation. Reactive and adaptive DBS have
          already reached the clinic. This is background motivation, not an AI4PD result.
        </p>
        <p>
          AI4PD&apos;s intended contribution is a planning step: simulate candidate stimulation
          changes inside the patient-specific twin before any patient setting is changed, a
          prospective capability still subject to clinical validation. Whether a patient-specific
          twin can faithfully predict an individual&apos;s response to a given stimulation change is
          itself unproven; any in-twin simulation is a hypothesis to be tested against observed
          clinical response, never a basis for changing settings on its own. The twin does not set
          DBS candidacy or stimulation targets and does not prescribe. Framing intervention as
          controlled movement through structured patient state is a research direction (
          <Link to="/projects/differential-and-pointwise-control-rl/">Hamiltonian control</Link>),
          not a present clinical feature.
        </p>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-anchor" id="clinician-view">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <p className="ai4pd-eyebrow">What the clinician sees</p>
          <h2>Decision support, returned to the clinician</h2>
          <p>
            Using the same population map from the agents above, a new patient can be placed within
            the population and matched to statistically similar prior cases for context. Latent
            similarity is not clinical equivalence, and a neighbor&apos;s trajectory is not a
            prognosis for the index patient; retrieved cases are illustrative context, with
            representativeness and uncertainty reported. Per-patient subgroup assignment is a
            validation target, not a delivered output. The intended clinician-facing outputs below
            are validation targets for a system under development, not delivered guarantees:
          </p>
        </div>
        <dl className="ai4pd-dl">
          {outputs.map(o => (
            <React.Fragment key={o.term}>
              <dt>{o.term}</dt>
              <dd>{o.def}</dd>
            </React.Fragment>
          ))}
        </dl>
        <p className="ai4pd-prose">
          Interactive view:{' '}
          <a href={PATIENT_PORTAL_URL} target="_blank" rel="noopener noreferrer">
            the patient portal
          </a>{' '}
          · full walkthrough on the{' '}
          <Link to={`${AI4PD_BASE}/clinician-workflow/`}>clinician workflow page</Link>.
        </p>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--tight">
      <div className="ai4pd-shell">
        <div className="ai4pd-callout">
          <h2>Decision support, with a human in the loop</h2>
          <p>
            AI4PD is designed as decision support with a human in the loop. Every meaningful output
            is routed to clinicians first; the system supports diagnosis and therapy planning but
            does not diagnose or prescribe autonomously, and it does not determine DBS candidacy or
            stimulation targets. Data remain governed by the contributing institutions, are
            de-identified, and are analyzed under privacy-preserving safeguards. Clinicians retain
            every decision; the system narrows the differential and surfaces evidence gaps faster
            than manual review.
          </p>
        </div>
      </div>
    </section>
  </Ai4pdLayout>
)

export default ApproachPage

export const Head = ({ location }) => (
  <Ai4pdHead
    title="Approach"
    location={location}
    description="How AI4PD works: a structure-preserving, port-Hamiltonian digital twin per patient, four method thrusts that turn multimodal evidence into features, and modality-specialized agents with evidence arbitration."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
