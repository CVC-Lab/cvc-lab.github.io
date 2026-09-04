import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import { toLookup } from './imageLookup'

/**
 * Card and tile artwork is referenced from site metadata by path string (for
 * example `publications/PUB_QC-PHAST_Search`), so it used to be pulled in with
 * a raw `require()`. That ships the untouched source PNG — several megabytes
 * each — for images rendered a few hundred pixels wide.
 *
 * This resolves the same path strings to processed `gatsbyImageData`, so the
 * `GatsbyImage` branches the components already have light up and each card
 * downloads a display-sized WebP with a responsive srcset instead.
 *
 * The directory filter is explicit rather than a catch-all so the build only
 * runs sharp over artwork actually rendered as a card; figures inside markdown
 * project pages are handled by gatsby-remark-images. Add a directory here if
 * new tile artwork lands outside these paths — until then such a tile still
 * renders, just via the unoptimised `require()` fallback.
 */
const CARD_IMAGE_QUERY = graphql`
  query CardImages {
    allFile(
      filter: {
        sourceInstanceName: { eq: "images" }
        extension: { in: ["png", "jpg", "jpeg"] }
        relativeDirectory: {
          in: [
            "publications"
            "project_tiles"
            "projects"
            "projects/piano_digital_twin"
            "projects/posterior_aware_pd_phenotyping"
            "projects/ski_jumper_digital_twin"
          ]
        }
      }
    ) {
      nodes {
        relativePath
        childImageSharp {
          gatsbyImageData(
            width: 800
            layout: CONSTRAINED
            placeholder: DOMINANT_COLOR
            formats: [AUTO, WEBP]
          )
        }
      }
    }
  }
`

/**
 * Resolve a tile's `img_name` (extensionless, relative to src/images) to a File
 * node carrying childImageSharp, or null when the image is not in scope.
 */
export const useCardImage = () => {
  const data = useStaticQuery(CARD_IMAGE_QUERY)
  const nodes = data.allFile.nodes

  return React.useMemo(() => {
    const lookup = toLookup(nodes)
    return imgName => {
      if (!imgName) return null
      return (
        lookup[`${imgName}.png`] || lookup[`${imgName}.jpg`] || lookup[`${imgName}.jpeg`] || null
      )
    }
  }, [nodes])
}
