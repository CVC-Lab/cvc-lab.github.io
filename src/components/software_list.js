import * as React from 'react'
import PropTypes from 'prop-types'
import PageHeader from './ui/PageHeader'
import SmartLink from './ui/SmartLink'
import './software_list.css'

const slugFor = item => item.slug || item.name.replace(/[\s/]+/g, '-').toLowerCase()

const SoftwareList = ({ softwareProjects }) => (
  <div className="software-page">
    <div className="page-container">
      <PageHeader title="Software Projects" />
      {softwareProjects.map(category => (
        <section className="software-group" key={category.category}>
          <h2 className="software-group__title">{category.category}</h2>
          <ul className="software-list">
            {category.items.map(item => (
              <li className="software-list__item" key={item.name}>
                <SmartLink
                  to={item.href || `/software/${slugFor(item)}/`}
                  newTab={Boolean(item.href)}
                  className="software-list__link"
                >
                  {item.name}
                </SmartLink>
                : {item.description}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </div>
)

SoftwareList.propTypes = {
  softwareProjects: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          description: PropTypes.string,
          slug: PropTypes.string,
          href: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
}

export default SoftwareList
