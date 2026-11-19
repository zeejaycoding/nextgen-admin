import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAdmin } from '../context/AdminContext'

export default function AdminLogin() {
  const { authed, login } = useAdmin()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (authed) return <Navigate to="/admin" replace />

  const handleSubmit = (event) => {
    event.preventDefault()
    const message = login(email, password)
    if (message) {
      setError(message)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Logo size={44} />
          <span className="login-badge">ADMIN</span>
        </div>

        <h1>Welcome back</h1>
        <p className="login-subtitle">Sign in to manage NextGen Update.</p>

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setError('') }}
              placeholder="admin@nextgenupdate.com"
              autoComplete="username"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); setError('') }}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block login-submit">
            Sign in <span className="arrow">→</span>
          </button>
        </form>
      </div>
    </div>
  )
}
