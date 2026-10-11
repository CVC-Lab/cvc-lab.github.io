import * as React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'gatsby'
import { FaBars, FaTimes } from 'react-icons/fa'
import { useScrollLock } from '../hooks/useScrollLock'
import './navigation.css'

// Keep in step with the media queries in navigation.css (max-width: 1023.98px / min-width: 1024px).
const DESKTOP_QUERY = '(min-width: 1024px)'
const MENU_ID = 'primary-navigation'
// Everything outside the drawer that must not take focus while it is open.
const BACKGROUND_SELECTOR = '.skip-link, .header-logo-link, .site-masthead, #main-content, .footer'

const Navigation = ({ menuLinks = [] }) => {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef(null)
  const menuRef = React.useRef(null)

  const close = () => setOpen(false)
  const closeAndRefocus = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  useScrollLock(open)

  React.useEffect(() => {
    if (!open) return undefined

    const button = buttonRef.current
    const menu = menuRef.current
    const background = document.querySelectorAll(BACKGROUND_SELECTOR)
    const desktop = window.matchMedia(DESKTOP_QUERY)

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        button.focus()
        return
      }
      if (event.key !== 'Tab') return
      // Every Tab is handled here, not only the two ends: once the drawer scrolls,
      // Firefox makes the drawer itself a tab stop and the native order would stop on it.
      const stops = [button, ...menu.querySelectorAll('a[href]')]
      const index = stops.indexOf(document.activeElement)
      const step = event.shiftKey ? -1 : 1
      const next = index === -1 && event.shiftKey ? -1 : index + step
      event.preventDefault()
      stops[(next + stops.length) % stops.length].focus()
    }
    const onBreakpoint = event => {
      if (event.matches) setOpen(false)
    }

    background.forEach(node => {
      node.inert = true
    })
    document.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onBreakpoint)
    menu.querySelector('a[href]')?.focus()

    return () => {
      background.forEach(node => {
        node.inert = false
      })
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onBreakpoint)
    }
  }, [open])

  return (
    <div className="nav-wrapper">
      <button
        ref={buttonRef}
        type="button"
        className="nav-hamburger"
        onClick={() => setOpen(prev => !prev)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={MENU_ID}
      >
        {open ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
      </button>

      <nav
        ref={menuRef}
        id={MENU_ID}
        className={`nav-menu${open ? ' nav-menu--open' : ''}`}
        aria-label="Primary"
      >
        <ul className="nav-list">
          {menuLinks.map(({ name, link }) => (
            <li key={link} className="nav-item">
              <Link
                to={link}
                className="nav-link"
                activeClassName="nav-link--active"
                partiallyActive={link !== '/' && !link.includes('#')}
                onClick={close}
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {open && <div className="nav-overlay" onClick={closeAndRefocus} aria-hidden="true" />}
    </div>
  )
}

Navigation.propTypes = {
  menuLinks: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      link: PropTypes.string.isRequired,
    })
  ),
}

export default Navigation
