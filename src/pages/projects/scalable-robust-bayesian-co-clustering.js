import * as React from 'react'
import { FaBookOpen, FaCopy, FaDownload } from 'react-icons/fa'
import Layout from '../../components/layout'
import Seo from '../../components/seo'
import './scalable-robust-bayesian-co-clustering.css'

const paperUrl = 'https://arxiv.org/pdf/2504.04079'
const arxivUrl = 'https://arxiv.org/abs/2504.04079'

const contributions = [
  {
    title: 'Fully variational co-clustering',
    body: 'Learns row and column clusters directly in latent space, replacing separate post-hoc clustering with a generative, end-to-end objective.',
  },
  {
    title: 'Compositional ELBOs',
    body: 'Combines row-side, column-side, and joint cell-level variational objectives so each part of the matrix contributes structured evidence.',
  },
  {
    title: 'Noise and missing-input robustness',
    body: 'Regularized reconstruction, KL structure, and noise learning are designed to keep cluster assignments stable under corrupted or sparse data.',
  },
  {
    title: 'Coherent row-column partitions',
    body: 'A mutual-information cross-loss encourages row and column assignments to preserve dependence in the original matrix.',
  },
]

const pipeline = [
  ['Input matrix', 'Rows are instances; columns are features.'],
  ['Row and column VAEs', 'Separate encoders learn probabilistic latent spaces for each axis.'],
  ['GMM priors', 'Mixture components provide soft cluster anchors in both latent spaces.'],
  [
    'Joint cell latent space',
    'A third latent variable models row-column interaction and local deviations.',
  ],
  ['MI cross-loss', 'Soft row and column partitions are coupled through mutual information.'],
  ['Co-cluster structure', 'Rows and columns reorder into interpretable blocks.'],
]

const benchmarkRows = [
  ['Fashion-MNIST-test', '68.2 +/- 1.8', '65.0 +/- 1.6', 'Strong image benchmark gain over DeepCC'],
  ['WebKB4', '83.2 +/- 1.6', '42.3 +/- 1.2', 'Large accuracy gain on sparse text/web data'],
  ['Yale', '58.1 +/- 1.7', '61.0 +/- 1.5', 'Improved facial-image latent separation'],
  [
    'WebKB wisconsin',
    '81.6 +/- 2.2',
    '51.5 +/- 1.6',
    'Best reported result in both ACC and NMI table columns',
  ],
  [
    'IMDb movies actors',
    '26.2 +/- 2.4',
    '19.4 +/- 1.8',
    'Modest gain on a harder sparse movie-feature split',
  ],
]

const ablationRows = [
  [
    'Fashion-MNIST-test',
    'Feature only',
    '62.1 / 58.2',
    'DREG helps, but without the joint stage it remains weaker.',
  ],
  [
    'Fashion-MNIST-test',
    'Simple cascade',
    '64.4 / 59.6',
    'Better than feature-only, still below two-stage ELBO.',
  ],
  [
    'Fashion-MNIST-test',
    'Two-stage ELBO',
    '68.2 / 65.0',
    'Best reported ACC and NMI for this ablation.',
  ],
  ['WebKB wisconsin', 'Two-stage ELBO', '81.6 / 51.5', 'Best reported ACC and NMI under DREG.'],
]

const ppmiFindings = [
  {
    title: 'Mild outlier profile',
    body: 'One near-singleton group shows low motor burden, high MoCA, early Hoehn and Yahr stage, and mild or near-normal imaging values.',
  },
  {
    title: 'Older heterogeneous group',
    body: 'An older cluster displays wider motor severity and comparatively preserved DaTSCAN signals, suggesting non-linear relationships among age, imaging, and symptoms.',
  },
  {
    title: 'Moderate PD subgroups',
    body: 'Several broader groups share moderate severity but differ by cognition, imaging spread, age at diagnosis, and ventricular or striatal measures.',
  },
  {
    title: 'Candidate biomarker families',
    body: 'Putamen and caudate DaTSCAN ratios, ventricular and striatal MRI volumes, UPDRS-III, Hoehn and Yahr stage, and MoCA emerge as separating variables.',
  },
]

const citation = `@article{vinod2025scalable,
  title={Scalable Robust Bayesian Co-Clustering with Compositional ELBOs},
  author={Vinod, Ashwin and Bajaj, Chandrajit},
  journal={arXiv preprint arXiv:2504.04079},
  year={2025}
}`

const MatrixSketch = () => {
  const noisyCells = Array.from({ length: 64 }, (_, index) => {
    const tones = ['srvcc-tone-a', 'srvcc-tone-b', 'srvcc-tone-c', 'srvcc-tone-d', 'srvcc-tone-e']
    return tones[(index * 7 + Math.floor(index / 3)) % tones.length]
  })
  const blockCells = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8)
    const col = index % 8
    if (row < 3 && col < 4) return 'srvcc-tone-a'
    if (row < 3 && col >= 4) return 'srvcc-tone-c'
    if (row >= 3 && row < 6 && col < 3) return 'srvcc-tone-d'
    if (row >= 3 && row < 6 && col >= 3 && col < 6) return 'srvcc-tone-b'
    return 'srvcc-tone-e'
  })

  return (
    <figure
      className="srvcc-matrix-sketch"
      aria-label="Noisy matrix converted into co-cluster blocks"
    >
      <div className="srvcc-matrix-panel">
        <p>Noisy input</p>
        <div className="srvcc-matrix-grid" aria-hidden="true">
          {noisyCells.map((tone, index) => (
            <span key={`n-${index}`} className={tone} />
          ))}
        </div>
      </div>
      <div className="srvcc-matrix-arrow" aria-hidden="true">
        &rarr;
      </div>
      <div className="srvcc-matrix-panel">
        <p>Co-clustered blocks</p>
        <div className="srvcc-matrix-grid srvcc-matrix-grid--block" aria-hidden="true">
          {blockCells.map((tone, index) => (
            <span key={`b-${index}`} className={tone} />
          ))}
        </div>
      </div>
    </figure>
  )
}

const ScalableRobustBayesianCoClusteringPage = () => {
  const [copied, setCopied] = React.useState(false)

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
          <div className="srvcc-shell srvcc-hero-grid">
            <div className="srvcc-hero-copy">
              <p className="srvcc-eyebrow">Preprint | arXiv:2504.04079v2</p>
              <h1>Scalable Robust Bayesian Co-Clustering with Compositional ELBOs</h1>
              <p className="srvcc-authors">Ashwin Vinod, Chandrajit Bajaj</p>
              <p className="srvcc-lead">
                A fully variational co-clustering framework that learns row clusters, column
                clusters, and cell-level interaction structure in one noise-robust training
                pipeline.
              </p>
              <div className="srvcc-actions">
                <a className="srvcc-button srvcc-button--primary" href={paperUrl}>
                  <FaBookOpen /> Read full paper
                </a>
                <a className="srvcc-button" href={arxivUrl}>
                  arXiv record
                </a>
              </div>
            </div>
            <MatrixSketch />
          </div>
        </section>

        <section className="srvcc-section">
          <div className="srvcc-shell srvcc-summary-grid">
            <article className="srvcc-summary-card">
              <p className="srvcc-eyebrow">Problem</p>
              <h2>Co-clustering rows and features under real-world noise</h2>
              <p>
                Co-clustering identifies homogeneous groups of both instances and features in a
                matrix. Traditional methods often depend on shallow factorizations, linear
                transformations, or assumptions that struggle with sparse, high-dimensional,
                corrupted, or missing data.
              </p>
            </article>
            <article className="srvcc-summary-card srvcc-summary-card--accent">
              <p className="srvcc-eyebrow">Approach</p>
              <h2>Variational row, column, and joint latent structure</h2>
              <p>
                SRVCC uses row-side and column-side VAEs with Gaussian mixture priors, adds a joint
                cell-level latent variable, and optimizes a compositional objective with mutual
                information coupling and doubly reparameterized gradients.
              </p>
            </article>
          </div>
        </section>

        <section className="srvcc-section srvcc-section--muted" id="contributions">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Core contributions</p>
              <h2>What the paper adds</h2>
            </div>
            <div className="srvcc-card-grid">
              {contributions.map(card => (
                <article className="srvcc-card" key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="srvcc-section" id="method">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Method</p>
              <h2>Processing pipeline</h2>
              <p>
                The framework turns a raw matrix into soft row clusters, soft column clusters, and
                joint block labels while retaining uncertainty throughout the training objective.
              </p>
            </div>
            <ol className="srvcc-pipeline">
              {pipeline.map(([title, body]) => (
                <li key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="srvcc-section srvcc-section--muted" id="results">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Reported results</p>
              <h2>Benchmarks across image, text, and web data</h2>
              <p>
                Selected values from the paper tables. ACC is clustering accuracy; NMI is normalized
                mutual information.
              </p>
            </div>
            <div className="srvcc-table-wrap">
              <table className="srvcc-table">
                <thead>
                  <tr>
                    <th>Dataset</th>
                    <th>SRVCC ACC</th>
                    <th>SRVCC NMI</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkRows.map(row => (
                    <tr key={row[0]}>
                      {row.map(cell => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="srvcc-section" id="ablation">
          <div className="srvcc-shell srvcc-two-column">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Ablation</p>
              <h2>Why the two-stage ELBO matters</h2>
              <p>
                The paper compares feature-only clustering, a simple cascade, and the two-stage
                compositional ELBO design. The two-stage version with DREG reports the strongest
                accuracy and NMI on the shown ablations.
              </p>
            </div>
            <div className="srvcc-mini-table">
              {ablationRows.map(([dataset, method, values, note]) => (
                <article key={`${dataset}-${method}`}>
                  <span>{dataset}</span>
                  <h3>{method}</h3>
                  <strong>{values}</strong>
                  <p>{note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="srvcc-section srvcc-section--muted" id="biomedical">
          <div className="srvcc-shell">
            <div className="srvcc-section-heading">
              <p className="srvcc-eyebrow">Biomedical appendix</p>
              <h2>PPMI co-clustering as a Parkinson&apos;s exploration</h2>
              <p>
                The paper appendix applies the co-clustering approach to PPMI clinical and imaging
                variables. This section is exploratory and should be read as biomarker-discovery
                analysis, not diagnostic deployment.
              </p>
            </div>
            <div className="srvcc-card-grid srvcc-card-grid--two">
              {ppmiFindings.map(card => (
                <article className="srvcc-card" key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="srvcc-section" id="citation">
          <div className="srvcc-shell">
            <article className="srvcc-citation-card">
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
                  <FaCopy /> {copied ? 'Copied' : 'Copy citation'}
                </button>
                <a className="srvcc-button" href={paperUrl}>
                  <FaDownload /> Download PDF
                </a>
              </div>
            </article>
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
    description="A variational co-clustering framework for robust row and column structure discovery in noisy, sparse, and high-dimensional data."
  />
)
