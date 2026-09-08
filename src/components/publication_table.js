import * as React from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { useCardImage } from '../hooks/useCardImages'
import { FaArrowUp, FaTimes } from 'react-icons/fa'
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
    iconId: isPreprint ? 'pub-icon-paper' : 'pub-icon-pdf',
    label: isPreprint ? 'Paper' : 'PDF',
  }
}

// One <symbol> per icon, referenced with <use>. Rendering react-icons inline put
// a full SVG in every one of the ~800 link buttons: 340 KB of HTML on this page.
const PubIconSprite = () => (
  <svg aria-hidden="true" focusable="false" style={{ display: 'none' }}>
    <symbol id="pub-icon-pdf" viewBox="0 0 384 512">
      <path d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z" />
    </symbol>
    <symbol id="pub-icon-paper" viewBox="0 0 384 512">
      <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-64c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12v8zm0-72v8c0 6.6-5.4 12-12 12H108c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm96-114.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z" />
    </symbol>
    <symbol id="pub-icon-external" viewBox="0 0 512 512">
      <path d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" />
    </symbol>
  </svg>
)

const PubIcon = ({ id }) => (
  <svg className="pub-link-icon" aria-hidden="true" focusable="false">
    <use href={`#${id}`} />
  </svg>
)

PubIcon.propTypes = { id: PropTypes.string.isRequired }

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

  const closeButtonRef = React.useRef(null)

  // Dialog behaviour: move focus in, keep Tab inside, lock page scroll, and put
  // focus back on the thumbnail that opened it when it closes.
  React.useEffect(() => {
    if (!previewPublication || typeof window === 'undefined') return undefined

    const opener = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setPreviewPublication(null)
      } else if (event.key === 'Tab') {
        // The close button is the only focusable control inside the dialog.
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (opener && typeof opener.focus === 'function') opener.focus()
    }
  }, [previewPublication])

  const groupedPublications = React.useMemo(
    () => groupByYearAndType(publicationData),
    [publicationData]
  )
  const sortedYears = React.useMemo(
    () => Object.keys(groupedPublications).sort((a, b) => b - a),
    [groupedPublications]
  )

  return (
    <div className="publications-class" id="publications">
      <PubIconSprite />
      <div className="publication-container">
        <h1 className="header-sub">Publications</h1>

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
                            <p className="pub-authors">{publication.Authors}</p>
                            {publication.Location && publication.Location !== 'NULL' && (
                              <p
                                className="pub-venue"
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(`<i>${publication.Location}</i>`),
                                }}
                              ></p>
                            )}
                            <div className="pub-links">
                              {pdfLink && (
                                <a
                                  href={pdfLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`pub-link-btn ${paperLinkConfig.className}`}
                                >
                                  <PubIcon id={paperLinkConfig.iconId} />
                                  {paperLinkConfig.label}
                                </a>
                              )}
                              {(() => {
                                const projectLink = resolveProjectLink(publication.ProjectLink)

                                if (!projectLink) return null

                                const content = (
                                  <>
                                    <PubIcon id="pub-icon-external" />
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
            tabIndex={-1}
            className="publication-preview-modal__backdrop"
            onClick={() => setPreviewPublication(null)}
            aria-label="Close image preview"
          />
          <div className="publication-preview-modal__content">
            <button
              ref={closeButtonRef}
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
