import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Ai4pdLayout, { Ai4pdHead, LinkIcon } from '../../../components/ai4pd/Ai4pdLayout'
import Ai4pdFigure from '../../../components/ai4pd/Ai4pdFigure'
import { intro, papers } from '../../../components/ai4pd/evidenceData'
import SmartLink from '../../../components/ui/SmartLink'

const Findings = ({ heading, items }) => (
  <>
    <h3>{heading}</h3>
    <ul className="ai4pd-list">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  </>
)

Findings.propTypes = {
  heading: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
}

const BiomarkerFigures = () => (
  <div className="ai4pd-figure-row">
    <Ai4pdFigure
      zoom
      name="03_moca_upsit_distributions"
      alt="MoCA and UPSIT score distributions in PPMI"
      caption="MoCA (n=13,835): 25.9% below the MCI threshold. UPSIT (n=5,122): 50.2% hyposmic. Prodromal-marker prevalence in the PPMI cohort."
    />
    <Ai4pdFigure
      zoom
      name="05_arm_swing_asymmetry"
      alt="Wearable arm-swing asymmetry distribution across 178 assessments"
      caption="Wearable arm-swing asymmetry: 27% of 178 assessments (94 patients) exceed the 20% pathological lateralization threshold."
    />
    <Ai4pdFigure
      zoom
      name="09_tug_performance"
      alt="Timed Up and Go performance distribution across 186 assessments"
      caption="Timed Up and Go (n=186): 29% exceed the >12 s impairment threshold (54/186 from 100 patients)."
    />
  </div>
)

// The paper's title follows the visible label for screen readers, so "View preprint" and
// "Project page" links name the study they belong to.
const PaperLink = ({ to, label, title, className }) => (
  <SmartLink to={to} className={className}>
    {label}
    <span className="visually-hidden">: {title}</span> <LinkIcon to={to} />
  </SmartLink>
)

PaperLink.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  className: PropTypes.string,
}

const EvidencePage = () => (
  <Ai4pdLayout section="evidence">
    <section className="ai4pd-hero">
      <div className="page-container">
        <p className="ai4pd-eyebrow">Evidence</p>
        <h1>Cohorts, methods, effect sizes, and limits, per study</h1>
        {intro.map((p, i) => (
          <p key={i} className="ai4pd-lead ai4pd-lead--small">
            {p}
          </p>
        ))}
        <nav className="ai4pd-jump" id="studies" aria-label="Studies on this page">
          <p className="ai4pd-jump__label">On this page</p>
          <ol className="ai4pd-jump__list">
            {papers.map(p => (
              <li key={p.id}>
                <a href={`#${p.id}`}>{p.title}</a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>

    <div className="page-container ai4pd-evidence-list">
      {papers.map(p => (
        <section key={p.id} id={p.id} className="ai4pd-evidence ai4pd-prose">
          <span
            className={`ai4pd-badge${/^Manuscript/.test(p.badge) ? '' : ' ai4pd-badge--public'}`}
          >
            {p.badge}
          </span>
          <h2>{p.title}</h2>
          <p>{p.lead}</p>
          <p className="ai4pd-meta">
            <strong>Authors:</strong> {p.authors}
          </p>
          <p className="ai4pd-meta">
            <strong>Status:</strong> {p.statusNote}
          </p>

          <h3>Claim</h3>
          <p>{p.claim}</p>

          <h3>Cohorts</h3>
          <ul className="ai4pd-list">
            {p.cohorts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>

          <h3>Methods</h3>
          <p>{p.methods}</p>

          <Findings heading="Primary findings" items={p.primary} />
          <Findings heading="Supporting metrics" items={p.supporting} />

          {p.figures && <BiomarkerFigures />}

          <Findings heading="Limitations" items={p.limitations} />

          {p.companion && (
            <div className="ai4pd-evidence__companion">
              <h3>{p.companion.title}</h3>
              <p>{p.companion.intro}</p>
              <h4>Cohorts</h4>
              <p>{p.companion.cohorts}</p>
              <h4>Methods</h4>
              <p>{p.companion.methods}</p>
              <h4>Findings</h4>
              <ul className="ai4pd-list">
                {p.companion.findings.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <h4>Limitations</h4>
              <p>{p.companion.limitations}</p>
            </div>
          )}

          <p className="ai4pd-evidence__link">
            <PaperLink
              to={p.link}
              label={p.linkLabel}
              title={p.title}
              className="ai4pd-inline-link"
            />
            {p.secondLink && (
              <>
                {' '}
                &middot;{' '}
                <PaperLink
                  to={p.secondLink.href}
                  label={p.secondLink.label}
                  title={p.title}
                  className="ai4pd-inline-link"
                />
              </>
            )}
          </p>
          <p className="ai4pd-evidence__back">
            <a href="#studies">Back to the list of studies</a>
          </p>
        </section>
      ))}
    </div>

    <section className="ai4pd-section ai4pd-section--dark">
      <div className="page-container">
        <div className="ai4pd-section-heading">
          <p className="ai4pd-eyebrow">All listings</p>
          <h2>Every paper, in one list</h2>
          <p>
            The same studies as citable entries. All of them also appear on the CVC{' '}
            <Link to="/publications/">publications page</Link>.
          </p>
        </div>
        <ol className="ai4pd-paper-list">
          {papers.map((p, i) => (
            <li key={p.id}>
              <span className="ai4pd-paper__number">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{p.title}</h3>
                <p>
                  {p.authors}. {p.badge}.
                </p>
                <PaperLink to={p.link} label={p.linkLabel} title={p.title} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  </Ai4pdLayout>
)

export default EvidencePage

export const Head = ({ location }) => (
  <Ai4pdHead
    title="Evidence"
    location={location}
    description="The AI4PD evidence base, study by study: cohorts, methods, effect sizes, limitations, and sources for the validity-gates and signed-laterality manuscripts, the posterior-calibrated motor-state work, integrated biomarkers, pathway-anchored imaging, and SRVCC co-clustering."
  />
)
