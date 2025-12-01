import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import './PeopleCondensed.css'

// Priority order for faculty/staff
const FACULTY_POSITIONS = [
  'Director, Principle Investigator',
  'Lead Research Scientist',
  'Research Administrator',
  'Research Fellow from Purdue University',
  'Postdoctoral Researcher',
]

// Grad student positions to include
const GRAD_POSITIONS = ['PhD Candidate', 'PhD Student', 'Graduate Student']

const PeopleCondensed = ({ peopleCards }) => {
  // Get current members only
  const currentMembers = peopleCards.filter(
    person => person.status === 'current' || person.status === true || person.Current === true
  )

  // Get faculty/staff members
  const facultyMembers = currentMembers.filter(person => {
    const position = person.position || person.Position
    return FACULTY_POSITIONS.some(pos => position?.includes(pos) || pos.includes(position))
  })

  // Sort faculty by position order
  const sortedFaculty = facultyMembers.sort((a, b) => {
    const posA = a.position || a.Position
    const posB = b.position || b.Position
    const indexA = FACULTY_POSITIONS.findIndex(p => posA?.includes(p) || p.includes(posA))
    const indexB = FACULTY_POSITIONS.findIndex(p => posB?.includes(p) || p.includes(posB))
    return indexA - indexB
  })

  // Get grad students (PhD Candidates, PhD Students, Graduate Students - but NOT undergrad)
  const gradStudents = currentMembers.filter(person => {
    const position = person.position || person.Position
    return GRAD_POSITIONS.some(pos => position?.includes(pos))
  })

  // Combine faculty and grad students
  const displayMembers = [...sortedFaculty, ...gradStudents]

  return (
    <section className="people-condensed" id="people">
      <div className="people-condensed-container">
        <div className="people-condensed-header">
          <h2 className="people-condensed-title">Our Team</h2>
          <Link to="/people" className="people-view-all">
            View Full Team →
          </Link>
        </div>

        <div className="people-condensed-grid">
          {displayMembers.map(person => (
            <PersonCard key={person.name || person.Name} person={person} />
          ))}
        </div>

        <div className="people-condensed-footer">
          <p className="people-count">
            {currentMembers.length} current members including faculty, researchers, and students
          </p>
        </div>
      </div>
    </section>
  )
}

const PersonCard = ({ person }) => {
  const name = person.name || person.Name
  const position = person.position || person.Position
  const imageName = person.image || person.Image || 'placeholder.png'

  return (
    <div className="person-card-condensed">
      <div className="person-image-wrapper">
        {person.imageFile && person.imageFile.childImageSharp ? (
          <GatsbyImage
            image={getImage(person.imageFile)}
            alt={`${name}'s profile`}
            className="person-image"
          />
        ) : (
          <img
            src={require(`../images/people/${imageName}`).default}
            alt={`${name}'s profile`}
            className="person-image"
          />
        )}
      </div>
      <h3 className="person-name">{name}</h3>
      <p className="person-position">{position}</p>
    </div>
  )
}

PeopleCondensed.propTypes = {
  peopleCards: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      Name: PropTypes.string,
      position: PropTypes.string,
      Position: PropTypes.string,
      status: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
      Current: PropTypes.bool,
      image: PropTypes.string,
      Image: PropTypes.string,
      imageFile: PropTypes.object,
    })
  ).isRequired,
}

PersonCard.propTypes = {
  person: PropTypes.shape({
    name: PropTypes.string,
    Name: PropTypes.string,
    position: PropTypes.string,
    Position: PropTypes.string,
    image: PropTypes.string,
    Image: PropTypes.string,
    imageFile: PropTypes.object,
  }).isRequired,
}

export default PeopleCondensed
