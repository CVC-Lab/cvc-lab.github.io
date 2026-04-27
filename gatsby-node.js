const path = require('path')
const express = require('express')

const DBG_PROGRESS_ROUTE = '/projects/dynamic-belief-games/DBG_progress'
const DBG_PROGRESS_DIR = path.join(
  __dirname,
  'static',
  'projects',
  'dynamic-belief-games',
  'DBG_progress'
)

exports.onCreateDevServer = ({ app }) => {
  app.use(
    DBG_PROGRESS_ROUTE,
    express.static(DBG_PROGRESS_DIR, {
      extensions: ['html'],
      index: ['index.html'],
    })
  )
}

// Suppress webpack cache warnings in development
exports.onCreateWebpackConfig = ({ stage, actions, getConfig }) => {
  const config = getConfig()
  
  // Disable webpack cache warnings
  if (stage === 'develop' || stage === 'develop-html') {
    // Override the default cache settings
    config.cache = {
      type: 'filesystem',
      compression: false,
      store: 'pack',
      buildDependencies: {
        config: [__filename],
      },
      // Increase the threshold for warnings
      maxMemoryGenerations: Infinity,
      memoryCacheUnaffected: true,
      // Disable serialization warnings
      profile: false,
    }
    
    // Suppress infrastructure logging warnings
    config.infrastructureLogging = {
      level: 'error',
      debug: false,
    }
    
    // Replace the entire config
    actions.replaceWebpackConfig(config)
  }
}
