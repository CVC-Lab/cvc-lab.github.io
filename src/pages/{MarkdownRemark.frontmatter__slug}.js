import { graphql, navigate } from 'gatsby'
import * as React from 'react'
import PropTypes from 'prop-types'
import DOMPurify from 'isomorphic-dompurify'
import Layout from '../components/layout'
import Seo from '../components/seo'
import '../components/project_page.css'
import 'katex/dist/katex.min.css'
import '../components/software_list.css'

// The HTML is generated at build time from the repo's own markdown, so the sanitiser is
// defence in depth, not a trust boundary. Its defaults strip <iframe>, which silently
// removed every YouTube embed produced by gatsby-remark-embed-video, and drop target=.
const SANITIZE_OPTIONS = {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: [
    'allow',
    'allowfullscreen',
    'frameborder',
    'scrolling',
    'target',
    'loading',
    'referrerpolicy',
  ],
}

const SponsorsTemplate = ({ data: { markdownRemark } }) => {
  const { frontmatter, html } = markdownRemark

  const handleGoBack = () => {
    navigate('/')
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
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, SANITIZE_OPTIONS) }} />
        </div>
      </div>
    </Layout>
  )
}

const DefaultTemplate = ({ data: { markdownRemark } }) => {
  const { frontmatter, html } = markdownRemark
  const projectSlugClass = frontmatter.slug
    ? `project-page-${frontmatter.slug.replace(/^\/+/, '').replace(/[^a-zA-Z0-9]+/g, '-')}`
    : ''

  const handleGoBack = () => {
    navigate('/projects')
  }

  return (
    <Layout>
      <div
        className={`project-page-class ${projectSlugClass}`.trim()}
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, SANITIZE_OPTIONS) }}
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
        slug: PropTypes.string,
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
        slug: PropTypes.string,
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
        slug: PropTypes.string,
      }).isRequired,
    }).isRequired,
  }).isRequired,
}

export const Head = ({ data, location }) => (
  <Seo
    title={data.markdownRemark.frontmatter.title}
    description={data.markdownRemark.excerpt}
    pathname={location.pathname}
  />
)

Head.propTypes = {
  data: PropTypes.object.isRequired,
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}

export const pageQuery = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      excerpt(pruneLength: 160)
      frontmatter {
        # date(formatString: "MMMM DD, YYYY")
        title
        slug
      }
    }
  }
`
