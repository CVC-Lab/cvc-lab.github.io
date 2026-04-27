import * as React from 'react'
import PropTypes from 'prop-types'

const ThemeSelector = ({ themes, activeThemeId, onSelectTheme }) => {
  return (
    <section className="research-theme-selector" id="theme-selector">
      <div className="research-themes-shell">
        <div className="research-themes-section-heading">
          <span className="research-themes-section-eyebrow">Research Themes</span>
          <h2 className="research-themes-section-title">Choose an entry point into the lab</h2>
          <p className="research-themes-section-subtitle">
            These themes are designed for first-time visitors. They frame the lab by the kinds of
            problems we help solve, not just by internal technical categories.
          </p>
        </div>

        <div className="research-theme-selector-grid" role="list" aria-label="Research themes">
          {themes.map(theme => {
            const isActive = theme.id === activeThemeId

            return (
              <button
                key={theme.id}
                type="button"
                className={`research-theme-chip ${isActive ? 'research-theme-chip--active' : ''}`}
                onClick={() => onSelectTheme(theme.id)}
                aria-pressed={isActive}
              >
                <span className="research-theme-chip-title">{theme.title}</span>
                <span className="research-theme-chip-summary">{theme.summary}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

ThemeSelector.propTypes = {
  themes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeThemeId: PropTypes.string,
  onSelectTheme: PropTypes.func.isRequired,
}

export default ThemeSelector
