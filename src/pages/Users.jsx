import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { formatDate } from '../lib/format'

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'Member',
  status: 'Active',
}

export default function Users() {
  const { users, addUser, updateUser, toggleUser, removeUser } = useAdmin()
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

  const startAdd = () => {
    setEditingId(null)
    setForm(initialForm)
    setError('')
    setSaved('')
    setShowForm(true)
  }

  const startEdit = (user) => {
    setEditingId(user.id)
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'Member',
      status: user.status || 'Active',
    })
    setError('')
    setSaved('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim()

    if (name.length < 2) return setError('Enter a name with at least 2 characters.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (form.password && form.password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (!editingId && !form.password) return setError('Set a password for this account.')
    if (users.some((item) => (
      String(item.id) !== String(editingId)
      && item.email.toLowerCase() === email.toLowerCase()
    ))) {
      return setError('That email is already registered.')
    }

    const payload = { name, email, role: form.role, status: form.status }
    if (form.password) payload.password = form.password

    const wasEditing = editingId !== null
    setSubmitting(true)
    const message = wasEditing
      ? await updateUser(editingId, payload)
      : await addUser(payload)
    setSubmitting(false)

    if (message) {
      setError(message)
      return
    }

    setForm(initialForm)
    setEditingId(null)
    setShowForm(false)
    setError('')
    setSaved(wasEditing ? 'User updated successfully.' : 'User added successfully.')
  }

  const handleDelete = (user) => {
    if (!window.confirm(`Delete ${user.name}'s account?`)) return
    removeUser(user.id)
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
              <h3>{editingId !== null ? 'Edit user' : 'Add a user'}</h3>
              <p>
                {editingId !== null
                  ? 'Update account details or leave the password blank to keep the current one.'
                  : 'Create a new DOMIGEN member with a password they can sign in with.'}
              </p>
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
              <span>{editingId !== null ? 'New password (optional)' : 'Password'}</span>
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder={editingId !== null ? 'Leave blank to keep current' : 'At least 8 characters'}
                autoComplete="new-password"
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select value={form.role} onChange={update('role')}>
                <option>Member</option>
                <option>Admin</option>
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={update('status')}>
                <option>Active</option>
                <option>Suspended</option>
              </select>
            </label>
            <div className="form-actions">
              {error && <p className="form-error" role="alert">{error}</p>}
              {saved && <p className="form-success" role="status">{saved}</p>}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : editingId !== null ? 'Save changes' : 'Add user'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(initialForm) }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Members</h3>
            <p>Manage accounts, roles, passwords and access.</p>
            {saved && <p className="form-success" role="status">{saved}</p>}
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
              <button type="button" className="btn btn-primary btn-sm" onClick={startAdd}>+ Add user</button>
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
                  <td>
                    {user.email}
                    {user.emailVerified === false && <span className="tag tag--pending">Unverified</span>}
                  </td>
                  <td><span className={`tag${user.role === 'Admin' ? ' tag--admin' : ''}`}>{user.role}</span></td>
                  <td><span className={`status status--${user.status.toLowerCase()}`}>{user.status}</span></td>
                  <td>{formatDate(user.joined)}</td>
                  <td className="actions-cell">
                    <button type="button" className="row-action" onClick={() => startEdit(user)}>Edit</button>
                    <button type="button" className="row-action" onClick={() => toggleUser(user.id)}>
                      {user.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button type="button" className="row-action row-action--danger" onClick={() => handleDelete(user)}>
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
