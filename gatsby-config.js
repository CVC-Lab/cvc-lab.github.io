require('dotenv').config({
  path: `.env`,
})

// Import data from separate modules
const peopleData = require('./src/data/site/people')
const projectsData = require('./src/data/site/projects')
const newsData = require('./src/data/site/news')
const softwareData = require('./src/data/site/software')
const menuData = require('./src/data/site/menu')

module.exports = {
  pathPrefix: '/',
  siteMetadata: {
    title: `Computational Visualization Center`,
    peopleCards: peopleData,
    newsTiles: newsData,
    projectTiles: projectsData,
    softwareProjects: softwareData,
    menuLinks: menuData,
    description: `A cross-disciplinary effort to develop and improve the technologies for computational modeling, simulation, analysis, and visualization.`,
    author: `cvc`,
    siteUrl: `https://cvc-lab.github.io/`,
  },
  plugins: [
    // Using Gatsby Head API instead of react-helmet
    // `gatsby-plugin-react-helmet`,

    `gatsby-plugin-typescript`,
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `videos`,
        path: `${__dirname}/src/videos`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Computational Visualization Center at the University of Texas at Austin`,
        short_name: `CVC`,
        start_url: `/`,
        background_color: `#bf5700`,
        theme_color: `#bf5700`,
        display: `minimal-ui`,
        icon: `src/favicons/favicon.png`, // This must be a local file path
        icons: [
          {
            src: `src/favicons/favicon-16x16.png`, // Use absolute path not relative
            sizes: `16x16`,
            type: `image/png`,
          },
          {
            src: `src/favicons/android-chrome-192x192.png`, // Use absolute path not relative
            sizes: `192x192`,
            type: `image/png`,
          },
        ],
        cache_busting_mode: 'none', // Ensure filenames don't have hash
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `markdown`,
        path: `${__dirname}/src/markdown`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `data`,
        path: `${__dirname}/src/data/`,
      },
    },
    `gatsby-transformer-csv`,
    `gatsby-transformer-remark`,
    `gatsby-remark-copy-linked-files`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
              // Removed the path option as it's not valid for gatsby-remark-images
            },
          },
          {
            resolve: 'gatsby-remark-static-images',
          },
          {
            resolve: `gatsby-remark-copy-linked-files`,
          },
          {
            resolve: `gatsby-remark-katex`,
            options: {
              // Add any KaTeX options from https://github.com/KaTeX/KaTeX/blob/master/docs/options.md here
              strict: `ignore`,
            },
          },
          {
            resolve: 'gatsby-remark-embed-video',
            options: {
              related: false, //Optional: Will remove related videos from the end of an embedded YouTube video.
              noIframeBorder: true, //Optional: Disable insertion of <style> border: 0
              loadingStrategy: 'lazy', //Optional: Enable support for lazy-load offscreen iframes. Default is disabled.
              urlOverrides: [
                {
                  id: 'youtube',
                  embedURL: videoId => `https://www.youtube-nocookie.com/embed/${videoId}`,
                },
              ], //Optional: Override URL of a service provider, e.g to enable youtube-nocookie support
              containerClass: 'embedVideo-container', //Optional: Custom CSS class for iframe container, for multiple classes separate them by space
              iframeId: false, //Optional: if true, iframe's id will be set to what is provided after 'video:' (YouTube IFrame player API requires iframe id)
            },
          },
        ],
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
