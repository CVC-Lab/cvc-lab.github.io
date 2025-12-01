import * as React from 'react'
import PropTypes from 'prop-types'
import { useStaticQuery, graphql } from 'gatsby'

// Create a context for site metadata
export const SiteContext = React.createContext({})

/**
 * SiteProvider component that wraps your app and makes site data available to any
 * component in your application via the useContext hook.
 */
export const SiteProvider = ({ children }) => {
  const [errorState, setErrorState] = React.useState(null)

  // Always call useStaticQuery at the top level, never conditionally
  const data = useStaticQuery(graphql`
    query SiteMetadataQuery {
      site {
        siteMetadata {
          title
          description
          menuLinks {
            name
            link
            scroll_link
          }
          softwareProjects {
            category
            items {
              name
              description
            }
          }
          projectTiles {
            name
            description
            img_name
            link
            tags
            date
          }
          peopleCards {
            name
            image
            position
            status
          }
          newsTiles {
            name
            description
            category
            link
            date
            featured
          }
        }
      }
    }
  `)

  // Create a fallback object in case of errors
  const fallbackData = React.useMemo(
    () => ({
      site: {
        siteMetadata: {
          title: 'Computational Visualization Center',
          description: 'A cross-disciplinary effort at UT Austin',
          menuLinks: [],
          softwareProjects: [],
          projectTiles: [],
          peopleCards: [],
          newsTiles: [],
        },
      },
    }),
    []
  )

  // Handle potential errors
  React.useEffect(() => {
    try {
      // Check if data is valid
      if (!data || !data.site || !data.site.siteMetadata) {
        throw new Error('Invalid site metadata')
      }
    } catch (error) {
      setErrorState(error)
    }
  }, [data])

  const contextValue = React.useMemo(() => {
    // Use data if available, otherwise use fallback
    const siteData =
      data && data.site && data.site.siteMetadata
        ? data.site.siteMetadata
        : fallbackData.site.siteMetadata

    return {
      ...siteData,
      hasError: errorState !== null,
      errorMessage: errorState ? errorState.message : null,
    }
  }, [data, errorState, fallbackData.site.siteMetadata])

  return <SiteContext.Provider value={contextValue}>{children}</SiteContext.Provider>
}

SiteProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * Custom hook to access the site context
 */
export const useSiteMetadata = () => {
  const context = React.useContext(SiteContext)

  if (context === undefined) {
    throw new Error('useSiteMetadata must be used within a SiteProvider')
  }

  return context
}
