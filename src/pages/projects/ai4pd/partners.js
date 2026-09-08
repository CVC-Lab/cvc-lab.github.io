import * as React from 'react'
import PropTypes from 'prop-types'
import Ai4pdLayout, { Ai4pdHead } from '../../../components/ai4pd/Ai4pdLayout'
import { CONTACT_EMAIL } from '../../../components/ai4pd/links'

const steps = [
  [
    'Scoping call',
    'What your cohort covers, what questions matter to your clinic, and what is feasible.',
  ],
  [
    'Agreements',
    'A signed Data Use Agreement, and the IRB pathway for your institution: we establish an IRB reliance agreement or defer to your IRB, as you prefer.',
  ],
  [
    'De-identification at your site',
    'Identifiable data stays with you. You share only de-identified records (HIPAA Safe Harbor or Expert Determination, your choice). Because no PHI is transferred, AI4PD acts as neither a Covered Entity nor a Business Associate, and no BAA is required. If a project ever needs limited identifiers, that is scoped and signed separately before anything moves.',
  ],
  [
    'Joint harmonization',
    'We map your source schema and build a de-identified longitudinal timeline together, with audit trails. Expect roughly a few days of your data manager’s time for the initial mapping; after that, records flow from your existing systems with no new clinical workflow.',
  ],
  ['Clinician review', 'Your neurologists review the outputs.'],
  [
    'Validation and follow-up',
    'Cross-site results are reported back to you; the timeline and models update as new visits arrive.',
  ],
]

const terms = [
  [
    'You retain ownership.',
    'Participating clinicians and sites keep ownership of their data. Participating does not transfer it.',
  ],
  [
    'Withdraw and delete.',
    'You may withdraw at any time. On withdrawal we delete your data and any single-site models derived from it.',
  ],
  [
    'No secondary use.',
    'We use your data only for the validation work scoped in the DUA. No transfer to third parties, and no commercial use of cohort-derived models, without your written consent.',
  ],
  ['Publication.', 'Publication terms and co-authorship are defined in the agreement.'],
  [
    'Access on request.',
    'Access to your cohort’s data is restricted to a named project team and logged. The access log is available to your institution on request.',
  ],
]

const contributes = [
  ['Longitudinal clinical records', 'EHR, medication histories, and follow-up outcomes over time.'],
  [
    'Imaging and biomarkers',
    'Structural and functional imaging and available biomarker panels, contributed as acquired.',
  ],
  [
    'Clinical scores per visit',
    'MDS-UPDRS and related motor and non-motor assessments on the visit cadence.',
  ],
  ['Sensor and wearable streams', 'Continuous motor data where collected.'],
  [
    'DBS / LFP records',
    'Deep-brain-stimulation programming and local-field-potential data at sites where available.',
  ],
]

const governance = [
  [
    'Where data lives.',
    'De-identified data resides on UT Austin secure computing infrastructure approved for restricted data, not on general-purpose HPC or researcher laptops.',
  ],
  [
    'Legal instrument.',
    'Transfer is governed by a signed Data Use Agreement covering de-identified records. We name the UT Austin IRB of record and the responsible data custodian in the agreement.',
  ],
  [
    'EU and other jurisdictions.',
    'For sites subject to GDPR, such as EU collaborators, transfer is handled either through fully anonymized data outside GDPR scope or under appropriate safeguards (for example, Standard Contractual Clauses), specified per site before any data moves.',
  ],
  [
    'Constrained sharing.',
    'The default is data-minimizing transfer of de-identified records to UT Austin infrastructure. For sites that require records not to leave their walls, we will scope a no-egress alternative.',
  ],
  [
    'Responsible use.',
    'Outputs are decision support only and go to the physician first. External domain review, including DBS where applicable, and responsible-use documentation are part of the engagement.',
  ],
]

const donors = [
  { name: 'Michael J. Fox Foundation', link: 'https://www.michaeljfox.org' },
  { name: 'Jim Holland', link: 'https://www.backcountry.com/explore/jim-holland' },
  { name: 'Michael and Connie Rasor', link: 'https://www.utexas.edu' },
  { name: "Peter O'Donnell Foundation", link: 'https://www.tshmf.org/ODonnells.html' },
]

const PartnersPage = () => (
  <Ai4pdLayout section="partners">
    <section className="ai4pd-hero">
      <div className="ai4pd-shell">
        <p className="ai4pd-eyebrow">Partner with AI4PD</p>
        <h1>
          Validate a Parkinson&apos;s progression model on your cohort, and keep the cross-site
          evidence it produces
        </h1>
        <p className="ai4pd-lead">
          AI4PD is building a clinician-facing Parkinson&apos;s digital twin: tools that estimate a
          patient&apos;s current state and forecast progression, each returned to the physician with
          explicit uncertainty. The modeling is tractable. The bottleneck is assembling and
          validating multi-institution longitudinal evidence across sites and populations, which is
          what we need cohort partners for. Identifiable data never leaves your institution; you
          receive only de-identified records, under a signed agreement, on UT Austin secure
          infrastructure. Your site keeps ownership, and you keep the validation evidence your
          cohort helps produce.
        </p>
        <p className="ai4pd-lead" style={{ fontSize: '1.05rem' }}>
          We partner with movement-disorders neurologists and cohort custodians:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell ai4pd-prose">
        <h2>How engagement works</h2>
        <ol className="ai4pd-list ai4pd-list--steps">
          {steps.map(([t, d]) => (
            <li key={t}>
              <strong>{t}.</strong> {d}
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Your data, your terms</h2>
        </div>
        <dl className="ai4pd-dl">
          {terms.map(([t, d]) => (
            <React.Fragment key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell ai4pd-prose">
        <h2>What a clinical partner contributes</h2>
        <p>
          No site is asked to hand over a finished, cleaned dataset. Harmonization is done jointly,
          and each data stream arrives on whatever clock your clinic already generates it.
        </p>
        <ul className="ai4pd-list">
          {contributes.map(([t, d]) => (
            <li key={t}>
              <strong>{t}.</strong> {d}
            </li>
          ))}
        </ul>
        <p>The timeline grows at the pace your clinic already works.</p>

        <h2 style={{ marginTop: '3rem' }}>What a partner gets</h2>
        <h3>Decision support, returned to the physician first</h3>
        <p>
          The core target is 12-month progression forecasting against named endpoints
          (MDS-UPDRS-III, time-to-motor-fluctuation), each output returned with explicit uncertainty
          and named evidence gaps. This is the capability your cohort would help validate; it is in
          development and not yet prospectively validated, and we say so on every output.
        </p>
        <p>
          Around that target, the collaboration aims to produce: current-state estimation,
          differential-diagnosis and levodopa-response support, DBS programming support where
          applicable, and ranked therapy and monitoring plans. Every output is human-in-the-loop
          decision support, returned to the physician. The system never diagnoses or prescribes
          autonomously.
        </p>
        <h3>Validation evidence your cohort produced</h3>
        <ul className="ai4pd-list">
          <li>
            <strong>Cross-site results.</strong> How the model performs on a cohort like yours,
            including where it fails.
          </li>
          <li>
            <strong>Calibration you can check.</strong> Whether its confidence is honest: when it
            says it is 80% sure, is it right about 80% of the time. Methods detail (baseline
            comparisons and ablations) is in the validation report.
          </li>
        </ul>
        <h3>A harmonized, de-identified patient timeline</h3>
        <ul className="ai4pd-list">
          <li>Schema mapping co-developed from your source systems.</li>
          <li>Audit trails over the de-identified longitudinal timeline.</li>
          <li>A reusable asset for your own downstream research, on the use terms above.</li>
        </ul>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--soft ai4pd-anchor" id="governance">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Governance, stated honestly</h2>
        </div>
        <dl className="ai4pd-dl">
          {governance.map(([t, d]) => (
            <React.Fragment key={t}>
              <dt>{t}</dt>
              <dd>{d}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell">
        <div className="ai4pd-grid ai4pd-grid--2">
          <div className="ai4pd-prose">
            <h2>Funding partners</h2>
            <ul className="ai4pd-list">
              {donors.map(d => (
                <li key={d.name}>
                  <a href={d.link} target="_blank" rel="noopener noreferrer">
                    {d.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="ai4pd-prose">
            <h2>Infrastructure partners</h2>
            <ul className="ai4pd-list">
              <li>
                <strong>Oden Institute for Computational Engineering and Sciences.</strong> Shared
                compute and administrative support for cross-campus, restricted-data deployments.
              </li>
              <li>
                <strong>Texas Advanced Computing Center (TACC).</strong> High-performance GPU
                clusters for large-scale modeling and validation.{' '}
                <a
                  href="https://www.tacc.utexas.edu/use-tacc/allocations/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--tight">
      <div className="ai4pd-shell">
        <div className="ai4pd-callout">
          <h2>How to start</h2>
          <p>
            For clinical-cohort, data-sharing, and validation partnerships, write to the PI
            directly: <strong>Prof. Chandrajit Bajaj</strong> (Principal Investigator),{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> (
            <a href="https://www.cs.utexas.edu/~bajaj/" target="_blank" rel="noopener noreferrer">
              faculty profile
            </a>
            ). For institutional or partnership inquiries, use the{' '}
            <a
              href="https://www.oden.utexas.edu/contact/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Oden Institute contact portal
            </a>
            . To discuss philanthropic support, the{' '}
            <a
              href="https://give.utexas.edu/?utm_source=microsite&utm_medium=pages"
              target="_blank"
              rel="noopener noreferrer"
            >
              UT Austin giving page
            </a>{' '}
            is here.
          </p>
        </div>
      </div>
    </section>
  </Ai4pdLayout>
)

export default PartnersPage

export const Head = ({ location }) => (
  <Ai4pdHead
    title="Partners"
    location={location}
    description="Partner with AI4PD: validate a Parkinson's progression model on your cohort under a signed data-use agreement, with de-identification at your site, honest governance, and the cross-site evidence returned to you."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
