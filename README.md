# Computational Visualization Center (CVC) Website

This is the official website for the Computational Visualization Center (CVC) at UT Austin. Built with Gatsby and deployed to GitHub Pages, it showcases our research, publications, software, and team.

## Table of Contents

- [Installation](#installation)
- [Development](#development)
- [Scripts](#scripts)
- [Build and Deployment](#build-and-deployment)
- [Folder Structure](#folder-structure)
- [Static Microsites](#static-microsites)
- [Dependency Notes](#dependency-notes)
- [Adding Content](#adding-content)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Use Node 22. The repository has an `.nvmrc`, so with nvm:

   ```
   nvm install
   nvm use
   ```

   Gatsby 5 supports Node 18 to 25; `package.json` asks for `>=22.14.0 <26`. On another version the build still runs and prints a warning that starts with `warn Node`.

2. Clone the repository and install the dependencies:

   ```
   git clone https://github.com/CVC-Lab/cvc-lab.github.io.git
   cd cvc-lab.github.io
   npm install
   ```

3. Python 3 is needed only for the PD companion tests.

## Development

```
npm run develop
```

This starts a development server at `http://localhost:8000/`. The static microsites under `static/projects/` are served at their production URLs as well (see [Static Microsites](#static-microsites)).

## Scripts

- `npm run develop` (or `npm start`): development server at http://localhost:8000
- `npm run build`: production build into `public/`
- `npm run serve`: serve the production build at http://localhost:9000
- `npm run clean`: delete Gatsby's `.cache/` and `public/`
- `npm run deploy`: clean build, then publish `public/` to the `gh-pages` branch
- `npm run lint` / `npm run lint:fix`: ESLint over the repository
- `npm run format` / `npm run format:check`: Prettier (`static/` and `src/markdown/` are not formatted)
- `npm test`: Jest suites in `tests/`
- `npm run check`: lint, format check and tests in one go
- `npm run type-check`: `tsc --noEmit`
- `npm run test:companion`: data tests for the PD research companion
- `npm run test:companion:browser`: browser tests for the PD research companion

## Build and Deployment

```
npm run deploy
```

`deploy` runs `gatsby clean`, a full `gatsby build` and then pushes `public/` to the `gh-pages` branch with a `.nojekyll` file. Run it on Node 22 from an up-to-date `main`. A clean build reprocesses every image, so it takes minutes.

`build` and `deploy` run Gatsby with a single worker (`GATSBY_CPU_COUNT=1`). With several workers, a bug in Gatsby's cache database (lmdb-js) can lose query results and fail the build with "Couldn't find temp query result". The single worker avoids it at the cost of about 35 seconds per clean build.

`npm run build` alone is incremental: it reuses `.cache/` and leaves files of earlier builds in `public/`.

## Folder Structure

```
.
├── src/
│   ├── components/      # React components; shared primitives in ui/
│   ├── data/            # publications.yaml (checked by publications-schema.js), site/*.js (people, projects, news, software, menu)
│   ├── favicons/        # icon-512.png, source of the generated icons
│   ├── hooks/           # Image queries and motion/scroll helpers
│   ├── images/          # Image assets
│   ├── markdown/        # Markdown pages (projects, news, seminars, software, guides, ...)
│   ├── pages/           # Page components and the markdown page template
│   └── styles/          # Tokens (variables.css), base styles (global.css), prose.css
├── static/              # Served as is: robots.txt, favicon.ico, media/, papers/, projects/<static microsites>
├── scripts/             # PD companion scripts (Python)
├── tests/               # Jest suites
├── docs/                # How to add content; archive/ keeps the text of pages taken off the site
├── gatsby-*.js          # Gatsby configuration
├── eslint.config.js     # ESLint (flat config)
├── jest.config.js       # Jest
├── .prettierrc          # Prettier
└── .nvmrc               # Node version
```

## Static Microsites

Some project pages are plain HTML under `static/projects/<name>/`, outside Gatsby. A new one is registered in three places:

- `STATIC_PREFIXES` in `src/components/ui/SmartLink.js`, so links to it are plain links instead of Gatsby routes;
- `STATIC_MICROSITES` in `gatsby-node.js`, so `npm run develop` serves its `index.html`;
- `STATIC_SITEMAP_PATHS` in `gatsby-config.js`, only if it should be indexed by search engines.

## Dependency Notes

- React stays on 18 and Gatsby on 5.
- `isomorphic-dompurify` is pinned to an exact version: newer releases change the jsdom that is bundled into the build.
- `katex` is pinned to an exact version: newer 0.16 releases change the layout of rendered math. Compare the math pages before bumping it.
- JSX uses the classic runtime (`.babelrc`), so every file with JSX imports React.
- Never run `npm audit fix --force`: it downgrades Gatsby plugins. The remaining advisories sit in dependencies of Gatsby, Jest and gh-pages, and `npm audit` offers only breaking downgrades for them.

## Adding Content

See the documentation in the `docs/` folder:

- [Adding News](docs/ADDNEWS.md)
- [Adding People](docs/ADDPEOPLE.md)
- [Adding Projects](docs/ADDPROJECT.md)
- [Adding Publications](docs/ADDPUBLICATION.md)
- [Adding Software](docs/ADDSOFTWARE.md)

The site has no internal or password-protected pages. The text of the ones it used to have is kept in [docs/archive/](docs/archive/README.md) and is not built into the site.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run check`
4. Test locally with `npm run develop`, and with `npm run build && npm run serve` for anything that touches the build
5. Submit a pull request

## License

This project is licensed under the 0BSD license - see the [LICENSE](LICENSE) file for details.
