import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { FaExternalLinkAlt } from 'react-icons/fa'
import Ai4pdLayout, {
  Ai4pdHead,
  Ai4pdFigure,
  SmartLink,
  LinkIcon,
} from '../../../components/ai4pd/Ai4pdLayout'
import { AI4PD_BASE, PATIENT_PORTAL_URL, COMPANION_URL } from '../../../components/ai4pd/links'

const portalPoints = [
  {
    title: 'Personalized modeling',
    text: 'Patient-specific inference instead of population averages. Clinicians enter one patient’s data and see that patient’s motion and gait modeled on an anatomical figure.',
  },
  {
    title: 'Built for the clinic',
    text: 'An interactive tool that saves clinician time and is built for accuracy and reliability, so physiological dynamics become something you can see, compare, and question.',
  },
  {
    title: 'A living showcase',
    text: 'The same portal demonstrates tangible progress to proposal reviewers and philanthropic partners: not a slide, the working system.',
  },
]

const evidence = [
  {
    eyebrow: 'Calibrated motor states · PPMI + BioFIND',
    title: 'Motor phenotyping that reports its own overconfidence',
    text: 'Across 29,366 PPMI visits from 4,773 patients, motor states stay stable on average yet 25.5% of patients shift over time, and the model discloses its overconfidence (0.989 nominal vs 0.849 empirical) instead of hiding it.',
    href: `${AI4PD_BASE}/evidence/#paper-motor-states`,
  },
  {
    eyebrow: 'Validity gates · 2026 manuscript',
    title: 'Seven verdicts, not one headline score',
    text: 'Across 5,404 future-only cutoffs from 1,058 PPMI participants, a small internal increment survives participant separation but fails calendar and transport gates, so the protocol stops the claim before deployment language begins.',
    href: `${AI4PD_BASE}/evidence/#paper-validity-gates`,
  },
  {
    eyebrow: 'Signed laterality · 2026 manuscript',
    title: 'Signed dopaminergic asymmetry tracks the opposite body side',
    text: 'Keeping the left–right sign of putamen binding recovers reproducible contralateral anatomy in PPMI (r = 0.676) and an independent S4 cohort (r = 0.551), and adds modest future side-balance information.',
    href: `${AI4PD_BASE}/evidence/#paper-signed-laterality`,
  },
  {
    eyebrow: 'Genetics + wearables · medRxiv',
    title: 'LRRK2 risk and wearable gait, in one stratification',
    text: 'LRRK2 G2019S carries a 1.92× PD prevalence ratio and +4.35 motor points; wearable arm-swing asymmetry (27%) and a risk model (AUC 0.717) add scalable digital signal.',
    href: `${AI4PD_BASE}/evidence/#paper-biomarkers`,
  },
]

const sections = [
  {
    title: 'Approach',
    label: 'How the twin works',
    text: 'A structure-preserving digital twin organized by a port-Hamiltonian core, fed by four method thrusts, with modality-specialized agents and evidence arbitration on top.',
    href: `${AI4PD_BASE}/approach/`,
    kind: 'internal',
  },
  {
    title: 'Clinician workflow',
    label: 'From cohort to one patient',
    text: 'Subgroup discovery, nearest-neighbor placement, and what the treating neurologist actually sees.',
    href: `${AI4PD_BASE}/clinician-workflow/`,
    kind: 'internal',
  },
  {
    title: 'Evidence',
    label: 'Cohorts, methods, limits',
    text: 'Every study behind the program with its cohorts, effect sizes, and limitations in the authors’ own wording.',
    href: `${AI4PD_BASE}/evidence/`,
    kind: 'internal',
  },
  {
    title: 'PD Research Companion',
    label: 'Two new manuscripts',
    text: 'Longitudinal validity gates and signed dopaminergic asymmetry, with outcome-blind patient dossiers and every figure at full resolution.',
    href: COMPANION_URL,
    kind: 'static',
    image: 'companion',
  },
  {
    title: 'Partners',
    label: 'Validate on your cohort',
    text: 'How engagement works, data-use terms, governance, and what a clinical partner contributes and receives.',
    href: `${AI4PD_BASE}/partners/`,
    kind: 'internal',
  },
  {
    title: 'Team & resources',
    label: 'People, datasets, documentation',
    text: 'Who builds AI4PD, the core datasets it rests on, and the lab documentation and engagement channels.',
    href: `${AI4PD_BASE}/team/`,
    kind: 'internal',
  },
]

const projectPages = [
  {
    title: 'Posterior-aware motor phenotyping',
    href: '/projects/posterior-aware-pd-phenotyping',
    kind: 'internal',
  },
  {
    title: 'MICCAI 2026 accepted paper',
    href: '/projects/posterior-aware-pd-phenotyping-miccai/',
    kind: 'static',
  },
  {
    title: 'Pathway-anchored PD clustering',
    href: '/projects/pathway-anchored-pd-clustering',
    kind: 'internal',
  },
  {
    title: 'Integrated precision stratification',
    href: '/projects/integrated-pd-precision-stratification',
    kind: 'internal',
  },
  {
    title: 'SBR extraction study (2023 background)',
    href: `${AI4PD_BASE}/background/`,
    kind: 'internal',
  },
]

const Ai4pdHub = () => (
  <Ai4pdLayout section="overview">
    <section className="ai4pd-hero ai4pd-hero--hub">
      <div className="ai4pd-shell">
        <p className="ai4pd-eyebrow">AI4PD &middot; AI for Parkinson&apos;s disease</p>
        <h1>We infer the unseen.</h1>
        <p className="ai4pd-lead">
          Parkinson&apos;s reaches well beyond tremor, and the evidence about any one patient
          arrives scattered across clinic visits, imaging, biomarkers, wearables, genetics, and the
          health record. AI4PD assembles that evidence into one living, uncertainty-aware model of
          the patient, so that clinicians work from the individual record rather than the population
          average, and every output goes to the physician first.
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
            See how it works
          </Link>
        </div>
        <ul className="ai4pd-status" aria-label="Program status">
          <li>Retrospective evidence base</li>
          <li>Decision support only</li>
          <li>Seeking prospective validation partners</li>
        </ul>
        <p className="ai4pd-trust">
          Oden Institute &middot; The University of Texas at Austin &middot; CVC Lab &middot; TACC
          infrastructure &middot; Supported by the Michael J. Fox Foundation
        </p>
      </div>
    </section>

    <section className="ai4pd-portal" aria-labelledby="ai4pd-portal-title">
      <div className="ai4pd-shell">
        <div className="ai4pd-portal__card">
          <div className="ai4pd-portal__intro">
            <p className="ai4pd-eyebrow">Patient portal</p>
            <h2 id="ai4pd-portal-title">Making the invisible visible</h2>
            <p>
              An interactive portal for clinicians: enter a patient&apos;s data and watch
              personalized motion and gait on an anatomical model, driven by PPMI metrics and
              wearable sensor signals rather than a population template.
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
              <Link
                to={`${AI4PD_BASE}/clinician-workflow/`}
                className="ai4pd-button ai4pd-button--quiet"
              >
                How clinicians use it
              </Link>
            </div>
            <p className="ai4pd-note">
              Research evidence for clinicians and partners; not a clinical decision tool.
            </p>
          </div>
          <ul className="ai4pd-portal__points">
            {portalPoints.map(point => (
              <li key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft" aria-labelledby="ai4pd-evidence-title">
      <div className="ai4pd-shell">
        <div className="ai4pd-section-heading">
          <p className="ai4pd-eyebrow">Evidence to date (retrospective)</p>
          <h2 id="ai4pd-evidence-title">What the analyses show</h2>
          <p>
            Preprints, an accepted conference paper, and two manuscripts on established
            Parkinson&apos;s cohorts (PPMI, BioFIND, PDBP, FoxInsight, S4). The headlines are below;
            full cohorts, methods, and limitations are on the{' '}
            <Link to={`${AI4PD_BASE}/evidence/`}>Evidence page</Link>. These results are
            retrospective and hypothesis-generating: the calibrated substrate the twin is built on,
            not the mechanism claim itself.
          </p>
        </div>
        <div className="ai4pd-grid ai4pd-grid--4">
          {evidence.map(item => (
            <article key={item.title} className="ai4pd-card ai4pd-card--accent">
              <p className="ai4pd-eyebrow">{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <Link to={item.href} className="ai4pd-card__link">
                Details <LinkIcon kind="internal" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="ai4pd-section" aria-labelledby="ai4pd-twin-title">
      <div className="ai4pd-shell">
        <div className="ai4pd-grid ai4pd-grid--2">
          <div className="ai4pd-prose">
            <p className="ai4pd-eyebrow">How it works</p>
            <h2
              id="ai4pd-twin-title"
              style={{ fontSize: '2.3rem', lineHeight: 1.12, margin: '0 0 0.9rem' }}
            >
              A twin a clinician can question
            </h2>
            <p>
              Underneath those results sits the patient-specific digital twin. Its interpretable
              core is a structured prior for how a patient&apos;s state evolves, with functional
              reserve, coupling between subsystems, dissipation, and therapy ports, not a claim of
              physical energy conservation, and it updates as new visits, sensors, and biomarkers
              arrive.
            </p>
            <p>
              On top of the twin, multi-agent diagnostic and therapy-planning agents reason over a
              dynamic knowledge network, surfacing disagreement, uncertainty, and gaps rather than
              smoothing them over. Letting a clinician simulate a candidate DBS change in the twin
              before changing patient settings is a prospective-validation hypothesis, not a current
              capability.
            </p>
            <Link to={`${AI4PD_BASE}/approach/`} className="ai4pd-inline-link">
              Read the full approach <LinkIcon kind="internal" />
            </Link>
          </div>
          <Ai4pdFigure
            name="ai4pd-architecture-figure1"
            alt="AI4PD architecture: clinical and validation partners feed a Texas-core AI platform that maintains a patient-specific twin and returns clinician-facing guidance"
            caption="Clinical partners and multimodal evidence feed a Texas-core AI platform; the platform maintains a shared patient-specific twin and returns diagnosis, intervention, and follow-up guidance to clinicians."
          />
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft" aria-labelledby="ai4pd-map-title">
      <div className="ai4pd-shell">
        <div className="ai4pd-section-heading">
          <p className="ai4pd-eyebrow">One program</p>
          <h2 id="ai4pd-map-title">Where to go next</h2>
          <p>
            Everything about the Parkinson&apos;s program lives under this one address: the
            approach, the clinician workflow, the evidence, the research companion, and how to
            partner.
          </p>
        </div>
        <div className="ai4pd-grid">
          {sections.map(item => (
            <article key={item.title} className="ai4pd-card">
              {item.image && (
                <div className="ai4pd-card__image">
                  <Ai4pdFigure name="projects/pd_research_companion/companion_thumbnail" alt="" />
                </div>
              )}
              <p className="ai4pd-eyebrow">{item.label}</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <SmartLink href={item.href} kind={item.kind} className="ai4pd-card__link">
                Open <LinkIcon kind={item.kind} />
              </SmartLink>
            </article>
          ))}
        </div>

        <div className="ai4pd-section-heading" style={{ marginTop: '3rem' }}>
          <p className="ai4pd-eyebrow">Project pages</p>
          <p>Detailed pages for the individual studies, with figures, methods, and citations.</p>
        </div>
        <ul className="ai4pd-list" style={{ columns: 2, columnGap: '2rem' }}>
          {projectPages.map(page => (
            <li key={page.href}>
              <SmartLink href={page.href} kind={page.kind} className="ai4pd-inline-link">
                {page.title} <LinkIcon kind={page.kind} />
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--tight">
      <div className="ai4pd-shell">
        <div className="ai4pd-callout">
          <h2>The evidence layer is the work, and the ask</h2>
          <p>
            AI4PD is decision support, never an autonomous prescriber, and its hardest constraint is
            not the model. It is the multi-institution longitudinal evidence layer needed to
            validate it. We are looking for movement-disorders neurologists and institutions that
            govern longitudinal Parkinson&apos;s cohorts to partner on clinical data and prospective
            validation, on terms that meet your standard of proof.
          </p>
          <div className="ai4pd-actions">
            <Link to={`${AI4PD_BASE}/partners/`} className="ai4pd-button ai4pd-button--primary">
              Partner on validation
            </Link>
            <Link
              to={`${AI4PD_BASE}/partners/#governance`}
              className="ai4pd-button ai4pd-button--quiet"
            >
              Data-use and governance terms
            </Link>
          </div>
        </div>
      </div>
    </section>
  </Ai4pdLayout>
)

export default Ai4pdHub

export const Head = ({ location }) => (
  <Ai4pdHead
    location={location}
    description="We infer the unseen: AI4PD is CVC's patient-specific AI program for Parkinson's disease, with a clinician-facing patient portal, a structure-preserving digital twin, and a retrospective evidence base on PPMI and partner cohorts."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
