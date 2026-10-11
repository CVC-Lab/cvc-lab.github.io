import * as React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import Layout from '../components/layout'
import Seo from '../components/seo'
import ResearchThemesLanding from '../components/home-v2/ResearchThemesLanding'

const IndexPage = () => (
  <Layout headerVariant="nav-only">
    <ResearchThemesLanding />
  </Layout>
)

export default IndexPage

// Only facts the site already prints: its name and URL, the university, the footer
// address and the footer's GitHub link.
const OrganizationJsonLd = () => {
  const { site } = useStaticQuery(graphql`
    query HomeOrganizationJsonLd {
      site {
        siteMetadata {
          title
          siteUrl
        }
      }
    }
  `)
  const { title, siteUrl } = site.siteMetadata
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    name: title,
    url: `${siteUrl.replace(/\/+$/, '')}/`,
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'The University of Texas at Austin',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: "201 E 24th St, Peter O'Donnell Jr. Building (POB) 2.102",
      addressLocality: 'Austin',
      addressRegion: 'TX',
      postalCode: '78712',
    },
    sameAs: ['https://github.com/cvc-lab'],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export const Head = ({ location }) => (
  <>
    <Seo
      pathname={location.pathname}
      title="Computational Visualization Center"
      description="Explore CVC research across Healthcare AI, World Models, and AI for Science."
    />
    <OrganizationJsonLd />
  </>
)
