const js = require('@eslint/js')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const jsxA11y = require('eslint-plugin-jsx-a11y')
const babelParser = require('@babel/eslint-parser')
const globals = require('globals')

module.exports = [
  {
    ignores: ['node_modules/', '.cache/', 'public/', 'static/', 'coverage/', '*.min.js'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // Parse without .babelrc: babel-preset-gatsby needs .cache/babelState.json, which only
        // exists after a Gatsby build.
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ['jsx'] },
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        __PATH_PREFIX__: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    // The recommended sets come first so the project settings below override them. JSX uses the
    // classic runtime (.babelrc), so react/react-in-jsx-scope and react/jsx-uses-react stay on.
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/display-name': 'off',
      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['to'],
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Gatsby supplies page and Head props. Head must not carry static properties: develop mode
    // strips the export, so a leftover `Head.propTypes = ...` throws.
    files: ['src/pages/**/*.js'],
    rules: {
      'react/prop-types': 'off',
    },
  },
  {
    files: ['tests/**/*.js', 'jest.setup.js', '__mocks__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'react/prop-types': 'off',
    },
  },
]
