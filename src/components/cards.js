import * as React from 'react'
import PropTypes from 'prop-types'
import { Grid, Tabs, Tab, Box } from '@mui/material'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { usePersonImage } from '../hooks/usePersonImages'
import personPlaceholder from '../images/people/placeholder.png'
import './cards.css'

const TabPanel = props => {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 1 }}>
          <Grid container spacing={4}>
            {children}
          </Grid>
        </Box>
      )}
    </div>
  )
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
}

const sortMembers = members => {
  const positionOrder = [
    'Director, Principle Investigator',
    'Researcher',
    'Research Administrator',
    'Lead Research Scientist',
    'Research Fellow from Purdue University',
    'Postdoctoral Researcher',
  ]

  const comparePositions = (a, b) => {
    const positionA = positionOrder.indexOf(a.position || a.Position)
    const positionB = positionOrder.indexOf(b.position || b.Position)

    if (positionA !== positionB) {
      return positionA - positionB
    }

    return (a.name || a.Name).localeCompare(b.name || b.Name)
  }

  return members.slice().sort(comparePositions)
}

function renderMembersByTitle(members) {
  const sortedMembers = sortMembers(members)

  const studentsByTitle = {
    'Graduate Student': [],
    'Undergraduate Student': [],
    'High School Student': [],
  }

  const piTiles = []
  const researcherTiles = []
  const staffTiles = []

  sortedMembers.forEach(member => {
    const position = member.position || member.Position
    const positionLower = position.toLowerCase()
    if (
      (positionLower.includes('graduate') && !positionLower.includes('undergraduate')) ||
      positionLower.includes('phd')
    ) {
      studentsByTitle['Graduate Student'].push(member)
    } else if (position === 'Undergraduate Student') {
      studentsByTitle['Undergraduate Student'].push(member)
    } else if (position === 'High School Student') {
      studentsByTitle['High School Student'].push(member)
    } else if (
      positionLower.includes('director') ||
      positionLower.includes('principal investigator')
    ) {
      piTiles.push(member)
    } else if (
      (positionLower.includes('researcher') && !positionLower.includes('postdoctoral')) ||
      positionLower.includes('research scientist')
    ) {
      researcherTiles.push(member)
    } else {
      staffTiles.push(member)
    }
  })

  return (
    <div className="student-titles">
      {piTiles.length > 0 && (
        <>
          <h3 className="title-header">Principal Investigator</h3>
          <Grid container spacing={4} sx={{ marginBottom: '2rem' }}>
            {piTiles.map(people => renderCard(people, true))}
          </Grid>
        </>
      )}
      {researcherTiles.length > 0 && (
        <>
          <h3 className="title-header">Researchers</h3>
          <Grid container spacing={4} sx={{ marginBottom: '2rem' }}>
            {researcherTiles.map(people => renderCard(people, true))}
          </Grid>
        </>
      )}
      {staffTiles.length > 0 && (
        <>
          <h3 className="title-header">Staff & Postdocs</h3>
          <Grid container spacing={4} sx={{ marginBottom: '2rem' }}>
            {staffTiles.map(people => renderCard(people, true))}
          </Grid>
        </>
      )}
      <h3 className="title-header">Graduate Students</h3>
      <Grid container spacing={4} className="title-grid">
        {studentsByTitle['Graduate Student'].map(people =>
          renderCard(people, !people.isExactTitle)
        )}
      </Grid>
      <h3 className="title-header">Undergraduate Students</h3>
      <Grid container spacing={4} className="title-grid">
        {studentsByTitle['Undergraduate Student'].map(people => renderCard(people, false))}
      </Grid>
      {studentsByTitle['High School Student'] &&
        studentsByTitle['High School Student'].length > 0 && (
          <>
            <h3 className="title-header">High School Students</h3>
            <Grid container spacing={4} className="title-grid">
              {studentsByTitle['High School Student'].map(people => renderCard(people, false))}
            </Grid>
          </>
        )}
    </div>
  )
}

const AVATAR_STYLE = { width: '125px', height: '125px', borderRadius: '50%' }

// renderCard is a plain function, so the sharp lookup lives in its own component.
const MemberAvatar = ({ imageName, name, imageFile: providedImageFile }) => {
  const resolvePersonImage = usePersonImage()
  const imageFile = providedImageFile || resolvePersonImage(imageName)

  if (imageFile && imageFile.childImageSharp) {
    return (
      <GatsbyImage image={getImage(imageFile)} alt={`${name}'s profile`} style={AVATAR_STYLE} />
    )
  }

  return <img src={personPlaceholder} alt={`${name}'s profile`} style={AVATAR_STYLE} />
}

MemberAvatar.propTypes = {
  imageName: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  imageFile: PropTypes.object,
}

function renderCard(people, showFullTitle = false) {
  const name = people.name || people.Name
  const position = people.position || people.Position
  const imageName = people.image || people.Image || 'placeholder.png'

  return (
    <Grid item xs={6} sm={4} md={2} key={name} className="member-grid-item">
      <div className="Card">
        <div className="upper-container">
          <div className="image-container">
            <MemberAvatar imageName={imageName} name={name} imageFile={people.imageFile} />
          </div>
        </div>
        <div className="lower-container">
          <h3>{name}</h3>
          {showFullTitle && <h4>{position}</h4>}
        </div>
      </div>
    </Grid>
  )
}

const Cards = ({ peopleCards }) => {
  const [value, setValue] = React.useState(0)

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  // Handle both format of data from GraphQL and from Firebase
  const currentMembers = peopleCards.filter(
    person => person.status === 'current' || person.status === true || person.Current === true
  )
  const alumniMembers = peopleCards.filter(
    person => person.status === 'alumni' || person.status === false || person.Current === false
  )

  return (
    <div className="people-class" id="people">
      <div className="people-container">
        <h4 className="header-subtitle">People</h4>
        <Tabs value={value} onChange={handleChange} aria-label="people categories">
          <Tab label="Current Members" />
          <Tab label="Alumni" />
        </Tabs>
        <TabPanel value={value} index={0}>
          {renderMembersByTitle(currentMembers)}
        </TabPanel>
        <TabPanel value={value} index={1}>
          {renderMembersByTitle(alumniMembers)}
        </TabPanel>
      </div>
    </div>
  )
}

Cards.propTypes = {
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

export default Cards
