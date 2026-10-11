import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { navigate } from 'gatsby'
import BackLink from '../ui/BackLink'
import {
  DEFAULT_GATED_PATH,
  PENDING_REDIRECT_KEY,
  gateStorage,
  getGateScope,
  isProtectedPath,
  usePassword,
} from './PasswordContext'
import './password-gate.css'

const AREA_LABELS = {
  site: 'the CVC internal links page',
  dbg: 'the Dynamic Belief Games internal pages',
}

const PasswordProtect = ({ location }) => {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [failures, setFailures] = useState(0)
  const [target, setTarget] = useState(null)
  const inputRef = useRef(null)
  const { login } = usePassword()
  const requestedPath = location?.state?.redirectTo

  // Before hydration (or without JavaScript) the server-rendered form would submit natively,
  // a GET to this page. The button stays disabled until then, which also blocks Enter.
  // Its autoComplete="off" stops Firefox from restoring the enabled state on a reload.
  useEffect(() => {
    setReady(true)
  }, [])

  // Resolved after hydration: history state and sessionStorage do not exist during SSR.
  useEffect(() => {
    const candidate = requestedPath || gateStorage.get(PENDING_REDIRECT_KEY)
    setTarget(isProtectedPath(candidate) ? candidate : DEFAULT_GATED_PATH)
  }, [requestedPath])

  // Deferred one frame: after a client-side redirect the router focuses
  // #gatsby-focus-wrapper from a parent effect that runs after this one.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const onSubmit = event => {
    event.preventDefault()
    const redirectTo = target || DEFAULT_GATED_PATH

    if (login(inputRef.current?.value ?? '', redirectTo)) {
      gateStorage.remove(PENDING_REDIRECT_KEY)
      navigate(redirectTo, { replace: true })
      return
    }

    setError('Incorrect password. Please try again.')
    setFailures(count => count + 1)
    inputRef.current?.focus()
    inputRef.current?.select()
  }

  const area = target ? AREA_LABELS[getGateScope(target)] : null

  return (
    <div className="password-gate">
      <div className="password-gate__panel">
        <h1 className="password-gate__title">Enter password</h1>
        <p className="password-gate__lede">
          {area ? `Enter the password for ${area}.` : 'Enter the password to continue.'}
        </p>

        <form className="password-gate__form" onSubmit={onSubmit}>
          <label className="password-gate__label" htmlFor="password-gate-input">
            Password
          </label>
          {/* Uncontrolled and unnamed: text typed before hydration survives it, and no
              submit can ever serialise the value into the URL. */}
          <input
            ref={inputRef}
            id="password-gate-input"
            className="password-gate__input"
            type="password"
            autoComplete="current-password"
            required
            onChange={() => setError('')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'password-gate-error' : undefined}
          />

          <button
            className="password-gate__submit"
            type="submit"
            disabled={!ready}
            autoComplete="off"
          >
            Enter
          </button>

          <noscript>
            <p className="password-gate__hint">This form needs JavaScript.</p>
          </noscript>

          {/* Always mounted so screen readers track it as a live region. The keyed
              span is re-inserted on every failure, so a repeat is announced again. */}
          <p className="password-gate__error" id="password-gate-error" role="alert">
            {error ? <span key={failures}>{error}</span> : null}
          </p>
        </form>

        <BackLink to="/">Back to home</BackLink>
      </div>
    </div>
  )
}

PasswordProtect.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      redirectTo: PropTypes.string,
    }),
  }),
}

export default PasswordProtect
