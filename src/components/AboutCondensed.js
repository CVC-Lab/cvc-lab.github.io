import * as React from 'react'
import { StaticImage } from 'gatsby-plugin-image'
import SmartLink from './ui/SmartLink'
import './AboutCondensed.css'

const AboutCondensed = () => (
  <section className="about-condensed" id="about">
    <div className="page-container about-condensed-container">
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
        <div className="about-condensed-logos">
          <SmartLink
            to="https://www.oden.utexas.edu/"
            className="about-logo-link"
            aria-label="Visit Oden Institute website (opens in a new tab)"
          >
            <StaticImage
              src="../images/oden.png"
              alt="Oden Institute logo"
              className="about-logo"
              layout="constrained"
              width={210}
              placeholder="none"
              objectFit="contain"
              formats={['auto', 'webp']}
            />
          </SmartLink>
          <SmartLink
            to="https://www.cs.utexas.edu/"
            className="about-logo-link"
            aria-label="Visit UT Computer Science website (opens in a new tab)"
          >
            <StaticImage
              src="../images/cs.png"
              alt="UT CS logo"
              className="about-logo"
              layout="constrained"
              width={210}
              placeholder="none"
              objectFit="contain"
              formats={['auto', 'webp']}
            />
          </SmartLink>
        </div>
      </div>
      <div className="about-condensed-photo-wrapper">
        <StaticImage
          src="../images/cvc_projects_banner.jpg"
          alt="Figures from four CVC projects: the piano digital twin, Parkinson’s motor states, the ski jumper digital twin, and subsurface flow modeling"
          className="about-condensed-photo"
          layout="constrained"
          width={900}
          formats={['auto', 'webp']}
          placeholder="dominantColor"
        />
      </div>
    </div>
  </section>
)

export default AboutCondensed
