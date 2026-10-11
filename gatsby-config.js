// Precedence: real environment variables, then .env.<NODE_ENV>, then .env.
require('dotenv').config({
  path: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
  quiet: true,
})

// Static microsites are not Gatsby pages, so the sitemap plugin cannot see them. List only the
// ones that are meant to be indexed (the PD research companion pages are noindex).
const STATIC_SITEMAP_PATHS = ['/projects/posterior-aware-pd-phenotyping-miccai/']

module.exports = {
  siteMetadata: {
    title: `Computational Visualization Center`,
    description: `A cross-disciplinary effort to develop and improve the technologies for computational modeling, simulation, analysis, and visualization.`,
    author: `cvc`,
    siteUrl: `https://cvc-lab.github.io/`,
  },
  plugins: [
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Computational Visualization Center`,
        short_name: `CVC`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#bf5700`,
        display: `minimal-ui`,
        icon: `src/favicons/icon-512.png`,
      },
    },
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        excludes: [
          `/internal/`,
          `/internal/**`,
          `/password-protect/`,
          `/old-home/`,
          `/projects/healthcare-ai/`,
          `/projects/dynamic-belief-games/internal/**`,
        ],
        resolvePages: ({ allSitePage: { nodes } }) => [
          ...nodes,
          ...STATIC_SITEMAP_PATHS.map(path => ({ path })),
        ],
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `markdown`,
        path: `${__dirname}/src/markdown`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
            },
          },
          `gatsby-remark-copy-linked-files`,
          {
            resolve: `gatsby-remark-katex`,
            options: {
              strict: `ignore`,
            },
          },
          {
            resolve: `gatsby-remark-embed-video`,
            options: {
              related: false,
              noIframeBorder: true,
              loadingStrategy: `lazy`,
              urlOverrides: [
                {
                  id: `youtube`,
                  embedURL: videoId => `https://www.youtube-nocookie.com/embed/${videoId}`,
                },
              ],
              containerClass: `embedVideo-container`,
              iframeId: false,
            },
          },
        ],
      },
    },
  ],
}
