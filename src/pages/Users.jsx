import { useState } from 'react'
import { formatDate, useAdmin } from '../context/AdminContext'

const initialForm = { name: '', email: '', role: 'Member' }

export default function Users() {
  const { users, addUser, toggleUser, removeUser } = useAdmin()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  const active = users.filter((item) => item.status === 'Active').length
  const admins = users.filter((item) => item.role === 'Admin').length
  const suspended = users.filter((item) => item.status === 'Suspended').length

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
    setSaved('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (form.name.trim().length < 2) return setError('Enter a name with at least 2 characters.')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.')
    if (users.some((item) => item.email.toLowerCase() === form.email.trim().toLowerCase())) {
      return setError('That email is already registered.')
    }

    addUser({ name: form.name.trim(), email: form.email.trim(), role: form.role, status: 'Active' })
    setForm(initialForm)
    setError('')
    setSaved('User added successfully.')
  }

  const visible = users.filter((item) => {
    const term = query.trim().toLowerCase()
    return !term || `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(term)
  })

  return (
    <div className="page-stack">
      <div className="stat-grid stat-grid--four">
        <div className="stat-card stat-card--navy">
          <span className="stat-label">Total users</span>
          <strong className="stat-value">{users.length}</strong>
          <span className="stat-note">registered accounts</span>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-label">Active</span>
          <strong className="stat-value">{active}</strong>
          <span className="stat-note">can access the site</span>
        </div>
        <div className="stat-card stat-card--cyan">
          <span className="stat-label">Admins</span>
          <strong className="stat-value">{admins}</strong>
          <span className="stat-note">with admin role</span>
        </div>
        <div className="stat-card stat-card--amber">
          <span className="stat-label">Suspended</span>
          <strong className="stat-value">{suspended}</strong>
          <span className="stat-note">access blocked</span>
        </div>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Add a user</h3>
              <p>Create a new DOMIGEN member.</p>
            </div>
          </div>
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Name</span>
              <input type="text" value={form.name} onChange={update('name')} placeholder="Full name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={update('email')} placeholder="name@example.com" />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={form.role} onChange={update('role')}>
                <option>Member</option>
                <option>Admin</option>
              </select>
            </label>
            <div className="form-actions">
              {error && <p className="form-error" role="alert">{error}</p>}
              {saved && <p className="form-success" role="status">{saved}</p>}
              <button type="submit" className="btn btn-primary">Add user</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Members</h3>
            <p>Manage roles and account access.</p>
          </div>
          <div className="panel-tools">
            <label className="table-search">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search users…"
                aria-label="Search users"
              />
            </label>
            {!showForm && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add user</button>
            )}
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td><span className={`tag${user.role === 'Admin' ? ' tag--admin' : ''}`}>{user.role}</span></td>
                  <td><span className={`status status--${user.status.toLowerCase()}`}>{user.status}</span></td>
                  <td>{formatDate(user.joined)}</td>
                  <td className="actions-cell">
                    <button type="button" className="row-action" onClick={() => toggleUser(user.id)}>
                      {user.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button type="button" className="row-action row-action--danger" onClick={() => removeUser(user.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan="6" className="empty-row">No users match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
