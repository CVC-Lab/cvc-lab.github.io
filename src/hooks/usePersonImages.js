import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import { toLookup } from './imageLookup'

/**
 * Avatars are referenced from site metadata by filename (`aaron.png`), so they
 * used to be pulled in with a raw `require()` — shipping the untouched source
 * PNG, several megabytes in places, for an 80px circle. This resolves the same
 * filenames to processed gatsbyImageData.
 *
 * Gatsby allows one static query per file, which is why this lives apart from
 * useCardImages.
 */
const PERSON_IMAGE_QUERY = graphql`
  query PersonImages {
    allFile(
      filter: {
        sourceInstanceName: { eq: "images" }
        extension: { in: ["png", "jpg", "jpeg"] }
        relativeDirectory: { eq: "people" }
      }
    ) {
      nodes {
        relativePath
        childImageSharp {
          gatsbyImageData(
            width: 256
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
 * Resolve a person's `image` (a filename inside src/images/people, extension
 * included) to a File node carrying childImageSharp, or null.
 */
export const usePersonImage = () => {
  const data = useStaticQuery(PERSON_IMAGE_QUERY)
  const nodes = data.allFile.nodes

  return React.useMemo(() => {
    const lookup = toLookup(nodes)
    return imageName => (imageName ? lookup[`people/${imageName}`] || null : null)
  }, [nodes])
}
