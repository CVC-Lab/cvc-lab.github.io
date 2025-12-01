import * as React from 'react'
import './AboutCondensed.css'

const AboutCondensed = () => (
  <section className="about-condensed" id="about">
    <div className="about-condensed-container">
      <div className="about-condensed-content">
        <h2 className="about-condensed-title">About the Center</h2>
        <p className="about-condensed-text">
          The Computational Visualization Center is a cross-disciplinary research group at the
          University of Texas at Austin, developing core technologies for computational modeling,
          simulation, analysis, and visualization of natural and synthetic phenomena. Under the
          joint auspices of the Oden Institute and the Department of Computer Science, our work
          spans machine learning, geometric modeling, scientific computing, and biomedical
          applications.
        </p>
      </div>
      <div className="about-condensed-logos">
        <a
          href="https://www.oden.utexas.edu/"
          target="_blank"
          rel="noopener noreferrer"
          className="about-logo-link"
          aria-label="Visit Oden Institute website"
        >
          <img
            src={require('../images/oden.png').default}
            alt="Oden Institute logo"
            className="about-logo"
          />
        </a>
        <a
          href="https://www.cs.utexas.edu/"
          target="_blank"
          rel="noopener noreferrer"
          className="about-logo-link"
          aria-label="Visit UT Computer Science website"
        >
          <img src={require('../images/cs.png').default} alt="UT CS logo" className="about-logo" />
        </a>
      </div>
    </div>
  </section>
)

export default AboutCondensed
