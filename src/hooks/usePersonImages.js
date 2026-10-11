import * as React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import { toLookup, warnMissing } from './imageLookup'

/**
 * Avatars are referenced from site data by filename (`aaron.png`). This resolves
 * those filenames to processed gatsbyImageData: a 256px square, cropped from the
 * centre at build time (the same framing a centred object-fit crop gives), with
 * `sizes` set for the largest avatar on the site (125px), so 1x screens load the
 * 128px file and 2x screens the 256px one.
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
            height: 256
            sizes: "125px"
            layout: CONSTRAINED
            placeholder: DOMINANT_COLOR
            formats: [AUTO, WEBP]
            transformOptions: { cropFocus: CENTER }
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
    return imageName => {
      if (!imageName) return null
      const node = lookup[`people/${imageName}`]
      if (!node) warnMissing('usePersonImage', imageName, 'Add the file to src/images/people.')
      return node || null
    }
  }, [nodes])
}
