import * as React from 'react'
import { useSiteMetadata } from '../../context/SiteContext'
import AboutCondensed from '../AboutCondensed'
import PeopleCondensed from '../PeopleCondensed'
import HeroSection from './HeroSection'
import ThemeSelector from './ThemeSelector'
import ThemeExplainerPanel from './ThemeExplainerPanel'
import FeaturedProjectsGrid from './FeaturedProjectsGrid'
import OutputsSection from './OutputsSection'
import MetricsSection from './MetricsSection'
import '../../components/home-v2/research-themes.css'
import publicationData from '../../data/papers.json'

const { homepageThemes, homepageThemeById } = require('../../data/site/homepageThemes')

const ResearchThemesLanding = () => {
  const { projectTiles, softwareProjects, newsTiles, peopleCards } = useSiteMetadata()
  const [activeThemeId, setActiveThemeId] = React.useState(null)
  const activeTheme = activeThemeId ? homepageThemeById[activeThemeId] : null

  const handleSelectTheme = themeId => {
    setActiveThemeId(themeId)

    window.requestAnimationFrame(() => {
      const selectedThemeSection = document.getElementById('selected-theme-showcase')
      selectedThemeSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const activeThemeProjects = React.useMemo(() => {
    if (!activeTheme) return []
    const projectsByName = new Map((projectTiles || []).map(project => [project.name, project]))

    return activeTheme.projectNames.map(name => projectsByName.get(name)).filter(Boolean)
  }, [activeTheme, projectTiles])

  const outputStats = React.useMemo(() => {
    const softwareToolCount = (softwareProjects || []).reduce(
      (total, category) => total + (category.items?.length || 0),
      0
    )
    const currentMemberCount = (peopleCards || []).filter(
      person => person.status === 'current' || person.status === true || person.Current === true
    ).length

    return {
      projectCount: (projectTiles || []).length,
      publicationCount: publicationData.length,
      softwareCategoryCount: (softwareProjects || []).length,
      softwareToolCount,
      newsCount: (newsTiles || []).length,
      currentMemberCount,
      yearsOfResearch: '30+',
    }
  }, [newsTiles, peopleCards, projectTiles, softwareProjects])

  return (
    <>
      <HeroSection />
      <ThemeSelector
        themes={homepageThemes}
        activeThemeId={activeThemeId}
        onSelectTheme={handleSelectTheme}
      />
      {activeTheme ? (
        <div id="selected-theme-showcase" className="research-theme-selected-showcase">
          <aside className="research-theme-side-switcher" aria-label="Switch research theme">
            <div className="research-themes-shell">
              <div className="research-theme-side-switcher-card">
                <span className="research-theme-side-switcher-label">Switch theme</span>
                {homepageThemes.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    className={`research-theme-side-chip ${
                      theme.id === activeThemeId ? 'research-theme-side-chip--active' : ''
                    }`}
                    onClick={() => handleSelectTheme(theme.id)}
                    aria-pressed={theme.id === activeThemeId}
                  >
                    {theme.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <ThemeExplainerPanel theme={activeTheme} />
          <FeaturedProjectsGrid theme={activeTheme} projects={activeThemeProjects} />
        </div>
      ) : (
        <section id="selected-theme-showcase" className="research-theme-empty-state">
          <div className="research-themes-shell">
            <p>Choose a research theme above to view its explanation and featured projects.</p>
          </div>
        </section>
      )}
      <OutputsSection
        publicationCount={outputStats.publicationCount}
        softwareCategoryCount={outputStats.softwareCategoryCount}
        softwareToolCount={outputStats.softwareToolCount}
        newsCount={outputStats.newsCount}
      />
      <MetricsSection
        projectCount={outputStats.projectCount}
        publicationCount={outputStats.publicationCount}
        currentMemberCount={outputStats.currentMemberCount}
        yearsOfResearch={outputStats.yearsOfResearch}
      />
      <AboutCondensed />
      <PeopleCondensed peopleCards={peopleCards || []} />
    </>
  )
}

export default ResearchThemesLanding
