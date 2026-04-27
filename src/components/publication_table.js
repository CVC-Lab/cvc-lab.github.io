import * as React from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { Link } from 'gatsby'
import { FaFilePdf, FaExternalLinkAlt, FaArrowUp } from 'react-icons/fa'
import PropTypes from 'prop-types'
import './publication_table.css'
import { database } from '../data/database'
import { ref, get } from 'firebase/database'
import scalableRiskAverseThumbnail from '../images/publications/PUB_Scalable Risk-Averse.png'
import computerAlgebraThumbnail from '../images/publications/PUB_Computer Algebra.png'
import phastThumbnail from '../images/publications/PUB_PHASTPort-Hamiltonian.png'
import grlSnamThumbnail from '../images/publications/PUB_GRL‑SNAM.png'
import compositionalElbosThumbnail from '../images/publications/PUB_Compositional ELBOs.png'
import differentialPointwiseThumbnail from '../images/publications/PUB_Differential and Pointwise.png'
import fourDreconsThumbnail from '../images/publications/PUB_4drecons.png'
import hamiltonianNoisyTrajectoryThumbnail from '../images/publications/PUB_Hamiltonian_noisyTrajectory.png'
import pathwayAnchoredThumbnail from '../images/publications/PUB_Pathway Anchored Multimodal.png'
import wearableSensorBiomarkersThumbnail from '../images/publications/PUB_Wearable Sensor Biomarkers.png'
import threePhaseReservoirThumbnail from '../images/publications/PUB_Three-Phase Reservoir.png'
import fieldScaleBayesianThumbnail from '../images/publications/PUB_Field-Scale Bayesian.png'
import roughPathThumbnail from '../images/publications/PUB_A Rough Path Approach.png'
import rapidMultiKernelThumbnail from '../images/publications/PUB_Rapid Multi-kernel Estimation.png'

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
      src: scalableRiskAverseThumbnail,
      alt: 'Scalable Risk-Averse Well-Placement Optimization publication thumbnail',
    },
  'Computer Algebra Meets Hamiltonian Geometry': {
    src: computerAlgebraThumbnail,
    alt: 'Computer Algebra Meets Hamiltonian Geometry publication thumbnail',
  },
  'PHAST: Port-Hamiltonian Architecture for Structured Temporal Dynamics Forecasting': {
    src: phastThumbnail,
    alt: 'PHAST publication thumbnail',
  },
  'GRL-SNAM: Geometric Reinforcement Learning with Path Differential Hamiltonians for Simultaneous Navigation and Mapping in Unknown Environments':
    {
      src: grlSnamThumbnail,
      alt: 'GRL-SNAM publication thumbnail',
    },
  'Scalable Robust Bayesian Co-Clustering with Compositional ELBOs': {
    src: compositionalElbosThumbnail,
    alt: 'Compositional ELBOs publication thumbnail',
  },
  'A Differential and Pointwise Control Approach to Reinforcement Learning': {
    src: differentialPointwiseThumbnail,
    alt: 'Differential and Pointwise Control publication thumbnail',
  },
  '4drecons: 4d neural implicit deformable objects reconstruction from a single rgb-d camera with geometrical and topological regularizations':
    {
      src: fourDreconsThumbnail,
      alt: '4drecons publication thumbnail',
    },
  'Learning Generalized Hamiltonian Dynamics with Stability from Noisy Trajectory Data': {
    src: hamiltonianNoisyTrajectoryThumbnail,
    alt: 'Hamiltonian dynamics from noisy trajectories publication thumbnail',
  },
  'Pathway Anchored Multimodal Clustering Reveals Circuit Level Signatures in Parkinsons Disease': {
    src: pathwayAnchoredThumbnail,
    alt: 'Pathway anchored multimodal clustering publication thumbnail',
  },
  'Integrated Genetic, Molecular, and Wearable Sensor Biomarkers Enable Bayesian Machine Learning-Driven Precision Stratification in Parkinson’s Disease: A Comprehensive Multi-Cohort Validation Study':
    {
      src: wearableSensorBiomarkersThumbnail,
      alt: 'Wearable sensor biomarkers publication thumbnail',
    },
  'Bayesian Port–Hamiltonian Surrogate for Three-Phase Reservoir Flow Simulation': {
    src: threePhaseReservoirThumbnail,
    alt: 'Three-phase reservoir flow publication thumbnail',
  },
  'Field-Scale Bayesian Production Forecasting via Spectral Gaussian-Process Mixtures': {
    src: fieldScaleBayesianThumbnail,
    alt: 'Field-scale Bayesian production forecasting publication thumbnail',
  },
  'Stochastic Differential Policy Optimization: A Rough Path Approach to Reinforcement Learning': {
    src: roughPathThumbnail,
    alt: 'Rough path reinforcement learning publication thumbnail',
  },
  'Self-balancing, Memory Efficient, Dynamic Metric Space Data Maintenance, for Rapid Multi-kernel Estimation':
    {
      src: rapidMultiKernelThumbnail,
      alt: 'Rapid multi-kernel estimation publication thumbnail',
    },
}

const CVC_SITE_ORIGIN = 'https://cvc-lab.github.io'

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
  const [firebasePublicationData, setFirebasePublicationData] = React.useState([])
  const [showBackToTop, setShowBackToTop] = React.useState(false)

  React.useEffect(() => {
    if (publicationData.length > 0) {
      return
    }

    const dbRef = ref(database, '10EvljkxfSNwL6I1m81tXzruizAVLN-EwmgclGkh_vkA/Papers')
    get(dbRef)
      .then(snapshot => {
        if (snapshot.exists()) {
          setFirebasePublicationData(Object.values(snapshot.val()))
        }
      })
      .catch(() => {
        // Firebase error occurred, handled silently
      })
  }, [publicationData])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const resolvedPublicationData =
    publicationData.length > 0 ? publicationData : firebasePublicationData

  const groupedPublications = groupByYearAndType(resolvedPublicationData)
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
                {publicationTypeOrder
                  .filter(type => types[type])
                  .map(type => (
                    <div key={type} className="type-section">
                      <h4 className="type-header">{type}</h4>
                      {types[type].map((publication, index) => (
                        <div
                          key={generatePublicationKey(publication, index)}
                          className="publication-card"
                        >
                          {publicationThumbnailMap[publication.Title] && (
                            <div className="publication-thumbnail">
                              <img
                                src={publicationThumbnailMap[publication.Title].src}
                                alt={publicationThumbnailMap[publication.Title].alt}
                                loading="lazy"
                              />
                            </div>
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
                              {publication.PDFLink &&
                                publication.PDFLink !== 'NULL' &&
                                (publication.PDFLink.startsWith('http://') ||
                                  publication.PDFLink.startsWith('https://')) && (
                                  <a
                                    href={publication.PDFLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pub-link-btn pub-link-pdf"
                                  >
                                    <FaFilePdf className="pub-link-icon" />
                                    PDF
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
                      ))}
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
      LocalPDFLink: PropTypes.string,
      Authors: PropTypes.string,
      ProjectLink: PropTypes.string,
    })
  ),
}

export default PublicationTable
