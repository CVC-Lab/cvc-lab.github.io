import * as React from 'react'
import { Link } from 'gatsby'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { FaArrowRight, FaExternalLinkAlt } from 'react-icons/fa'
import Layout from '../../components/layout'
import Seo from '../../components/seo'
import { useCardImage } from '../../hooks/useCardImages'
import './healthcare_ai.css'

// The clinician-facing tool: enter a patient's record, see that patient's motion.
const PATIENT_PORTAL_URL = 'https://cvc-lab.github.io/parkinson-viz/'
// The AI4PD program site (separate repository: parkinsons-website).
const AI4PD_SITE_URL = 'https://cvc-lab.github.io/parkinsons-website/'
// Static research companion for the two 2026 manuscripts (static/projects/pd-research-companion).
const COMPANION_URL = '/projects/pd-research-companion/'

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

// Images are resolved through gatsby-plugin-image (src/hooks/useCardImages.js),
// so the page ships display-sized WebP instead of the multi-megabyte source figures.
const subprojects = [
  {
    title: 'PD Research Companion',
    label: 'Two new manuscripts, 2026',
    description:
      'Longitudinal validity gates and signed dopaminergic asymmetry, with outcome-blind patient dossiers and every figure at full resolution.',
    image: 'projects/pd_research_companion/companion_thumbnail',
    alt: 'Conceptual patient surrounded by clinical examination, DaT-SPECT, wearable gait, biomarker, and longitudinal evidence',
    href: COMPANION_URL,
    cta: 'Open the companion',
    kind: 'static',
  },
  {
    title: 'Posterior-aware motor phenotyping',
    label: 'Longitudinal clinical states',
    description:
      'Soft motor-state assignments make heterogeneity visible across visits and connect patient-level patterns to DaTSCAN and MRI validation.',
    image: 'projects/posterior_aware_pd_phenotyping/fig1_motor_state_graphical_abstract',
    alt: 'Posterior motor states and imaging-associated validation for Parkinson disease',
    href: '/projects/posterior-aware-pd-phenotyping',
    cta: 'Open project',
    kind: 'internal',
  },
  {
    title: 'MICCAI 2026 accepted paper',
    label: 'Interactive paper page',
    description:
      'Explore the accepted conference paper through the visual method flow, posterior-state explorer, BGMM configuration browser, and empirical result gallery.',
    image: 'projects/posterior_aware_pd_phenotyping/fig2_posterior_pipeline',
    alt: 'Posterior-aware motor phenotyping pipeline for the MICCAI 2026 accepted paper',
    href: '/projects/posterior-aware-pd-phenotyping-miccai/',
    cta: 'Open paper page',
    kind: 'static',
  },
  {
    title: 'Pathway-anchored PD clustering',
    label: 'Interpretable imaging',
    description:
      'Multimodal imaging features are organized around disease-relevant circuits so clusters can be read as pathway-level signals.',
    image: 'projects/pathway_anchored_pd_clustering/fig1_pathway_multimodal_framework',
    alt: 'Pathway-anchored multimodal Parkinson disease imaging framework',
    href: '/projects/pathway-anchored-pd-clustering',
    cta: 'Open project',
    kind: 'internal',
  },
  {
    title: 'Integrated precision stratification',
    label: 'Genetics, assays, and wearables',
    description:
      'A multimodal framework brings genetic risk, molecular assays, wearable sensing, and prodromal measures into one uncertainty-aware view.',
    image: 'projects/integrated_pd_precision_stratification/fig1_precision_framework',
    alt: 'Integrated genetic, molecular, wearable, and prodromal biomarker framework',
    href: '/projects/integrated-pd-precision-stratification',
    cta: 'Open project',
    kind: 'internal',
  },
  {
    title: 'AI4PD program site',
    label: 'Patient-specific digital twin',
    description:
      'The AI4PD site assembles scattered clinical, imaging, biomarker, wearable, and genetic evidence into one living, uncertainty-aware model of the patient.',
    image: 'projects/Actionable Intelligence Parkinsons/Parkinsons Project Thumbnail',
    alt: 'AI4PD, AI for Parkinson disease, project preview',
    href: AI4PD_SITE_URL,
    cta: 'Visit AI4PD',
    kind: 'external',
  },
]

const papers = [
  {
    title: 'Validity Gates Expose Limits of Longitudinal Multimodal Parkinson Disease Prediction',
    citation:
      'H. M. Tirhekar, P. Yadav, C. Bajaj. Manuscript, 2026 (arXiv submission in preparation).',
    href: `${COMPANION_URL}pd-validity-gates/`,
    kind: 'static',
    cta: 'Open research companion',
  },
  {
    title:
      'Signed Dopaminergic Asymmetry Tracks Contralateral Motor Laterality in Parkinson’s Disease',
    citation:
      'H. M. Tirhekar, P. Yadav, C. Bajaj. Manuscript, 2026 (arXiv submission in preparation).',
    href: `${COMPANION_URL}pd-signed-laterality/`,
    kind: 'static',
    cta: 'Open research companion',
  },
  {
    title:
      "Posterior-Aware Motor Phenotyping with Multimodal Imaging Validation in Parkinson's Disease",
    citation: 'H. M. Tirhekar, P. Yadav, C. Bajaj. MICCAI 2026, accepted paper 4053.',
    href: '/projects/posterior-aware-pd-phenotyping-miccai/',
    kind: 'static',
    cta: 'Open paper page',
  },
  {
    title:
      "Posterior-calibrated multimodal motor states reveal longitudinal and imaging-associated heterogeneity in Parkinson's disease",
    citation: 'H. M. Tirhekar, P. Yadav, C. Bajaj. bioRxiv 2026.',
    href: 'https://doi.org/10.64898/2026.06.12.732003',
    kind: 'external',
    cta: 'Open paper',
  },
  {
    title: "Pathway-Anchored Multimodal Clustering for Parkinson's Disease",
    citation: 'A. Vinod, A. S. Ellendula, S. Bhardwaj, et al. bioRxiv 2025.',
    href: 'https://doi.org/10.64898/2025.12.15.694278',
    kind: 'external',
    cta: 'Open paper',
  },
  {
    title:
      "Integrated Genetic, Molecular, and Wearable Sensor Biomarkers Enable Bayesian Machine Learning-Driven Precision Stratification in Parkinson's Disease",
    citation: 'H. M. Tirhekar, P. Yadav, C. Bajaj. medRxiv 2025.',
    href: 'https://doi.org/10.64898/2025.12.02.25340302',
    kind: 'external',
    cta: 'Open paper',
  },
]

// `internal` routes go through Gatsby's router; `static` ones are plain HTML under
// static/ and need a real navigation; `external` ones open in a new tab.
const SmartLink = ({ href, kind, className, children }) => {
  if (kind === 'internal') {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }
  if (kind === 'external') {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

SmartLink.propTypes = {
  href: PropTypes.string.isRequired,
  kind: PropTypes.oneOf(['internal', 'static', 'external']).isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
}

const LinkIcon = ({ kind }) =>
  kind === 'external' ? (
    <FaExternalLinkAlt aria-hidden="true" />
  ) : (
    <FaArrowRight aria-hidden="true" />
  )

LinkIcon.propTypes = { kind: PropTypes.string.isRequired }

const Figure = ({ name, alt, loading = 'lazy', className }) => {
  const resolveCardImage = useCardImage()
  const image = getImage(resolveCardImage(name))
  if (!image) return null
  return <GatsbyImage image={image} alt={alt} loading={loading} className={className} />
}

Figure.propTypes = {
  name: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  loading: PropTypes.oneOf(['eager', 'lazy']),
  className: PropTypes.string,
}

const HealthcareAiPage = () => (
  <Layout headerVariant="compact">
    <div className="healthcare-page">
      <section className="healthcare-hero">
        <div className="healthcare-shell">
          <Link to="/projects" className="healthcare-back-link">
            <FaArrowRight aria-hidden="true" className="healthcare-back-link__icon" />
            All projects
          </Link>
          <p className="healthcare-eyebrow">
            Healthcare AI &middot; AI for Parkinson&apos;s disease
          </p>
          <h1>We infer the unseen.</h1>
          <p className="healthcare-hero__lead">
            Patient-specific AI for Parkinson&apos;s disease. Rather than relying on population
            averages, our models take one patient&apos;s clinical, imaging, wearable, and biomarker
            record and make that patient&apos;s physiological dynamics visible, with the uncertainty
            shown alongside.
          </p>
          <div className="healthcare-hero__actions">
            <a
              href={PATIENT_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="healthcare-button healthcare-button--primary"
            >
              Open the patient portal <FaExternalLinkAlt aria-hidden="true" />
            </a>
            <a
              href="#healthcare-program-title"
              className="healthcare-button healthcare-button--quiet"
            >
              Explore the research
            </a>
          </div>
          <figure className="healthcare-hero__figure">
            <Figure
              name="projects/posterior_aware_pd_phenotyping/fig1_motor_state_graphical_abstract"
              alt="Posterior motor states connected to clinical assessments, patient-level phenotypes, DaTSCAN, and MRI validation"
              loading="eager"
            />
            <figcaption>
              <strong>Program overview.</strong> Clinical assessments become soft motor-state
              profiles that can be compared with imaging-associated measures.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="healthcare-portal" aria-labelledby="healthcare-portal-title">
        <div className="healthcare-shell">
          <div className="healthcare-portal__card">
            <div className="healthcare-portal__intro">
              <p className="healthcare-eyebrow">Patient portal</p>
              <h2 id="healthcare-portal-title">Making the invisible visible</h2>
              <p>
                An interactive portal for clinicians: enter a patient&apos;s data and watch
                personalized motion and gait on an anatomical model, driven by PPMI metrics and
                wearable sensor signals rather than a population template.
              </p>
              <div className="healthcare-portal__actions">
                <a
                  href={PATIENT_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="healthcare-button healthcare-button--primary"
                >
                  Open the patient portal <FaExternalLinkAlt aria-hidden="true" />
                </a>
                <a
                  href={AI4PD_SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="healthcare-button healthcare-button--quiet"
                >
                  AI4PD program site <FaExternalLinkAlt aria-hidden="true" />
                </a>
              </div>
              <p className="healthcare-portal__note">
                Research evidence for clinicians and partners; not a clinical decision tool.
              </p>
            </div>
            <ul className="healthcare-portal__points">
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

      <section className="healthcare-program" aria-labelledby="healthcare-program-title">
        <div className="healthcare-shell">
          <div className="healthcare-section-heading">
            <p className="healthcare-eyebrow">One research program</p>
            <h2 id="healthcare-program-title">
              From clinical signals to interpretable patient views
            </h2>
            <p>
              These efforts are related parts of one Healthcare AI program. The public summaries
              keep implementation details light while showing the visual logic behind each line of
              work.
            </p>
          </div>

          <div className="healthcare-subprojects">
            {subprojects.map(project => (
              <article key={project.title} className="healthcare-subproject">
                <div className="healthcare-subproject__image-wrap">
                  <Figure name={project.image} alt={project.alt} />
                </div>
                <div className="healthcare-subproject__body">
                  <p className="healthcare-subproject__label">{project.label}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <SmartLink
                    href={project.href}
                    kind={project.kind}
                    className="healthcare-subproject__link"
                  >
                    {project.cta}
                    <LinkIcon kind={project.kind} />
                  </SmartLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="healthcare-visuals" aria-labelledby="healthcare-visuals-title">
        <div className="healthcare-shell">
          <div className="healthcare-section-heading healthcare-section-heading--narrow">
            <p className="healthcare-eyebrow">Visual explainability</p>
            <h2 id="healthcare-visuals-title">Show the structure before the implementation</h2>
            <p>
              High-level figures make the reasoning visible without exposing unpublished system
              details. Open any project above for the full technical narrative and paper citations.
            </p>
          </div>

          <div className="healthcare-visual-grid">
            <figure className="healthcare-visual healthcare-visual--wide">
              <Figure
                name="projects/posterior_aware_pd_phenotyping/fig2_posterior_pipeline"
                alt="Posterior-aware phenotyping workflow from longitudinal assessments through model selection, triage, and imaging validation"
              />
              <figcaption>
                <strong>Figure 2.</strong> A posterior-calibrated workflow connects longitudinal
                clinical data, uncertainty-aware motor states, external generalization, and imaging
                validation.
              </figcaption>
            </figure>
            <figure className="healthcare-visual">
              <Figure
                name="projects/posterior_aware_pd_phenotyping/fig3_explainability_panels"
                alt="Posterior motor-state explainability panels showing domain scores, component selection, and temporal predictability"
              />
              <figcaption>
                Explainability panels show how motor domains and temporal relationships shape the
                model view.
              </figcaption>
            </figure>
            <figure className="healthcare-visual">
              <Figure
                name="projects/posterior_aware_pd_phenotyping/fig5_imaging_validation"
                alt="DaTSCAN and MRI imaging validation panels for posterior motor states"
              />
              <figcaption>
                DaTSCAN and structural MRI provide visible validation anchors for the clinical
                representation.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="healthcare-papers" aria-labelledby="healthcare-papers-title">
        <div className="healthcare-shell">
          <div className="healthcare-section-heading healthcare-section-heading--narrow">
            <p className="healthcare-eyebrow">Papers &amp; evidence</p>
            <h2 id="healthcare-papers-title">Technical depth lives at the bottom of the page</h2>
            <p>
              These links anchor the public overview to the research record. The project pages carry
              the supporting figures and detailed methods.
            </p>
          </div>

          <ol className="healthcare-paper-list">
            {papers.map((paper, index) => (
              <li key={paper.href} className="healthcare-paper">
                <span className="healthcare-paper__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{paper.title}</h3>
                  <p>{paper.citation}</p>
                  <SmartLink href={paper.href} kind={paper.kind}>
                    {paper.cta} <LinkIcon kind={paper.kind} />
                  </SmartLink>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  </Layout>
)

export default HealthcareAiPage

export const Head = ({ location }) => (
  <Seo
    pathname={location.pathname}
    title="Parkinson's Disease | Healthcare AI"
    description="We infer the unseen: patient-specific AI for Parkinson's disease at CVC, with a clinician-facing patient portal, imaging and biomarker research, and interpretable longitudinal modeling."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
