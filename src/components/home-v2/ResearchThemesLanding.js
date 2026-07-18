import * as React from 'react'
import { Link } from 'gatsby'
import { FaArrowRight } from 'react-icons/fa'
import { useSiteMetadata } from '../../context/SiteContext'
import AboutCondensed from '../AboutCondensed'
import PeopleCondensed from '../PeopleCondensed'
import HeroSection from './HeroSection'
import ThemeBanners from './ThemeBanners'
import '../../components/home-v2/research-themes.css'

const evidenceLinks = [
  { label: 'Publications', href: '/publications', description: 'Papers and preprints' },
  { label: 'Projects', href: '/projects', description: 'The complete project index' },
  { label: 'Software', href: '/software', description: 'Tools and systems' },
]

const { homepageThemes } = require('../../data/site/homepageThemes')

const ResearchThemesLanding = () => {
  const { peopleCards } = useSiteMetadata()

  return (
    <>
      <HeroSection />
      <ThemeBanners themes={homepageThemes} />

      <section className="research-home-evidence" aria-labelledby="research-home-evidence-title">
        <div className="research-themes-shell research-home-evidence__inner">
          <div>
            <p className="research-themes-section-eyebrow">Evidence &amp; tools</p>
            <h2 id="research-home-evidence-title">Go from a theme to the work behind it.</h2>
            <p>
              Short project overviews provide the map. Publications, software, and the full project
              index provide the technical depth.
            </p>
          </div>
          <nav className="research-home-evidence__links" aria-label="Research resources">
            {evidenceLinks.map(link => (
              <Link key={link.href} to={link.href} className="research-home-evidence__link">
                <span>
                  <strong>{link.label}</strong>
                  <small>{link.description}</small>
                </span>
                <FaArrowRight aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <AboutCondensed />
      <PeopleCondensed peopleCards={peopleCards || []} />
    </>
  )
}

export default ResearchThemesLanding
