import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { navigate } from 'gatsby'
import { usePassword } from './PasswordContext'

const styles = {
  wrapper: {
    height: '100vh',
    background: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: '48px',
    borderRadius: '4px',
  },
  button: {
    width: '100%',
    height: '48px',
    background: '#BF5700',
    color: '#FFFFFF',
    border: '1px solid #BF5700',
    borderRadius: '4px',
    marginTop: '16px',
    textTransform: 'uppercase',
    fontWeight: '300',
    fontFamily: 'sans-serif',
  },
  buttonHover: {
    background: '#333f48',
    color: '#000000',
  },
  errorMessage: {
    color: 'red',
    marginTop: '10px',
  },
}

const PasswordProtect = ({ location }) => {
  const [password, setPassword] = useState('')
  const [isButtonHovered, buttonHover] = useState(false)
  const [error, setError] = useState('')
  const { login } = usePassword()

  const redirectTo = location?.state?.redirectTo || '/internal'

  const onSubmit = event => {
    event.preventDefault()
    const success = login(password)

    if (success) {
      navigate(redirectTo)
    } else {
      setError('Incorrect password. Please try again.')
    }
  }

  return (
    <div style={styles.wrapper}>
      <h4 style={{ color: '#333f48' }}>Enter Password</h4>

      <form onSubmit={onSubmit} style={{ width: '320px' }}>
        <input
          name="password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          style={styles.input}
        />

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(isButtonHovered ? styles.buttonHover : null),
          }}
          onMouseEnter={() => buttonHover(true)}
          onMouseLeave={() => buttonHover(false)}
        >
          Enter
        </button>

        {error && <p style={styles.errorMessage}>{error}</p>}
      </form>
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
