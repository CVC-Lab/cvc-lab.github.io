import * as React from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { useCardImage } from '../hooks/useCardImages'
import { FaFileAlt, FaFilePdf, FaExternalLinkAlt, FaArrowUp, FaTimes } from 'react-icons/fa'
import PropTypes from 'prop-types'
import './publication_table.css'

const publicationTypeOrder = [
  'Journal Publications',
  'arXiv',
  'Conference Presentations & Publications',
  'Technical Reports',
  'Book',
  'Edited Books',
  'Book Chapters',
]

const groupByYearAndType = publications => {
  return publications.reduce((groupedPublications, publication) => {
    const year = publication.PublishedDateYear
    const type = publication.PublicationType

    if (!groupedPublications[year]) {
      groupedPublications[year] = {}
    }

    if (!groupedPublications[year][type]) {
      groupedPublications[year][type] = []
    }

    groupedPublications[year][type].push(publication)
    return groupedPublications
  }, {})
}

// Types are listed in a fixed order, but anything the data carries that is not
// in that list is appended rather than dropped — a publication with an
// unexpected PublicationType would otherwise never render at all.
const orderTypes = types => {
  const known = publicationTypeOrder.filter(type => types[type])
  const unknown = Object.keys(types)
    .filter(type => !publicationTypeOrder.includes(type))
    .sort()
  return [...known, ...unknown]
}

const generatePublicationKey = (publication, index) => {
  const titlePart = publication.Title ? publication.Title.substring(0, 20).replace(/\s+/g, '_') : ''
  const authorPart = publication.Authors
    ? publication.Authors.substring(0, 20).replace(/\s+/g, '_')
    : ''
  return `${titlePart}_${authorPart}_${index}`
}

const publicationThumbnailMap = {
  'Scalable Risk-Averse Well-Placement Optimization Using Quadratic Knapsack Problem and Randomized Singular Value Decomposition':
    {
      img: 'publications/PUB_Scalable Risk-Averse',
      alt: 'Scalable Risk-Averse Well-Placement Optimization publication thumbnail',
    },
  'Computer Algebra Meets Hamiltonian Geometry': {
    img: 'publications/PUB_Computer Algebra',
    alt: 'Computer Algebra Meets Hamiltonian Geometry publication thumbnail',
  },
  'The Physics, Information, and Computation of Perennial Learning: Kolmogorov Complexity, Information Distance and Port-Hamiltonian Thermodynamics':
    {
      img: 'publications/PUB_Perennial Learning',
      alt: 'Perennial Learning via Port-Hamiltonian Dynamics publication thumbnail',
    },
  'Learning Material-Aware Hamiltonian Risk Fields for Safe Navigation': {
    img: 'projects/Learning Material-Aware Hamiltonian_Thumbnail',
    alt: 'Learning Material-Aware Hamiltonian Risk Fields for Safe Navigation publication thumbnail',
  },
  'When Descent Is Too Stable: Event-Triggered Hamiltonian Learning to Optimize': {
    img: 'projects/When Descent Is Too Stable_Thumbnail',
    alt: 'When Descent Is Too Stable publication thumbnail',
  },
  'PHAST: Port-Hamiltonian Architecture for Structured Temporal Dynamics Forecasting': {
    img: 'publications/PUB_PHASTPort-Hamiltonian',
    alt: 'PHAST publication thumbnail',
  },
  'QC-PHAST Search: Classical--Quantum Query Benchmarks for Finite-Pool Rare-Regime Discovery': {
    img: 'publications/PUB_QC-PHAST_Search',
    alt: 'QC-PHAST Search publication thumbnail',
  },
  'GRL-SNAM: Geometric Reinforcement Learning with Path Differential Hamiltonians for Simultaneous Navigation and Mapping in Unknown Environments':
    {
      img: 'publications/PUB_GRL‑SNAM',
      alt: 'GRL-SNAM publication thumbnail',
    },
  'A Novel Tri-Modal Viral–Ultrasound Gene-Delivery Therapy Protocol for Lysosomal Neurodegeneration via Stochastic Model Optimization with Uncertainty Quantification and Generalizability':
    {
      img: 'publications/PUB_Tri-Modal Gene Therapy',
      alt: 'Tri-modal viral ultrasound gene-delivery therapy publication thumbnail',
    },
  'Scalable Robust Bayesian Co-Clustering with Compositional ELBOs': {
    img: 'publications/PUB_Compositional ELBOs',
    alt: 'Compositional ELBOs publication thumbnail',
  },
  'A Differential and Pointwise Control Approach to Reinforcement Learning': {
    img: 'publications/PUB_Differential and Pointwise',
    alt: 'Differential and Pointwise Control publication thumbnail',
  },
  '4drecons: 4d neural implicit deformable objects reconstruction from a single rgb-d camera with geometrical and topological regularizations':
    {
      img: 'publications/PUB_4drecons',
      alt: '4drecons publication thumbnail',
    },
  'Learning Generalized Hamiltonian Dynamics with Stability from Noisy Trajectory Data': {
    img: 'publications/PUB_Hamiltonian_noisyTrajectory',
    alt: 'Hamiltonian dynamics from noisy trajectories publication thumbnail',
  },
  'Pathway Anchored Multimodal Clustering Reveals Circuit Level Signatures in Parkinsons Disease': {
    img: 'publications/PUB_Pathway Anchored Multimodal',
    alt: 'Pathway anchored multimodal clustering publication thumbnail',
  },
  'Posterior-calibrated multimodal motor states reveal longitudinal and imaging-associated heterogeneity in Parkinson’s disease':
    {
      img: 'publications/PUB_Posterior-Aware Phenotyping',
      alt: 'Posterior-calibrated multimodal motor states publication thumbnail',
    },
  'Integrated Genetic, Molecular, and Wearable Sensor Biomarkers Enable Bayesian Machine Learning-Driven Precision Stratification in Parkinson’s Disease: A Comprehensive Multi-Cohort Validation Study':
    {
      img: 'publications/PUB_Wearable Sensor Biomarkers',
      alt: 'Wearable sensor biomarkers publication thumbnail',
    },
  'Bayesian Port–Hamiltonian Surrogate for Three-Phase Reservoir Flow Simulation': {
    img: 'publications/PUB_Three-Phase Reservoir',
    alt: 'Three-phase reservoir flow publication thumbnail',
  },
  'Field-Scale Bayesian Production Forecasting via Spectral Gaussian-Process Mixtures': {
    img: 'publications/PUB_Field-Scale Bayesian',
    alt: 'Field-scale Bayesian production forecasting publication thumbnail',
  },
  'Stochastic Differential Policy Optimization: A Rough Path Approach to Reinforcement Learning': {
    img: 'publications/PUB_A Rough Path Approach',
    alt: 'Rough path reinforcement learning publication thumbnail',
  },
  'Self-balancing, Memory Efficient, Dynamic Metric Space Data Maintenance, for Rapid Multi-kernel Estimation':
    {
      img: 'publications/PUB_Rapid Multi-kernel Estimation',
      alt: 'Rapid multi-kernel estimation publication thumbnail',
    },
}

const CVC_SITE_ORIGIN = 'https://cvc-lab.github.io'

const resolvePdfLink = pdfLink => {
  if (!pdfLink || pdfLink === 'NULL') return null

  const normalizedPdfLink = pdfLink.trim()

  if (
    normalizedPdfLink.startsWith('http://') ||
    normalizedPdfLink.startsWith('https://') ||
    normalizedPdfLink.startsWith('/')
  ) {
    return normalizedPdfLink
  }

  return null
}

const PREPRINT_LOCATION_PATTERN = /^\s*(arXiv|bioRxiv|medRxiv)/i

const getPaperLinkConfig = publication => {
  const isPreprint =
    publication.PublicationType === 'arXiv' ||
    PREPRINT_LOCATION_PATTERN.test(publication.Location || '')

  return {
    className: isPreprint ? 'pub-link-paper' : 'pub-link-pdf',
    Icon: isPreprint ? FaFileAlt : FaFilePdf,
    label: isPreprint ? 'Paper' : 'PDF',
  }
}

const resolveProjectLink = projectLink => {
  if (!projectLink || projectLink === 'NULL') return null

  if (projectLink.startsWith(CVC_SITE_ORIGIN)) {
    const internalPath = projectLink.slice(CVC_SITE_ORIGIN.length)
    return {
      to: internalPath || '/',
      isInternal: true,
    }
  }

  if (projectLink.startsWith('/')) {
    return {
      to: projectLink,
      isInternal: true,
    }
  }

  if (projectLink.startsWith('http://') || projectLink.startsWith('https://')) {
    return {
      to: projectLink,
      isInternal: false,
    }
  }

  return null
}

const scrollToYear = yearId => {
  if (typeof document === 'undefined') return
  const el = document.getElementById(yearId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const scrollToTop = () => {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const PublicationTable = ({ publicationData = [] }) => {
  const resolveCardImage = useCardImage()
  const [showBackToTop, setShowBackToTop] = React.useState(false)
  const [previewPublication, setPreviewPublication] = React.useState(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  React.useEffect(() => {
    if (!previewPublication || typeof window === 'undefined') return undefined

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setPreviewPublication(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewPublication])

  const groupedPublications = groupByYearAndType(publicationData)
  const sortedYears = Object.keys(groupedPublications).sort((a, b) => b - a)

  return (
    <div className="publications-class" id="publications">
      <div className="publication-container">
        <h4 className="header-sub">Publications</h4>

        {/* Year navigation bar */}
        {sortedYears.length > 0 && (
          <nav className="year-nav" aria-label="Jump to year">
            {sortedYears.map(year => (
              <button
                key={year}
                className="year-nav-btn"
                onClick={() => scrollToYear(`year-${year}`)}
              >
                {year}
              </button>
            ))}
          </nav>
        )}

        <div className="publication-list">
          {sortedYears.map(year => {
            const types = groupedPublications[year]
            return (
              <div key={year} id={`year-${year}`} className="year-section">
                <h3 className="year-header">{year}</h3>
                <hr className="year-divider" />
                {orderTypes(types).map(type => (
                  <div key={type} className="type-section">
                    <h4 className="type-header">{type}</h4>
                    {types[type].map((publication, index) => {
                      const thumbnail = publicationThumbnailMap[publication.Title]
                      const thumbnailImage = thumbnail
                        ? getImage(resolveCardImage(thumbnail.img))
                        : null
                      const pdfLink = resolvePdfLink(publication.PDFLink)
                      const paperLinkConfig = getPaperLinkConfig(publication)

                      return (
                        <div
                          key={generatePublicationKey(publication, index)}
                          className="publication-card"
                        >
                          {thumbnailImage && (
                            <button
                              type="button"
                              className="publication-thumbnail"
                              onClick={() =>
                                setPreviewPublication({
                                  title: publication.Title,
                                  image: thumbnailImage,
                                  alt: thumbnail.alt,
                                })
                              }
                              aria-label={`Preview thumbnail for ${publication.Title}`}
                            >
                              <GatsbyImage image={thumbnailImage} alt={thumbnail.alt} />
                            </button>
                          )}
                          <div className="lower-container-pubs">
                            <h3>{publication.Title}</h3>
                            <h4>{publication.Authors}</h4>
                            {publication.Location && publication.Location !== 'NULL' && (
                              <h4
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(`<i>${publication.Location}</i>`),
                                }}
                              ></h4>
                            )}
                            <div className="pub-links">
                              {pdfLink && (
                                <a
                                  href={pdfLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`pub-link-btn ${paperLinkConfig.className}`}
                                >
                                  <paperLinkConfig.Icon className="pub-link-icon" />
                                  {paperLinkConfig.label}
                                </a>
                              )}
                              {(() => {
                                const projectLink = resolveProjectLink(publication.ProjectLink)

                                if (!projectLink) return null

                                const content = (
                                  <>
                                    <FaExternalLinkAlt className="pub-link-icon" />
                                    Project Page
                                  </>
                                )

                                return projectLink.isInternal ? (
                                  <Link
                                    to={projectLink.to}
                                    className="pub-link-btn pub-link-project"
                                  >
                                    {content}
                                  </Link>
                                ) : (
                                  <a
                                    href={projectLink.to}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pub-link-btn pub-link-project"
                                  >
                                    {content}
                                  </a>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
          <FaArrowUp />
        </button>
      )}

      {previewPublication && (
        <div
          className="publication-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview image for ${previewPublication.title}`}
        >
          <button
            type="button"
            className="publication-preview-modal__backdrop"
            onClick={() => setPreviewPublication(null)}
            aria-label="Close image preview"
          />
          <div className="publication-preview-modal__content">
            <button
              type="button"
              className="publication-preview-modal__close"
              onClick={() => setPreviewPublication(null)}
              aria-label="Close image preview"
            >
              <FaTimes />
            </button>
            <GatsbyImage image={previewPublication.image} alt={previewPublication.alt} />
            <p>{previewPublication.title}</p>
          </div>
        </div>
      )}
    </div>
  )
}

PublicationTable.propTypes = {
  publicationData: PropTypes.arrayOf(
    PropTypes.shape({
      Title: PropTypes.string,
      Location: PropTypes.string,
      PublicationType: PropTypes.string,
      PublishedDateYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      PDFLink: PropTypes.string,
      Authors: PropTypes.string,
      ProjectLink: PropTypes.string,
    })
  ),
}

export default PublicationTable
