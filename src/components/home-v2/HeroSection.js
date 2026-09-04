import * as React from 'react'
import { Link } from 'gatsby'
import { FaArrowDown, FaArrowRight } from 'react-icons/fa'
import { StaticImage } from 'gatsby-plugin-image'

const HeroSection = () => (
  <section className="research-home-hero">
    <StaticImage
      src="../../images/CVC_Lab_title_photo.png"
      alt="Computational Visualization Center researchers working with large-scale scientific visualizations"
      className="research-home-hero__image"
      layout="fullWidth"
      loading="eager"
      formats={['auto', 'webp']}
      placeholder="dominantColor"
    />
    <div className="research-home-hero__overlay" aria-hidden="true" />
    <div className="research-themes-shell research-home-hero__content">
      <div className="research-home-hero__copy">
        <p className="research-home-hero__eyebrow">Computational Visualization Center</p>
        <p className="research-home-hero__meta">
          Oden Institute · The University of Texas at Austin
        </p>
        <h1>AI, visualization, and models for complex systems.</h1>
        <p className="research-home-hero__summary">
          We build computational methods that help researchers see structure, reason about change,
          and make uncertainty visible across healthcare, engineering, and science.
        </p>
        <div className="research-home-hero__actions">
          <a href="#research-themes" className="research-home-button research-home-button--primary">
            Explore research themes <FaArrowDown aria-hidden="true" />
          </a>
          <Link to="/publications" className="research-home-button research-home-button--quiet">
            Read the research <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  </section>
)

export default HeroSection
