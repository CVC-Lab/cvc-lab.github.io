import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Ai4pdLayout, { Ai4pdHead, Ai4pdFigure } from '../../../components/ai4pd/Ai4pdLayout'
import { AI4PD_BASE } from '../../../components/ai4pd/links'

const deepDives = [
  ['Introduction', `${AI4PD_BASE}/background/introduction/`],
  ['Preliminaries and related work', `${AI4PD_BASE}/background/preliminaries/`],
  ['Methodology', `${AI4PD_BASE}/background/methodology/`],
  ['Experiments', `${AI4PD_BASE}/background/experiments/`],
]

const therapies = [
  [
    'Dopaminergic strategies',
    'Early-stage motor symptoms often respond to levodopa/carbidopa (immediate or extended release), dopamine agonists, and MAO-B inhibitors such as rasagiline, selegiline, or safinamide. Rytary® smooths motor control, while add-on safinamide extends “ON” time.',
  ],
  [
    'Advanced delivery options',
    'Complex fluctuations may require enteral Duopa® gel, continuous levodopa/carbidopa infusion (Vyalev™, FDA cleared 2024), or subcutaneous apomorphine (Onapgo™, 2025). Neuromodulation via deep brain stimulation (STN/GPi) remains a cornerstone.',
  ],
  [
    'Emerging procedural care',
    'MR-guided focused ultrasound has progressed from unilateral to staged bilateral procedures, with FDA clearance in July 2025 for select centers. It offers incisionless tremor relief and reduced dyskinesia for advanced disease.',
  ],
  [
    'Non-motor management',
    'SSRIs/SNRIs effectively address depression and anxiety without worsening motor scores. Melatonin or clonazepam mitigate REM sleep behavior disorder, while tailored tapering of dopamine agonists manages impulse-control disorders alongside behavioral therapy.',
  ],
  [
    'Autonomic support',
    'Orthostatic hypotension starts with hydration, salt, and compression, escalating to droxidopa or midodrine. Botulinum toxin injections relieve sialorrhea, polyethylene glycol is the preferred first-line osmotic laxative, and mirabegron offers bladder control with minimal cognitive burden.',
  ],
]

const BackgroundPage = () => (
  <Ai4pdLayout section="background">
    <section className="ai4pd-hero">
      <div className="ai4pd-shell">
        <p className="ai4pd-eyebrow">Background</p>
        <h1>Parkinson&apos;s disease context</h1>
        <p className="ai4pd-lead">
          The neurobiology, the clinical picture, the therapeutic landscape as of 2025, and the 2023
          study on patient-specific striatal binding ratio (SBR) extraction that started the
          program&apos;s imaging line of work.
        </p>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell">
        <div className="ai4pd-grid ai4pd-grid--2">
          <div className="ai4pd-prose">
            <h2>Neurobiology in focus</h2>
            <p>
              Parkinson&apos;s disease begins with degeneration of dopaminergic neurons within the
              substantia nigra pars compacta, but the cascade quickly recruits cholinergic and
              cerebello-thalamo-cortical networks. These circuit-wide disruptions explain why gait,
              balance, cognition, and autonomic regulation can deteriorate even when motor tremor
              appears well controlled.
            </p>
            <p>
              Protein misfolding, mitochondrial stress, lysosomal dysfunction, and immune signaling,
              including genes such as BST1, SYT11, TMEM175, and GRN, activate selective
              vulnerability across the basal ganglia. Our models incorporate these molecular
              signatures alongside imaging-derived biomarkers.
            </p>
          </div>
          <Ai4pdFigure
            name="md_image"
            alt="DaTSCAN and MRI overlay highlighting striatal pathways"
            caption="DaTSCAN and MRI overlay highlighting striatal pathways."
          />
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Clinical manifestations we model</h2>
        </div>
        <div className="ai4pd-grid ai4pd-grid--2">
          <div className="ai4pd-prose">
            <h3>Motor domains</h3>
            <ul className="ai4pd-list">
              <li>
                Nigrostriatal dopamine deficit drives bradykinesia, rigidity, and resting tremor.
              </li>
              <li>Network-level changes produce medication-refractory tremor and dyskinesia.</li>
              <li>
                Cholinergic degeneration contributes to freezing of gait, postural instability, and
                falls.
              </li>
            </ul>
          </div>
          <div className="ai4pd-prose">
            <h3>Non-motor domains</h3>
            <ul className="ai4pd-list">
              <li>
                Cognitive fluctuations and hallucinations reflect cholinergic and cortical
                involvement.
              </li>
              <li>
                Mood, anxiety, and sleep disturbances stem from monoaminergic dysregulation beyond
                dopamine.
              </li>
              <li>
                Autonomic failure drives orthostatic hypotension, sialorrhea, constipation, and
                urinary urgency.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Therapeutic landscape as of 2025</h2>
        </div>
        <div className="ai4pd-grid">
          {therapies.map(([t, d]) => (
            <article key={t} className="ai4pd-card">
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
        <p className="ai4pd-prose" style={{ marginTop: '1.5rem' }}>
          These interventions are powerful, yet they are prescribed largely on population averages.
          Our multimodal approach learns which combination, sequence, and timing work best for each
          individual patient profile.
        </p>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft">
      <div className="ai4pd-shell ai4pd-prose">
        <p className="ai4pd-eyebrow">2023 study</p>
        <h2>Quick and efficient extraction of patient-specific SBR ratios</h2>
        <p>
          The program&apos;s imaging thrust grew out of a 2023 study that replaced hours of manual
          striatal segmentation with SegFormer masks generated in minutes, then used them to extract
          patient-specific striatal binding ratios from DaTSCAN. The write-up is in four parts:
        </p>
        <ul className="ai4pd-list">
          {deepDives.map(([label, href]) => (
            <li key={href}>
              <Link to={href}>{label}</Link>
            </li>
          ))}
        </ul>
        <p>
          Reference notebooks and reports are listed on the{' '}
          <Link to={`${AI4PD_BASE}/resources/`}>resources page</Link>.
        </p>
      </div>
    </section>
  </Ai4pdLayout>
)

export default BackgroundPage

export const Head = ({ location }) => (
  <Ai4pdHead
    title="Background"
    location={location}
    description="Parkinson's disease context for AI4PD: neurobiology, motor and non-motor manifestations, the 2025 therapeutic landscape, and the 2023 SegFormer study on patient-specific SBR extraction."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
