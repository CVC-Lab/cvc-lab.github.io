/**
 * SEO head for the Gatsby Head API.
 *
 * Usage from a page:  export const Head = ({ location }) => <Seo title="..." pathname={location.pathname} />
 */

import * as React from 'react'
import PropTypes from 'prop-types'
import { useStaticQuery, graphql } from 'gatsby'

const DEFAULT_IMAGE = {
  path: '/cvc-projects-share.jpg',
  width: 1200,
  height: 630,
  alt: 'Figures from four CVC projects: the piano digital twin, Parkinson’s motor states, the ski jumper digital twin, and subsurface flow modeling',
}

function Seo({
  description = '',
  lang = 'en',
  meta = [],
  title,
  pathname,
  image,
  imageAlt,
  type = 'website',
}) {
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
  // A page kept out of the index names no canonical URL for itself.
  const noindex = meta.some(({ name, content }) => name === 'robots' && /noindex/i.test(content))
  const canonical = pathname && siteUrl && !noindex ? `${siteUrl}${pathname}` : undefined
  const imageUrl = siteUrl ? `${siteUrl}${image || DEFAULT_IMAGE.path}` : undefined
  // Dimensions are only known for the default image; a page image brings its own alt.
  const isDefaultImage = Boolean(imageUrl) && !image
  const imageDescription = imageUrl ? (image ? imageAlt : DEFAULT_IMAGE.alt) : undefined

  return (
    <>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="en_US" />
      {canonical && <meta property="og:url" content={canonical} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {isDefaultImage && <meta property="og:image:width" content={String(DEFAULT_IMAGE.width)} />}
      {isDefaultImage && <meta property="og:image:height" content={String(DEFAULT_IMAGE.height)} />}
      {imageDescription && <meta property="og:image:alt" content={imageDescription} />}
      <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {imageDescription && <meta name="twitter:image:alt" content={imageDescription} />}
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
  imageAlt: PropTypes.string,
  type: PropTypes.string,
}

export default Seo
