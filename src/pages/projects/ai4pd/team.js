import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import Ai4pdLayout, { Ai4pdHead } from '../../../components/ai4pd/Ai4pdLayout'
import { AI4PD_BASE, CONTACT_EMAIL } from '../../../components/ai4pd/links'

const researchers = [
  'Aaron Dominick',
  'Ashwin Vinod',
  'Aditya Sai Ellendula',
  'Aparna Dev',
  'Shubham Bhardwaj',
  'Jasmine Khalil',
  'Priyanshi Yadav',
  'Ojas Phirke',
  'Thribhuvan Rapolu',
  'Aditya Rajnarayan',
  'Harsh Tirhekar',
]

const collaborators = [
  ['Dr. Conor Fearon, MD PhD', 'Mater Misericordiae University Hospital, Dublin, Ireland'],
  ['Dr. Barbara Marebwa', 'Senior Scientist, Michael J. Fox Foundation'],
  ['Oden Institute Research Computing', 'The University of Texas at Austin'],
]

const TeamPage = () => (
  <Ai4pdLayout section="team">
    <section className="ai4pd-hero">
      <div className="ai4pd-shell">
        <p className="ai4pd-eyebrow">Team</p>
        <h1>The AI4PD team</h1>
        <p className="ai4pd-lead">
          Computational scientists, engineers, and clinicians at the Oden Institute building a
          clinician-facing Parkinson&apos;s digital twin. We develop and validate these tools
          alongside the clinical cohorts that generate the data, with reproducible methods and
          cross-site validation, and every decision-support output goes to the physician first.
        </p>
      </div>
    </section>

    <section className="ai4pd-section">
      <div className="ai4pd-shell">
        <div className="ai4pd-prose">
          <h2>Faculty leadership</h2>
        </div>
        <ul className="ai4pd-team">
          <li>
            <strong>Chandrajit Bajaj, Ph.D.</strong>
            <span>Professor of Computer Science, Oden Institute, UT Austin</span>
            <a href="https://www.cs.utexas.edu/~bajaj/" target="_blank" rel="noopener noreferrer">
              Faculty profile
            </a>
          </li>
        </ul>

        <div className="ai4pd-prose" style={{ marginTop: '2.5rem' }}>
          <h2>Graduate and undergraduate researchers</h2>
          <p>
            Bajaj Lab, Oden Institute and Department of Computer Science, The University of Texas at
            Austin. Profiles are on the <Link to="/people/">CVC people page</Link>.
          </p>
        </div>
        <ul className="ai4pd-team">
          {researchers.map(name => (
            <li key={name}>
              <strong>{name}</strong>
            </li>
          ))}
        </ul>

        <div className="ai4pd-prose" style={{ marginTop: '2.5rem' }}>
          <h2>Clinical and infrastructure collaborators</h2>
        </div>
        <ul className="ai4pd-team">
          {collaborators.map(([name, affiliation]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span>{affiliation}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="ai4pd-section ai4pd-section--tight">
      <div className="ai4pd-shell">
        <div className="ai4pd-callout">
          <h2>Join the lab</h2>
          <p>
            We host visiting scholars, capstone students, and research fellows. To work with us, or
            for clinical-validation and data-sharing inquiries, write to Prof. Chandrajit Bajaj at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or use the collaboration links
            on the <Link to={`${AI4PD_BASE}/resources/`}>resources page</Link>.
          </p>
        </div>
      </div>
    </section>
  </Ai4pdLayout>
)

export default TeamPage

export const Head = ({ location }) => (
  <Ai4pdHead
    title="Team"
    location={location}
    description="The AI4PD team: faculty leadership, graduate and undergraduate researchers in the Bajaj Lab at the Oden Institute, and the clinical and infrastructure collaborators the program works with."
  />
)

Head.propTypes = {
  location: PropTypes.shape({ pathname: PropTypes.string }).isRequired,
}
