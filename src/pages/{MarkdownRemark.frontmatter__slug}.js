import { graphql, navigate } from 'gatsby'
import * as React from 'react'
import PropTypes from 'prop-types'
import DOMPurify from 'isomorphic-dompurify'
import Layout from '../components/layout'
import '../components/project_page.css'
import 'katex/dist/katex.min.css'
import '../components/software_list.css'

const SponsorsTemplate = ({ data: { markdownRemark } }) => {
  const { frontmatter, html } = markdownRemark

  const handleGoBack = () => {
    // Check if we can go back in history
    /* eslint-disable-next-line no-undef */
    if (typeof window !== 'undefined' && window.history.length > 1) {
      /* eslint-disable-next-line no-undef */
      window.history.back()
    } else {
      // Fallback to home page
      navigate('/')
    }
  }

  return (
    <Layout>
      <div className="sponsors">
        <div>
          <button
            onClick={handleGoBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              padding: '0.5rem 0',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => (e.target.style.color = 'var(--color-primary-dark)')}
            onMouseLeave={e => (e.target.style.color = 'var(--color-primary)')}
          >
            ← Back
          </button>
          <h1>{frontmatter.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
        </div>
      </div>
    </Layout>
  )
}

const DefaultTemplate = ({ data: { markdownRemark } }) => {
  const { frontmatter, html } = markdownRemark

  const handleGoBack = () => {
    // Check if we can go back in history
    /* eslint-disable-next-line no-undef */
    if (typeof window !== 'undefined' && window.history.length > 1) {
      /* eslint-disable-next-line no-undef */
      window.history.back()
    } else {
      // Fallback to projects section on home page
      navigate('/#projects')
    }
  }

  return (
    <Layout>
      <div
        className="project-page-class"
        id="project-page"
        style={{
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: `left`,
        }}
      >
        <div
          style={{
            margin: `0 auto`,
            maxWidth: 1050,
            paddingBottom: `5.45rem`,
            marginLeft: `1.25rem`,
            marginRight: `1.25rem`,
            width: `100%`,
          }}
        >
          <button
            onClick={handleGoBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              padding: '0.5rem 0',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => (e.target.style.color = 'var(--color-primary-dark)')}
            onMouseLeave={e => (e.target.style.color = 'var(--color-primary)')}
          >
            ← Back to Projects
          </button>
          <h4
            className="header-subtitle"
            style={{
              color: `#333f48`,
              fontSize: `1.5rem`,
              fontWeight: `600`,
              margin: `auto`,
              paddingBottom: `1.0rem`,
              paddingTop: `2.0rem`,
              marginBottom: '1rem',
            }}
          >
            {frontmatter.title}
          </h4>
          <div
            className="post-body"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
          />
        </div>
      </div>
    </Layout>
  )
}

export default function ProjectTemplate({ data }) {
  const { markdownRemark } = data

  if (markdownRemark.frontmatter.title === 'Sponsors') {
    return <SponsorsTemplate data={data} />
  } else {
    return <DefaultTemplate data={data} />
  }
}

ProjectTemplate.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.shape({
      html: PropTypes.string.isRequired,
      frontmatter: PropTypes.shape({
        title: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
}

SponsorsTemplate.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.shape({
      html: PropTypes.string.isRequired,
      frontmatter: PropTypes.shape({
        title: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
}

DefaultTemplate.propTypes = {
  data: PropTypes.shape({
    markdownRemark: PropTypes.shape({
      html: PropTypes.string.isRequired,
      frontmatter: PropTypes.shape({
        title: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
}

export const pageQuery = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        # date(formatString: "MMMM DD, YYYY")
        title
      }
    }
  }
`
