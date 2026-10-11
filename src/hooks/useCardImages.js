import * as React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import { toLookup, warnMissing } from './imageLookup'

/**
 * Card, tile and figure artwork is referenced from data files by path string
 * (for example `publications/PUB_QC-PHAST_Search`). This resolves those strings
 * to processed `gatsbyImageData` (800px CONSTRAINED, WebP, responsive srcset).
 *
 * What the query covers, and nothing else:
 * - `artwork`: every image directly inside src/images/publications,
 *   src/images/project_tiles and src/images/projects. New tile or thumbnail
 *   artwork belongs in one of these and needs no change here.
 * - `listed`: single images that live in a project's figure directory. Add the
 *   path below when a card or figure needs one; the rest of those directories
 *   is markdown-only and is handled by gatsby-remark-images.
 *
 * A path the query does not cover resolves to null and the caller renders no
 * image (see warnMissing). Do not add `publicURL` to the selection: it copies
 * every matched original (about 130 MB) into the build.
 *
 * The query cannot know how wide a caller lays the image out, so its `sizes`
 * is the 800px default. Callers showing it narrower should pass their own:
 * `<GatsbyImage sizes="235px" … />`.
 */
const CARD_IMAGE_QUERY = graphql`
  query CardImages {
    artwork: allFile(
      filter: {
        sourceInstanceName: { eq: "images" }
        extension: { in: ["png", "jpg", "jpeg"] }
        relativeDirectory: { in: ["publications", "project_tiles", "projects"] }
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
    listed: allFile(
      filter: {
        sourceInstanceName: { eq: "images" }
        relativePath: {
          in: [
            "projects/ai4pd/ai4pd-architecture-figure1.png"
            "projects/ai4pd/ai4pd-multi-agent-architecture.jpg"
            "projects/ai4pd/md_image.png"
            "projects/ai4pd/03_moca_upsit_distributions.png"
            "projects/ai4pd/05_arm_swing_asymmetry.png"
            "projects/ai4pd/09_tug_performance.png"
            "projects/pd_research_companion/companion_thumbnail.png"
            "projects/posterior_aware_pd_phenotyping/miccai_2026_posterior_aware_thumbnail.png"
            "projects/piano_digital_twin/piano_digital_twin_hero.png"
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

const MISSING_HINT =
  'Put the file in src/images/publications, project_tiles or projects, or add its path to the `listed` filter in src/hooks/useCardImages.js.'

/**
 * Resolve a tile's `img_name` (extensionless, relative to src/images) to a File
 * node carrying childImageSharp, or null when the image is not in scope.
 */
export const useCardImage = () => {
  const data = useStaticQuery(CARD_IMAGE_QUERY)
  const artwork = data.artwork.nodes
  const listed = data.listed.nodes

  return React.useMemo(() => {
    const lookups = [toLookup(artwork), toLookup(listed)]
    const find = path => lookups[0][path] || lookups[1][path]
    return imgName => {
      if (!imgName) return null
      const node = find(`${imgName}.png`) || find(`${imgName}.jpg`) || find(`${imgName}.jpeg`)
      if (!node) warnMissing('useCardImage', imgName, MISSING_HINT)
      return node || null
    }
  }, [artwork, listed])
}
