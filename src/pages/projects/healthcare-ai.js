import * as React from 'react'
import { Link } from 'gatsby'
import PropTypes from 'prop-types'
import { FaArrowRight, FaExternalLinkAlt } from 'react-icons/fa'
import Layout from '../../components/layout'
import Seo from '../../components/seo'
import posteriorOverview from '../../images/projects/posterior_aware_pd_phenotyping/fig1_motor_state_graphical_abstract.png'
import posteriorPipeline from '../../images/projects/posterior_aware_pd_phenotyping/fig2_posterior_pipeline.png'
import posteriorExplainability from '../../images/projects/posterior_aware_pd_phenotyping/fig3_explainability_panels.png'
import posteriorImaging from '../../images/projects/posterior_aware_pd_phenotyping/fig5_imaging_validation.png'
import integratedVisual from '../../images/projects/integrated_pd_precision_stratification/fig1_precision_framework.jpg'
import pathwayVisual from '../../images/projects/pathway_anchored_pd_clustering/fig1_pathway_multimodal_framework.jpg'
import actionableVisual from '../../images/projects/Actionable Intelligence Parkinsons/Parkinsons Project Thumbnail.png'
import './healthcare_ai.css'

const subprojects = [
  {
    title: 'Posterior-aware motor phenotyping',
    label: 'Longitudinal clinical states',
    description:
      'Soft motor-state assignments make heterogeneity visible across visits and connect patient-level patterns to DaTSCAN and MRI validation.',
    image: posteriorOverview,
    alt: 'Posterior motor states and imaging-associated validation for Parkinson disease',
    href: '/projects/posterior-aware-pd-phenotyping',
    cta: 'Open project',
  },
  {
    title: 'Pathway-anchored PD clustering',
    label: 'Interpretable imaging',
    description:
      'Multimodal imaging features are organized around disease-relevant circuits so clusters can be read as pathway-level signals.',
    image: pathwayVisual,
    alt: 'Pathway-anchored multimodal Parkinson disease imaging framework',
    href: '/projects/pathway-anchored-pd-clustering',
    cta: 'Open project',
  },
  {
    title: 'Integrated precision stratification',
    label: 'Genetics, assays, and wearables',
    description:
      'A multimodal framework brings genetic risk, molecular assays, wearable sensing, and prodromal measures into one uncertainty-aware view.',
    image: integratedVisual,
    alt: 'Integrated genetic, molecular, wearable, and prodromal biomarker framework',
    href: '/projects/integrated-pd-precision-stratification',
    cta: 'Open project',
  },
  {
    title: 'Actionable Intelligence',
    label: 'Project site',
    description:
      'An external project surface for patient-specific SBR biomarker exploration and clinical visualization workflows.',
    image: actionableVisual,
    alt: 'Actionable Intelligence Parkinson disease project preview',
    href: 'https://cvc-lab.github.io/parkinsons-website/',
    cta: 'Visit project site',
    external: true,
  },
]

const papers = [
  {
    title:
      "Posterior-calibrated multimodal motor states reveal longitudinal and imaging-associated heterogeneity in Parkinson's disease",
    citation: 'H. M. Tirhekar, P. Yadav, C. Bajaj. bioRxiv 2026.',
    href: 'https://doi.org/10.64898/2026.06.12.732003',
  },
  {
    title: "Pathway-Anchored Multimodal Clustering for Parkinson's Disease",
    citation: 'A. Vinod, A. S. Ellendula, S. Bhardwaj, et al. bioRxiv 2025.',
    href: 'https://doi.org/10.64898/2025.12.15.694278',
  },
  {
    title:
      "Integrated Genetic, Molecular, and Wearable Sensor Biomarkers Enable Bayesian Machine Learning-Driven Precision Stratification in Parkinson's Disease",
    citation: 'H. M. Tirhekar, P. Yadav, C. Bajaj. medRxiv 2025.',
    href: 'https://doi.org/10.64898/2025.12.02.25340302',
  },
]

const ProjectLink = ({ project, children }) => {
  if (project.external) {
    return (
      <a
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        className="healthcare-subproject__link"
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={project.href} className="healthcare-subproject__link">
      {children}
    </Link>
  )
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
          <p className="healthcare-eyebrow">Healthcare AI / Parent directory</p>
          <h1>Parkinson&apos;s disease</h1>
          <p className="healthcare-hero__lead">
            One public entry point for CVC&apos;s Parkinson&apos;s research across imaging,
            biomarkers, patient heterogeneity, and interpretable longitudinal modeling.
          </p>
          <figure className="healthcare-hero__figure">
            <img
              src={posteriorOverview}
              alt="Posterior motor states connected to clinical assessments, patient-level phenotypes, DaTSCAN, and MRI validation"
              decoding="async"
            />
            <figcaption>
              <strong>Program overview.</strong> Clinical assessments become soft motor-state
              profiles that can be compared with imaging-associated measures.
            </figcaption>
          </figure>
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
                  <img src={project.image} alt={project.alt} loading="lazy" decoding="async" />
                </div>
                <div className="healthcare-subproject__body">
                  <p className="healthcare-subproject__label">{project.label}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <ProjectLink project={project}>
                    {project.cta}
                    {project.external ? (
                      <FaExternalLinkAlt aria-hidden="true" />
                    ) : (
                      <FaArrowRight aria-hidden="true" />
                    )}
                  </ProjectLink>
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
              <img
                src={posteriorPipeline}
                alt="Posterior-aware phenotyping workflow from longitudinal assessments through model selection, triage, and imaging validation"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                <strong>Figure 2.</strong> A posterior-calibrated workflow connects longitudinal
                clinical data, uncertainty-aware motor states, external generalization, and imaging
                validation.
              </figcaption>
            </figure>
            <figure className="healthcare-visual">
              <img
                src={posteriorExplainability}
                alt="Posterior motor-state explainability panels showing domain scores, component selection, and temporal predictability"
                loading="lazy"
                decoding="async"
              />
              <figcaption>
                Explainability panels show how motor domains and temporal relationships shape the
                model view.
              </figcaption>
            </figure>
            <figure className="healthcare-visual">
              <img
                src={posteriorImaging}
                alt="DaTSCAN and MRI imaging validation panels for posterior motor states"
                loading="lazy"
                decoding="async"
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
                  <a href={paper.href} target="_blank" rel="noopener noreferrer">
                    Open paper <FaExternalLinkAlt aria-hidden="true" />
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  </Layout>
)

ProjectLink.propTypes = {
  project: PropTypes.shape({
    href: PropTypes.string.isRequired,
    external: PropTypes.bool,
  }).isRequired,
  children: PropTypes.node.isRequired,
}

export default HealthcareAiPage

export const Head = () => (
  <Seo
    title="Parkinson's Disease | Healthcare AI"
    description="CVC Healthcare AI research in Parkinson's disease, spanning imaging, biomarkers, patient heterogeneity, and interpretable longitudinal modeling."
  />
)
