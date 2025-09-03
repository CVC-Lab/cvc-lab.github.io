import * as React from 'react'
import './footer-modern.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo and about section */}
        <div className="footer-logo-column">
          <h2 className="footer-section-title">Computational Visualization Center</h2>
          <p className="footer-content">
            A cross-disciplinary effort to develop and improve technologies for computational
            modeling, simulation, analysis, and visualization at UT Austin.
          </p>
          <div className="footer-social">
            <a
              href="https://twitter.com/UTAustin"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <svg
                className="footer-social-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/user/utaustintexas"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <svg
                className="footer-social-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
              </svg>
            </a>
            <a
              href="https://github.com/cvc-lab"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg
                className="footer-social-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>
        </div>

        {/* Contact information */}
        <div className="footer-contact-column">
          <h3 className="footer-section-title">Contact Us</h3>
          <div className="footer-address">
            <p className="footer-content">
              Peter O&apos;Donnell Jr. Building (POB) 2.102
              <br />
              201 E 24th St
              <br />
              Austin, TX 78712
            </p>
          </div>
          <ul className="footer-contact-list">
            <li className="footer-contact-item">
              <svg
                className="footer-contact-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <span className="footer-contact-text">bajaj@oden.utexas.edu</span>
            </li>
            <li className="footer-contact-item">
              <svg
                className="footer-contact-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span className="footer-contact-text">+1 (512) 471-8870</span>
            </li>
          </ul>
        </div>

        {/* Quick links */}
        <div className="footer-links-column">
          <h3 className="footer-section-title">Quick Links</h3>
          <ul className="footer-links">
            <li className="footer-link-item">
              <a href="/#projects" className="footer-link">
                Research Projects
              </a>
            </li>
            <li className="footer-link-item">
              <a href="/#people" className="footer-link">
                Our Team
              </a>
            </li>
            <li className="footer-link-item">
              <a href="/publications" className="footer-link">
                Publications
              </a>
            </li>
            <li className="footer-link-item">
              <a href="/software" className="footer-link">
                Software
              </a>
            </li>
            <li className="footer-link-item">
              <a href="/news" className="footer-link">
                News & Events
              </a>
            </li>
            <li className="footer-link-item">
              <a
                href="https://cvcweb.oden.utexas.edu/cvcwp/"
                className="footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Previous Website
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer bottom - copyright */}
      <div className="footer-container">
        <div className="footer-bottom" style={{ gridColumn: 'span 12' }}>
          <p>
            © {currentYear} Computational Visualization Center. All rights reserved. Part of the
            Oden Institute for Computational Engineering and Sciences at The University of Texas at
            Austin.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
