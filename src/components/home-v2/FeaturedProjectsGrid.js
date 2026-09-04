import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { useCardImage } from '../../hooks/useCardImages'

const ProjectPreview = ({ project }) => {
  const resolveCardImage = useCardImage()
  const image = getImage(resolveCardImage(project.img_name))

  if (!image) return null

  return <GatsbyImage image={image} alt={`${project.name} project preview`} loading="lazy" />
}

ProjectPreview.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired,
    img_name: PropTypes.string.isRequired,
  }).isRequired,
}

const ProjectCardLink = ({ project, children }) => {
  if (project.link.startsWith('http')) {
    return (
      <a
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        className="research-theme-project-link"
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={project.link} className="research-theme-project-link">
      {children}
    </Link>
  )
}

ProjectCardLink.propTypes = {
  project: PropTypes.shape({
    link: PropTypes.string.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
}

const FeaturedProjectsGrid = ({ theme, projects }) => {
  return (
    <section className="research-theme-projects">
      <div className="research-themes-shell">
        <div className="research-themes-section-heading research-themes-section-heading--compact">
          <span className="research-themes-section-eyebrow">Theme-Aware Showcase</span>
          <h2 className="research-themes-section-title">Featured projects for {theme.title}</h2>
        </div>

        <div className="research-theme-projects-grid">
          {projects.map((project, index) => (
            <article
              key={project.name}
              className={`research-theme-project-card ${
                index === 0 ? 'research-theme-project-card--primary' : ''
              }`}
            >
              <div className="research-theme-project-image">
                <ProjectPreview project={project} />
              </div>

              <div className="research-theme-project-content">
                <div className="research-theme-project-meta">
                  <span className="research-theme-project-badge">{theme.title}</span>
                  {project.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="research-theme-project-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="research-theme-project-title">{project.name}</h3>
                <p className="research-theme-project-description">{project.description}</p>

                <ProjectCardLink project={project}>
                  <span className="research-theme-project-cta">View Project</span>
                </ProjectCardLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

FeaturedProjectsGrid.propTypes = {
  theme: PropTypes.shape({
    title: PropTypes.string.isRequired,
  }).isRequired,
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      img_name: PropTypes.string.isRequired,
      link: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
}

export default FeaturedProjectsGrid
