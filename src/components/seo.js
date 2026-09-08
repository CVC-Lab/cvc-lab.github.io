/**
 * SEO head for the Gatsby Head API.
 *
 * Usage from a page:  export const Head = ({ location }) => <Seo title="..." pathname={location.pathname} />
 */

import * as React from 'react'
import PropTypes from 'prop-types'
import { useStaticQuery, graphql } from 'gatsby'

const DEFAULT_IMAGE_PATH = '/og-image.jpg'

function Seo({ description = '', lang = 'en', meta = [], title, pathname, image }) {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          siteUrl
        }
      }
    }
  `)

  const siteTitle = site.siteMetadata.title
  const siteUrl = (site.siteMetadata.siteUrl || '').replace(/\/+$/, '')
  const metaDescription = description || site.siteMetadata.description
  // Pages pass their own title; the homepage passes the site name itself, which
  // used to render as "Site | Site".
  const fullTitle = title && title !== siteTitle ? `${title} | ${siteTitle}` : siteTitle
  const canonical = pathname && siteUrl ? `${siteUrl}${pathname}` : undefined
  const imageUrl = siteUrl ? `${siteUrl}${image || DEFAULT_IMAGE_PATH}` : undefined

  return (
    <>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      {canonical && <meta property="og:url" content={canonical} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
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
  title: PropTypes.string,
  pathname: PropTypes.string,
  image: PropTypes.string,
}

export default Seo
