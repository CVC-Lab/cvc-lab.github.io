import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Ai4pdLayout, { Ai4pdHead } from '../../../components/ai4pd/Ai4pdLayout'
import { AI4PD_BASE } from '../../../components/ai4pd/links'

const datasets = [
  {
    name: 'PPMI (Parkinson’s Progression Markers Initiative)',
    text: 'Primary longitudinal cohort with clinical, imaging, biospecimen, and genetic data. Requires a data use agreement via the Michael J. Fox Foundation.',
    link: 'https://www.ppmi-info.org/access-data-specimens/download-data',
  },
  {
    name: 'synapse.org Parkinson’s repositories',
    text: 'Wearable, smartphone, handwriting, and voice datasets curated for open challenges and benchmarking.',
    link: 'https://www.synapse.org',
  },
  {
    name: 'Mindboggle-101',
    text: 'Anatomically labeled T1-weighted MRIs used for SegFormer pretraining and validation.',
    link: 'https://mindboggle.info/data.html',
  },
]

const docs = [
  ['PPMI cohort overview and data-governance notes', 'https://hackmd.io/XG3ITA8iR2S8A2M-0O6GfA'],
  ['DaTSCAN imaging curation checklist', 'https://hackmd.io/rs2D-YBjR3WG_xCnCjC6EA'],
  [
    'Segmentation for biomarker extraction (SegFormer playbook)',
    'https://hackmd.io/CUwJaR4nRhG1VVT7zivVQA',
  ],
  ['Diffusion MRI (DTI/NODDI) processing in PPMI', 'https://hackmd.io/bSbn-rF1RMyA4jial75-oA'],
  ['Dataset-specific result summaries', 'https://hackmd.io/a4ZKxOy8SCeICVYtpF3sow'],
  [
    'Summer 2023 final report (archival PDF)',
    'https://drive.google.com/file/d/1rocVQaC-FittJwJotOPZBB4ftf_Gjjlb/view?usp=drive_link',
  ],
]

const roadmap = [
  [
    'SegFormer deployment scripts',
    'Containerized pipelines for MRI preprocessing, segmentation, DaT-SPECT alignment, and SBR extraction. Repository in preparation.',
  ],
  [
    'Progressive agent notebooks',
    'Reference implementations of stochastic Hamiltonian policy optimization and uncertainty calibration on synthetic cohorts, packaged with the upcoming technical note.',
  ],
  [
    'Motion and correlation demos',
    'Interactive applications highlighting sensor-clinical correlations, counterfactual therapy simulations, and visualization of asymmetric gait patterns; the live one is the patient portal.',
  ],
]

const engagement = [
  [
    'Connect with Professor Bajaj',
    'Share potential collaborations or student opportunities directly with our principal investigator.',
    'Faculty profile',
    'https://www.cs.utexas.edu/~bajaj/',
  ],
  [
    'Oden Institute contact portal',
    'For media inquiries, philanthropy, or institutional partnerships, contact the Oden Institute communications team.',
    'Open contact page',
    'https://www.oden.utexas.edu/contact/',
  ],
  [
    'Texas Advanced Computing Center',
    'External partners can apply for compute allocations that align with our GPU-intensive workloads.',
    'Request resources',
    'https://www.tacc.utexas.edu/use-tacc/allocations/',
  ],
]

const ResourcesPage = () => (
  <Ai4pdLayout section="resources">
    <section className="ai4pd-hero">
      <div className="ai4pd-shell">
        <p className="ai4pd-eyebrow">Resources</p>
        <h1>Resources and collaboration</h1>
        <p className="ai4pd-lead">
          The datasets, documentation, and engagement channels behind the program. We emphasize
          responsible data stewardship and transparent sharing.
        </p>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Core datasets</h2>
        </div>
        <div className="ai4pd-grid">
          {datasets.map(d => (
            <article key={d.name} className="ai4pd-card">
              <h3>{d.name}</h3>
              <p>{d.text}</p>
              <a
                href={d.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ai4pd-card__link"
              >
                Access resource
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft">
      <div className="ai4pd-shell ai4pd-prose">
        <h2>Lab documentation</h2>
        <p>
          Protocol drafts, segmentation benchmarks, and reproducible notebooks. The 2023 SBR
          extraction study that started the imaging line of work is written up on the{' '}
          <Link to={`${AI4PD_BASE}/background/`}>background page</Link>.
        </p>
        <ul className="ai4pd-list">
          {docs.map(([label, href]) => (
            <li key={href}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Open-source roadmap</h2>
        </div>
        <div className="ai4pd-grid">
          {roadmap.map(([t, d]) => (
            <article key={t} className="ai4pd-card">
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Engage with us</h2>
        </div>
        <div className="ai4pd-grid">
          {engagement.map(([t, d, label, href]) => (
            <article key={t} className="ai4pd-card">
              <h3>{t}</h3>
              <p>{d}</p>
              <a href={href} target="_blank" rel="noopener noreferrer" className="ai4pd-card__link">
                {label}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--tight">
      <div className="ai4pd-shell">
        <div className="ai4pd-callout">
          <h2>Responsible data stewardship</h2>
          <p>
            Collaborations are structured to meet HIPAA and applicable data-protection and sponsor
            requirements through signed data-use agreements and IRB review. De-identified data
            resides on UT Austin secure computing infrastructure approved for restricted data, with
            audit trails; where raw-data sharing is constrained, we scope data-minimizing or
            no-egress alternatives per site. Full governance terms are on the{' '}
            <Link to={`${AI4PD_BASE}/partners/#governance`}>partners page</Link>.
          </p>
        </div>
      </div>
    </section>
  </Ai4pdLayout>
)

export default ResourcesPage

export const Head = ({ location }) => (
  <Ai4pdHead
    title="Resources"
    location={location}
    description="AI4PD resources: the core Parkinson's datasets the program rests on (PPMI, synapse.org, Mindboggle-101), lab documentation and playbooks, the open-source roadmap, and how to engage."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
