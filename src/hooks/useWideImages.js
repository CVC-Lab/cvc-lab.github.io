import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import { toLookup } from './imageLookup'

/**
 * Full-width figures (hero and banner artwork). The card query in useCardImages
 * is CONSTRAINED to 800px, which is right for cards but crops anything laid out
 * wider than 800px: the wrapper stretches to the container while its height is
 * still computed for an 800px-wide image. FULL_WIDTH sizes by aspect ratio, so
 * the figure scales with its container and is never cropped.
 */
const WIDE_IMAGE_QUERY = graphql`
  query WideImages {
    allFile(
      filter: {
        sourceInstanceName: { eq: "images" }
        extension: { in: ["png", "jpg", "jpeg"] }
        relativeDirectory: { in: ["projects/ai4pd", "projects", "publications"] }
      }
    ) {
      nodes {
        relativePath
        childImageSharp {
          gatsbyImageData(
            layout: FULL_WIDTH
            placeholder: DOMINANT_COLOR
            formats: [AUTO, WEBP]
            breakpoints: [640, 960, 1280, 1680]
          )
        }
      }
    }
  }
`

/** Resolve an extensionless `img_name` (relative to src/images) to a FULL_WIDTH image node. */
export const useWideImage = () => {
  const data = useStaticQuery(WIDE_IMAGE_QUERY)
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
