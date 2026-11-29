import { useEffect, useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { formatDate } from '../lib/format'

const filters = ['All', 'Open', 'In Progress', 'Closed']
const statuses = filters.slice(1)

function statusClass(status) {
  return String(status || 'Open').toLowerCase().replace(/\s+/g, '-')
}

function preview(text, limit = 70) {
  const value = String(text || '').trim()
  return value.length > limit ? `${value.slice(0, limit)}…` : value
}

export default function Tickets() {
  const { tickets, reloadTickets, respondTicket, removeTicket } = useAdmin()
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ response: '', status: 'Open' })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  // Always read fresh tickets when the page opens, even if the app was loaded
  // before a ticket arrived or the real-time socket missed an event.
  useEffect(() => {
    reloadTickets().catch(() => {})
  }, [])

  const selected = tickets.find((item) => String(item.id) === String(selectedId)) || null
  const open = tickets.filter((item) => item.status === 'Open').length
  const inProgress = tickets.filter((item) => item.status === 'In Progress').length
  const closed = tickets.filter((item) => item.status === 'Closed').length

  useEffect(() => {
    if (!selected) return
    setForm({ response: selected.response || '', status: selected.status || 'Open' })
    setError('')
    setSaved('')
  }, [selectedId])

  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null)
  }, [selectedId, selected])

  const visible = tickets.filter((item) => {
    const term = query.trim().toLowerCase()
    const matchesStatus = status === 'All' || item.status === status
    const matchesTerm = !term || [
      item.subject,
      item.message,
      item.response,
      item.name,
      item.email,
    ].join(' ').toLowerCase().includes(term)
    return matchesStatus && matchesTerm
  })

  const updateSelected = async (changes, successText) => {
    if (!selected || busy) return
    setBusy(true)
    setError('')
    setSaved('')
    const result = await respondTicket(selected.id, changes)
    setBusy(false)
    if (!result?.ok) {
      setError(result?.message || 'Unable to update this ticket.')
      return
    }
    setForm({
      response: result.ticket?.response || '',
      status: result.ticket?.status || 'Open',
    })
    setSaved(successText)
  }

  const handleRespond = async (event) => {
    event.preventDefault()
    if (!selected) return
    const response = form.response.trim()
    if (response.length < 2) {
      setError('Write a response before sending it to the member.')
      return
    }
    await updateSelected({ response, status: form.status }, 'Response sent to the member.')
  }

  const handleDelete = async () => {
    if (!selected || busy) return
    if (!window.confirm(`Delete the ticket "${selected.subject}"?`)) return
    setBusy(true)
    setError('')
    setSaved('')
    const message = await removeTicket(selected.id)
    setBusy(false)
    if (message) {
      setError(message)
      return
    }
    setSelectedId(null)
    setSaved('Ticket deleted.')
  }

  return (
    <div className="page-stack">
      <div className="stat-grid stat-grid--four">
        <div className="stat-card stat-card--navy">
          <span className="stat-label">Total tickets</span>
          <strong className="stat-value">{tickets.length}</strong>
          <span className="stat-note">sent by members</span>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-label">Open</span>
          <strong className="stat-value">{open}</strong>
          <span className="stat-note">waiting for a reply</span>
        </div>
        <div className="stat-card stat-card--amber">
          <span className="stat-label">In progress</span>
          <strong className="stat-value">{inProgress}</strong>
          <span className="stat-note">being handled</span>
        </div>
        <div className="stat-card stat-card--cyan">
          <span className="stat-label">Closed</span>
          <strong className="stat-value">{closed}</strong>
          <span className="stat-note">resolved or archived</span>
        </div>
      </div>

      {selected && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>
                {selected.subject}{' '}
                <span className={`status status--${statusClass(selected.status)}`}>
                  {selected.status || 'Open'}
                </span>
              </h3>
              <p>
                From {selected.name || 'Member'}
                {selected.email ? ` · ${selected.email}` : ''}
                {' · '}{formatDate(selected.date || selected.createdAt)}
              </p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedId(null)}>
              Close view
            </button>
          </div>

          <div className="ticket-detail-message">{selected.message}</div>

          <form className="admin-form" onSubmit={handleRespond} noValidate>
            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                {statuses.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="field field--wide">
              <span>Response to member</span>
              <textarea
                rows="4"
                value={form.response}
                onChange={(event) => setForm((current) => ({ ...current, response: event.target.value }))}
                placeholder="Write the reply the member should see in their ticket…"
              />
            </label>
            <div className="form-actions field--wide">
              {error && <p className="form-error" role="alert">{error}</p>}
              {saved && <p className="form-success" role="status">{saved}</p>}
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Sending…' : 'Send response'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy}
                onClick={() => updateSelected({ status: 'Closed' }, 'Ticket closed.')}
              >
                Close ticket
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy}
                onClick={() => updateSelected({ status: 'Open' }, 'Ticket reopened.')}
              >
                Reopen
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Member tickets</h3>
            <p>Read requests from members and reply or close them.</p>
            {saved && !selected && <p className="form-success" role="status">{saved}</p>}
          </div>
          <div className="panel-tools">
            <label className="table-search">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tickets…"
                aria-label="Search tickets"
              />
            </label>
            <select
              className="filter-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter tickets by status"
            >
              {filters.map((option) => <option key={option}>{option}</option>)}
            </select>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { reloadTickets().catch(() => {}) }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>From</th>
                <th>Date</th>
                <th>Status</th>
                <th>Latest response</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <strong>{ticket.subject}</strong>
                    <br /><small>#{String(ticket.id).slice(-6)}</small>
                  </td>
                  <td>
                    {ticket.name || 'Member'}
                    {ticket.email && <><br /><small>{ticket.email}</small></>}
                  </td>
                  <td>{formatDate(ticket.date || ticket.createdAt)}</td>
                  <td>
                    <span className={`status status--${statusClass(ticket.status)}`}>
                      {ticket.status || 'Open'}
                    </span>
                  </td>
                  <td>{ticket.response ? preview(ticket.response) : '—'}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="row-action"
                      onClick={() => { setSelectedId(ticket.id); setError(''); setSaved('') }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan="6" className="empty-row">No tickets match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
