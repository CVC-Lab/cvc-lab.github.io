import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import './QuickStats.css'

const SPONSORS = [
  { name: 'NSF', fullName: 'National Science Foundation' },
  { name: 'NIH', fullName: 'National Institutes of Health' },
  { name: 'DOD', fullName: 'Department of Defense' },
  { name: 'DOE', fullName: 'Sandia & LLNL National Labs' },
  { name: 'NASA', fullName: 'NASA' },
  { name: 'MJFF', fullName: 'Michael J. Fox Foundation' },
]

const QuickStats = ({ projectCount, publicationCount, memberCount }) => {
  const stats = [
    {
      number: projectCount || '20+',
      label: 'Research Projects',
      link: '/projects',
    },
    {
      number: publicationCount || '100+',
      label: 'Publications',
      link: '/publications',
    },
    {
      number: memberCount || '15+',
      label: 'Team Members',
      link: null,
      scrollTo: 'people',
    },
    {
      number: '30+',
      label: 'Years of Research',
      link: null,
    },
  ]

  return (
    <section className="quick-stats">
      <div className="quick-stats-container">
        <div className="stats-row">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              {stat.link ? (
                <Link to={stat.link} className="stat-link">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </Link>
              ) : stat.scrollTo ? (
                <a href={`#${stat.scrollTo}`} className="stat-link">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </a>
              ) : (
                <div className="stat-content">
                  <span className="stat-number">{stat.number}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="sponsors-row">
          <span className="sponsors-label">Supported by</span>
          <div className="sponsors-list">
            {SPONSORS.map((sponsor, index) => (
              <span key={index} className="sponsor-badge" title={sponsor.fullName}>
                {sponsor.name}
              </span>
            ))}
            <Link to="/sponsors" className="sponsors-more">
              and more →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

QuickStats.propTypes = {
  projectCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  publicationCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  memberCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

export default QuickStats
