import * as React from 'react'
import {
  FaBookOpen,
  FaChartLine,
  FaCopy,
  FaDownload,
  FaLayerGroup,
  FaProjectDiagram,
} from 'react-icons/fa'
import Layout from '../../components/layout'
import Seo from '../../components/seo'
import './scalable-robust-bayesian-co-clustering.css'
import heroFigure from '../../images/projects/Scalable robust bayesian co clustering/SCALABLEROBUSTBAYESIAN_1.png'
import architectureFigure from '../../images/projects/Scalable robust bayesian co clustering/SCALABLEROBUSTBAYESIAN_2.png'
import coclusterFigure from '../../images/projects/Scalable robust bayesian co clustering/SCALABLEROBUSTBAYESIAN_3.png'
import latentFigure from '../../images/projects/Scalable robust bayesian co clustering/SCALABLEROBUSTBAYESIAN_4.png'
import robustnessFigure from '../../images/projects/Scalable robust bayesian co clustering/SCALABLEROBUSTBAYESIAN_5.png'
import biomarkerFigure from '../../images/projects/Scalable robust bayesian co clustering/SCALABLEROBUSTBAYESIAN_6.png'

const paperUrl = 'https://arxiv.org/pdf/2504.04079'

const metadata = [
  ['Method', 'Variational co-clustering'],
  ['Core idea', 'Compositional ELBOs'],
  ['Domains', 'Image, text, biomedical data'],
  ['Status', 'Preprint'],
]

const featureCards = [
  {
    title: 'Row and Column Latent Spaces',
    body: 'Separate VAE pathways learn instance-side and feature-side embeddings before coordinating them through a joint latent representation.',
  },
  {
    title: 'GMM-Prior Clustering',
    body: 'Mixture priors align latent modes with soft row and column cluster assignments in an end-to-end variational model.',
  },
  {
    title: 'Compositional ELBO Training',
    body: 'Row, column, and cell-level objectives combine reconstruction, KL structure, and cross-partition regularization.',
  },
  {
    title: 'Robustness to Corruption',
    body: 'The model is designed to recover block structure under noise, missing entries, sparse signals, and outliers.',
  },
]

const pipelineSteps = [
  ['Input matrix', 'X rows x columns'],
  ['Row VAE + Column VAE', 'q(z_r | X), q(z_c | X)'],
  ['GMM latent priors', 'p(z) = sum_k pi_k N_k'],
  ['Joint latent z_rc', 'cell-level interaction'],
  ['MI cross-loss', 'align row and column partitions'],
  ['Co-cluster checkerboard', 'structured block recovery'],
]

const keyIdeas = [
  {
    title: 'Co-clustering',
    body: 'Simultaneously groups rows and columns so a data matrix can be reordered into coherent block structure.',
  },
  {
    title: 'Variational Autoencoders',
    body: 'Encode rows and columns into probabilistic latent spaces, then reconstruct the original matrix signals.',
  },
  {
    title: 'Gaussian Mixture Priors',
    body: 'Use mixture components as soft cluster anchors so latent geometry and cluster assignment are learned together.',
  },
  {
    title: 'Compositional ELBOs',
    body: 'Combine row-side, column-side, and joint cell-level variational losses into one training objective.',
  },
  {
    title: 'Doubly Reparameterized Gradients',
    body: 'Use lower-variance gradient estimators for importance-weighted variational objectives.',
  },
  {
    title: 'Scale Trick',
    body: 'Scale latent means in the reconstruction pathway to reduce posterior collapse without inflating the KL term.',
  },
  {
    title: 'MI Cross-Loss',
    body: 'Encourage learned row and column partitions to preserve dependence in the original matrix.',
  },
]

const galleryItems = [
  {
    image: coclusterFigure,
    title: 'Noisy matrix to co-cluster checkerboard',
    caption:
      'SRVCC learns row and column structure from corrupted, missing, and outlier-contaminated matrix data.',
  },
  {
    image: latentFigure,
    title: 'Latent spaces before and after training',
    caption:
      'Variational co-clustering separates row and column groups into cleaner latent modes during optimization.',
  },
  {
    image: robustnessFigure,
    title: 'Robustness under noise',
    caption:
      'The co-clustered structure remains recoverable across low, medium, and high noise settings.',
  },
  {
    image: architectureFigure,
    title: 'Variational latent architecture',
    caption: 'The architecture combines row-side, column-side, and joint latent ELBO components.',
  },
  {
    image: biomarkerFigure,
    title: 'Biomedical co-clustering exploration',
    caption:
      "The appendix explores patient-by-biomarker grouping for Parkinson's disease data as a research use case.",
  },
]

const benchmarkStats = [
  ['Fashion-MNIST-test ACC', '68.2 +/- 1.8'],
  ['WebKB4 ACC', '83.2 +/- 1.6'],
  ['Yale NMI', '61.0 +/- 1.5'],
]

const citation = `@article{vinod2025scalable,
  title={Scalable Robust Bayesian Co-Clustering with Compositional ELBOs},
  author={Vinod, Ashwin and Bajaj, Chandrajit},
  journal={arXiv preprint arXiv:2504.04079},
  year={2025}
}`

const ScalableRobustBayesianCoClusteringPage = () => {
  const [activeIdea, setActiveIdea] = React.useState(keyIdeas[0].title)
  const [copied, setCopied] = React.useState(false)
  const activeIdeaContent = keyIdeas.find(idea => idea.title === activeIdea) || keyIdeas[0]

  const copyCitation = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    await navigator.clipboard.writeText(citation)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Layout headerVariant="compact">
      <main className="srvcc-page">
        <section className="srvcc-hero">
          <div className="srvcc-shell srvcc-hero__grid">
            <div className="srvcc-hero__content">
              <p className="srvcc-eyebrow">Scalable Robust Variational Co-Clustering</p>
              <h1>Scalable Robust Bayesian Co-Clustering</h1>
              <p className="srvcc-hero__subtitle">
                A variational deep co-clustering framework for discovering robust row and column
                structure in noisy, sparse, and high-dimensional data.
              </p>
              <div className="srvcc-meta-grid" aria-label="Project metadata">
                {metadata.map(([label, value]) => (
                  <article className="srvcc-meta-card" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>
              <div className="srvcc-actions">
                <a className="srvcc-button srvcc-button--primary" href={paperUrl}>
                  <FaBookOpen /> Read Paper
                </a>
                <a className="srvcc-button" href="#results">
                  <FaChartLine /> Jump to Results
                </a>
              </div>
            </div>
            <figure className="srvcc-hero__visual">
              <img
                src={heroFigure}
                alt="Noisy matrix data flowing through variational latent clusters into a clean co-cluster checkerboard"
              />
            </figure>
          </div>
        </section>

        <section className="srvcc-section" id="overview">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Overview</p>
              <h2>Learning both sides of a matrix at once</h2>
              <p>
                Co-clustering simultaneously groups rows and columns of a data matrix. SRVCC extends
                this idea with a fully variational framework that learns row clusters, column
                clusters, and joint cell-level structure through compositional ELBOs. The model uses
                VAE encoders and decoders, GMM priors, DREG estimators, a scale modification for
                posterior collapse, and mutual-information cross-loss to produce robust co-clusters
                under noise, sparsity, and missing data.
              </p>
            </div>
            <div className="srvcc-feature-grid">
              {featureCards.map(card => (
                <article className="srvcc-card" key={card.title}>
                  <FaLayerGroup />
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="srvcc-section srvcc-section--deep" id="method">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Method</p>
              <h2>Compositional variational architecture</h2>
              <p>
                The model decomposes the co-clustering problem into row-side, column-side, and joint
                latent components, then couples them through mutual-information structure.
              </p>
            </div>
            <div className="srvcc-method-grid">
              <figure className="srvcc-figure-card srvcc-figure-card--large">
                <img
                  src={architectureFigure}
                  alt="Variational latent co-clustering architecture with row-side VAE, column-side VAE, GMM priors, joint cell interaction, and compositional ELBO"
                  loading="lazy"
                />
                <figcaption>
                  Figure 2 style architecture: row-side, column-side, and joint latent ELBO
                  components are trained together.
                </figcaption>
              </figure>
              <div className="srvcc-pipeline" aria-label="SRVCC method pipeline">
                {pipelineSteps.map(([title, detail], index) => (
                  <article className="srvcc-pipeline-step" key={title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <h3>{title}</h3>
                    <p>{detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="srvcc-section" id="ideas">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Key Ideas</p>
              <h2>Compact technical reference</h2>
            </div>
            <div className="srvcc-idea-panel">
              <div className="srvcc-idea-tabs" role="tablist" aria-label="SRVCC key ideas">
                {keyIdeas.map(idea => (
                  <button
                    className={idea.title === activeIdea ? 'is-active' : ''}
                    key={idea.title}
                    onClick={() => setActiveIdea(idea.title)}
                    role="tab"
                    type="button"
                    aria-selected={idea.title === activeIdea}
                  >
                    {idea.title}
                  </button>
                ))}
              </div>
              <article className="srvcc-idea-content">
                <p className="srvcc-card-kicker">Active concept</p>
                <h3>{activeIdeaContent.title}</h3>
                <p>{activeIdeaContent.body}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="srvcc-section srvcc-section--deep" id="results">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Results</p>
              <h2>Robust co-clustering across modalities</h2>
              <p>
                Across image, web/text, and biomedical datasets, SRVCC generally improves clustering
                accuracy and NMI over several co-clustering baselines, with especially strong gains
                on noisy, sparse, and high-dimensional settings.
              </p>
            </div>
            <div className="srvcc-gallery">
              {galleryItems.map(item => (
                <figure className="srvcc-figure-card" key={item.title}>
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <figcaption>
                    <strong>{item.title}</strong>
                    <span>{item.caption}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="srvcc-section" id="benchmarks">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading srvcc-section-heading--center">
              <p className="srvcc-eyebrow">Benchmark Highlights</p>
              <h2>Selected reported numbers</h2>
              <p>Reported from the paper benchmark tables.</p>
            </div>
            <div className="srvcc-stat-grid">
              {benchmarkStats.map(([label, value]) => (
                <article className="srvcc-stat-card" key={label}>
                  <p>{label}</p>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="srvcc-section srvcc-section--split" id="robustness">
          <div className="srvcc-shell srvcc-split-grid">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Robustness</p>
              <h2>Recovering blocks despite noisy and missing entries</h2>
              <p>
                The model remains able to recover block structure even when the input matrix is
                noisy or partially missing, because the GMM-prior latent structure and compositional
                ELBOs regularize row, column, and cell-level representations.
              </p>
            </div>
            <figure className="srvcc-figure-card">
              <img
                src={robustnessFigure}
                alt="Co-clustering robustness comparison across low, medium, and high noise levels"
                loading="lazy"
              />
              <figcaption>
                <strong>Noise-level checkerboards</strong>
                <span>Recovered structure under progressively stronger corruption.</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="srvcc-section srvcc-section--deep" id="biomedical">
          <div className="srvcc-shell srvcc-split-grid srvcc-split-grid--reverse">
            <figure className="srvcc-figure-card">
              <img
                src={biomarkerFigure}
                alt="Exploratory Parkinson's disease biomarker co-clustering visual with patient and biomarker blocks"
                loading="lazy"
              />
              <figcaption>
                <strong>PPMI appendix exploration</strong>
                <span>
                  Patient profiles and imaging or clinical features are grouped into interpretable
                  blocks.
                </span>
              </figcaption>
            </figure>
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Biomedical Extension</p>
              <h2>Exploratory biomarker co-clustering</h2>
              <p>
                The appendix explores co-clustering for Parkinson&apos;s disease biomarker
                discovery, grouping patient profiles and imaging or clinical features into
                interpretable blocks. This is presented as research exploration, not as a diagnostic
                claim.
              </p>
            </div>
          </div>
        </section>

        <section className="srvcc-section" id="citation">
          <div className="srvcc-shell">
            <div className="srvcc-citation-card">
              <div>
                <p className="srvcc-eyebrow">Resources</p>
                <h2>Paper and citation</h2>
              </div>
              <pre>
                <code>{citation}</code>
              </pre>
              <div className="srvcc-actions">
                <button
                  className="srvcc-button srvcc-button--primary"
                  onClick={copyCitation}
                  type="button"
                >
                  <FaCopy /> {copied ? 'Copied' : 'Copy Citation'}
                </button>
                <a className="srvcc-button" href={paperUrl}>
                  <FaDownload /> Download Paper
                </a>
                <a className="srvcc-button" href="#method">
                  <FaProjectDiagram /> Review Method
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default ScalableRobustBayesianCoClusteringPage

export const Head = () => (
  <Seo
    title="Scalable Robust Bayesian Co-Clustering"
    description="A variational deep co-clustering framework for discovering robust row and column structure in noisy, sparse, and high-dimensional data."
  />
)
