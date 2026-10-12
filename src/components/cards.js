import * as React from 'react'
import PropTypes from 'prop-types'
import { GatsbyImage, getImage, getSrc } from 'gatsby-plugin-image'
import { usePersonImage } from '../hooks/usePersonImages'
import PageHeader from './ui/PageHeader'
import SmartLink from './ui/SmartLink'
import Tabs, { tabPanelProps } from './ui/Tabs'
import {
  prepaintGateScript,
  readQueryParam,
  useReleasePrepaintGate,
  writeQueryParams,
} from './query-state'
import { useIsClientRender } from './useIsClientRender'
import './cards.css'

const PLACEHOLDER_IMAGE = 'placeholder.png'
const TAB_PARAM = 'tab'

// Shows the Alumni list instead of the server-rendered Current list on a hard load of
// ?tab=alumni, until hydration selects the tab (cards.css).
const GATE_CLASS = 'people-alumni-pending'

export const alumniGateScript = prepaintGateScript(GATE_CLASS, { [TAB_PARAM]: ['alumni'] })

const STATUS_TABS = [
  { value: 'current', label: 'Current Members' },
  { value: 'alumni', label: 'Alumni' },
]

const POSITION_ORDER = [
  'Director, Principal Investigator',
  'Researcher',
  'Research Administrator',
  'Lead Research Scientist',
  'Research Fellow from Purdue University',
  'Postdoctoral Researcher',
]

// The group heading already says "Undergraduate"/"High School", so those cards omit the role.
const GROUPS = [
  { key: 'pi', title: 'Principal Investigator', showRole: true },
  { key: 'researchers', title: 'Researchers', showRole: true },
  { key: 'staff', title: 'Staff & Postdocs', showRole: true },
  { key: 'graduate', title: 'Graduate Students', showRole: true },
  { key: 'undergraduate', title: 'Undergraduate Students', showRole: false },
  { key: 'highSchool', title: 'High School Students', showRole: false },
]

const positionRank = position => {
  const index = POSITION_ORDER.indexOf(position)
  return index === -1 ? POSITION_ORDER.length : index
}

const byPositionThenName = (a, b) =>
  positionRank(a.position) - positionRank(b.position) || a.name.localeCompare(b.name)

const groupKeyFor = (position = '') => {
  const lower = position.toLowerCase()

  if ((lower.includes('graduate') && !lower.includes('undergraduate')) || lower.includes('phd')) {
    return 'graduate'
  }
  if (position === 'Undergraduate Student') return 'undergraduate'
  if (position === 'High School Student') return 'highSchool'
  if (lower.includes('director') || lower.includes('principal investigator')) return 'pi'
  if (
    (lower.includes('researcher') && !lower.includes('postdoctoral')) ||
    lower.includes('research scientist')
  ) {
    return 'researchers'
  }
  return 'staff'
}

const groupMembers = members => {
  const grouped = Object.fromEntries(GROUPS.map(group => [group.key, []]))
  members.forEach(member => grouped[groupKeyFor(member.position)].push(member))
  GROUPS.forEach(group => grouped[group.key].sort(byPositionThenName))
  return grouped
}

const tabFromUrl = () => (readQueryParam(TAB_PARAM) === 'alumni' ? 'alumni' : 'current')

const personShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  position: PropTypes.string,
  image: PropTypes.string,
  status: PropTypes.oneOf(['current', 'alumni']).isRequired,
  url: PropTypes.string,
})

const MemberAvatar = ({ image, name }) => {
  const resolvePersonImage = usePersonImage()
  const photo = image && image !== PLACEHOLDER_IMAGE ? resolvePersonImage(image) : null

  if (photo) {
    return (
      <GatsbyImage
        image={getImage(photo)}
        alt={`Portrait of ${name}`}
        className="member-card__avatar"
      />
    )
  }

  // The silhouette says nothing the name below does not, and 40 people share it: a plain
  // <img> keeps each of those cards to a few hundred bytes of HTML.
  const placeholderSrc = getSrc(resolvePersonImage(PLACEHOLDER_IMAGE))

  if (!placeholderSrc) {
    return <span className="member-card__avatar" aria-hidden="true" />
  }

  return (
    <img
      className="member-card__avatar"
      src={placeholderSrc}
      alt=""
      width="125"
      height="125"
      loading="lazy"
      decoding="async"
    />
  )
}

MemberAvatar.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
}

const MemberCard = ({ member, showRole }) => (
  <li className="member-card">
    <MemberAvatar image={member.image} name={member.name} />
    <h3 className="member-card__name">
      {member.url ? <SmartLink to={member.url}>{member.name}</SmartLink> : member.name}
    </h3>
    {showRole && member.position && <p className="member-card__role">{member.position}</p>}
  </li>
)

MemberCard.propTypes = {
  member: personShape.isRequired,
  showRole: PropTypes.bool.isRequired,
}

const MemberGroups = ({ members }) => {
  const grouped = groupMembers(members)

  return GROUPS.filter(group => grouped[group.key].length > 0).map(group => (
    <section className="people-group" key={group.key}>
      <h2 className="people-group__title">{group.title}</h2>
      <ul className="member-grid">
        {grouped[group.key].map(member => (
          <MemberCard key={member.name} member={member} showRole={group.showRole} />
        ))}
      </ul>
    </section>
  ))
}

MemberGroups.propTypes = {
  members: PropTypes.arrayOf(personShape).isRequired,
}

const Cards = ({ peopleCards, locationSearch, locationKey }) => {
  const isClientRender = useIsClientRender()
  // On client-side navigation (Back included) the first render already shows the tab in the
  // URL, so the page has its full height when Gatsby restores the scroll position.
  const [active, setActive] = React.useState(() => (isClientRender ? tabFromUrl() : 'current'))
  const [urlApplied, setUrlApplied] = React.useState(isClientRender)

  // After hydration, and when a link leads back to /people/ while this page stays mounted.
  React.useEffect(() => {
    setActive(tabFromUrl())
    setUrlApplied(true)
  }, [locationSearch, locationKey])

  useReleasePrepaintGate(GATE_CLASS, urlApplied)

  const handleChange = value => {
    setActive(value)
    writeQueryParams({ [TAB_PARAM]: value === 'current' ? '' : value })
  }

  return (
    <div className="people-page">
      <div className="page-container">
        <PageHeader title="People" />
        <Tabs
          label="People categories"
          idBase="people"
          value={active}
          onChange={handleChange}
          items={STATUS_TABS}
          className="people-tabs"
        />
        <div {...tabPanelProps('people', active)}>
          {STATUS_TABS.map(({ value }) => (
            <div key={value} hidden={active !== value} data-status={value}>
              <MemberGroups members={peopleCards.filter(person => person.status === value)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

Cards.propTypes = {
  peopleCards: PropTypes.arrayOf(personShape).isRequired,
  locationSearch: PropTypes.string,
  locationKey: PropTypes.string,
}

export default Cards
