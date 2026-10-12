import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { usePersonImage } from '../hooks/usePersonImages'
import './PeopleCondensed.css'

// Priority order for faculty/staff
const FACULTY_POSITIONS = [
  'Director, Principal Investigator',
  'Researcher',
  'Lead Research Scientist',
  'Research Administrator',
  'Research Fellow from Purdue University',
  'Postdoctoral Research Fellow',
  'Postdoctoral Researcher',
]

// Grad student positions to include
const GRAD_POSITIONS = ['PhD Candidate', 'PhD Student', 'Graduate Student']

const rankOf = (positions, position = '') => positions.findIndex(pos => position.startsWith(pos))

const personShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  position: PropTypes.string,
  image: PropTypes.string,
  status: PropTypes.string,
})

const PersonCard = ({ person }) => {
  const resolvePersonImage = usePersonImage()
  const image = getImage(resolvePersonImage(person.image) || resolvePersonImage('placeholder.png'))

  return (
    <li className="person-card-condensed">
      <div className="person-image-wrapper">
        {image && <GatsbyImage image={image} alt="" sizes="80px" className="person-image" />}
      </div>
      <p className="person-name">{person.name}</p>
      <p className="person-position">{person.position}</p>
    </li>
  )
}

PersonCard.propTypes = {
  person: personShape.isRequired,
}

const PeopleCondensed = ({ peopleCards }) => {
  const currentMembers = peopleCards.filter(person => person.status === 'current')
  const faculty = currentMembers
    .filter(person => rankOf(FACULTY_POSITIONS, person.position) !== -1)
    .sort((a, b) => rankOf(FACULTY_POSITIONS, a.position) - rankOf(FACULTY_POSITIONS, b.position))
  const gradStudents = currentMembers.filter(
    person => rankOf(GRAD_POSITIONS, person.position) !== -1
  )
  const displayMembers = [...faculty, ...gradStudents]

  return (
    <section className="people-condensed" id="people">
      <div className="page-container people-condensed-container">
        <div className="people-condensed-header">
          <h2 className="people-condensed-title">Our Team</h2>
          <Link to="/people/" className="people-view-all">
            View Full Team <span aria-hidden="true">→</span>
          </Link>
        </div>

        <ul className="people-condensed-grid">
          {displayMembers.map(person => (
            <PersonCard key={person.name} person={person} />
          ))}
        </ul>

        <div className="people-condensed-footer">
          <p className="people-count">
            {currentMembers.length} current members including faculty, researchers, and students
          </p>
        </div>
      </div>
    </section>
  )
}

PeopleCondensed.propTypes = {
  peopleCards: PropTypes.arrayOf(personShape).isRequired,
}

export default PeopleCondensed
