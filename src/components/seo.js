/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * Updated to use Gatsby Head API instead of react-helmet
 */

import * as React from 'react'
import PropTypes from 'prop-types'
import { useStaticQuery, graphql } from 'gatsby'

// Component for use with Gatsby Head API
export const Head = ({ title, description, lang, meta }) => (
  <Seo title={title} description={description} lang={lang} meta={meta} />
)

Head.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
}

function Seo({ description = '', lang = 'en', meta = [], title }) {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          author
        }
      }
    }
  `)

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title

  return (
    <>
      <html lang={lang} />
      <title>{title ? `${title} | ${defaultTitle}` : defaultTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content={site.siteMetadata?.author || ``} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="viewport" content="width=device-width,initial-scale=1.0" />
      {meta.map(({ name, content, property }) =>
        property ? (
          <meta key={property} property={property} content={content} />
        ) : (
          <meta key={name} name={name} content={content} />
        )
      )}
    </>
  )
}

Seo.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string.isRequired,
}

export default Seo
