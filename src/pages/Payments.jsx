import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { formatDate, formatPrice } from '../lib/format'

const filters = ['All', 'Completed', 'Pending', 'Delayed', 'Refunded']
const statuses = ['Pending', 'Delayed', 'Completed', 'Refunded']
const methods = ['Manual', 'Card', 'Apple Pay', 'Free']

const initialForm = {
  customer: '',
  product: '',
  amount: '',
  method: 'Manual',
  status: 'Pending',
  date: new Date().toISOString().slice(0, 10),
}

export default function Payments() {
  const { payments, updatePayment, addPayment, removePayment } = useAdmin()
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const completed = payments.filter((item) => item.status === 'Completed')
  const revenue = completed.reduce((sum, item) => sum + Number(item.amount), 0)
  const pending = payments.filter((item) => item.status === 'Pending').length
  const delayed = payments.filter((item) => item.status === 'Delayed').length
  const refunded = payments.filter((item) => item.status === 'Refunded').length

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
    setSaved('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.customer.trim()) return setError('Enter a customer name or email.')
    if (!form.product.trim()) return setError('Enter a product or order description.')
    if (form.amount === '' || Number(form.amount) < 0 || !Number.isFinite(Number(form.amount))) {
      return setError('Enter a valid amount (0 for free).')
    }

    setSubmitting(true)
    const message = await addPayment({
      customer: form.customer.trim(),
      product: form.product.trim(),
      amount: Number(form.amount),
      method: form.method,
      status: form.status,
      date: form.date,
    })
    setSubmitting(false)

    if (message) {
      setError(message)
      return
    }

    setForm(initialForm)
    setError('')
    setSaved('Order added successfully.')
  }

  const handleDelete = (payment) => {
    if (!window.confirm(`Delete order ${payment.id}?`)) return
    removePayment(payment.id)
  }

  const visible = payments.filter((item) => {
    const term = query.trim().toLowerCase()
    const matchesStatus = status === 'All' || item.status === status
    const matchesTerm = !term || `${item.id} ${item.customer} ${item.product} ${item.method}`.toLowerCase().includes(term)
    return matchesStatus && matchesTerm
  })

  return (
    <div className="page-stack">
      <div className="stat-grid stat-grid--four">
        <div className="stat-card stat-card--green">
          <span className="stat-label">Revenue</span>
          <strong className="stat-value">{formatPrice(revenue)}</strong>
          <span className="stat-note">completed payments</span>
        </div>
        <div className="stat-card stat-card--navy">
          <span className="stat-label">Orders</span>
          <strong className="stat-value">{payments.length}</strong>
          <span className="stat-note">total transactions</span>
        </div>
        <div className="stat-card stat-card--amber">
          <span className="stat-label">Awaiting</span>
          <strong className="stat-value">{pending + delayed}</strong>
          <span className="stat-note">{pending} pending · {delayed} delayed</span>
        </div>
        <div className="stat-card stat-card--cyan">
          <span className="stat-label">Refunded</span>
          <strong className="stat-value">{refunded}</strong>
          <span className="stat-note">sent back</span>
        </div>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Add an order</h3>
              <p>Record a manual payment or hold it as pending/delayed for later review.</p>
            </div>
          </div>
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Customer</span>
              <input type="text" value={form.customer} onChange={update('customer')} placeholder="Name or email" />
            </label>
            <label className="field">
              <span>Product / description</span>
              <input type="text" value={form.product} onChange={update('product')} placeholder="e.g. MW3 Phantom" />
            </label>
            <label className="field">
              <span>Amount ($)</span>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={update('amount')} placeholder="0.00" />
            </label>
            <label className="field">
              <span>Method</span>
              <select value={form.method} onChange={update('method')}>
                {methods.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={update('status')}>
                {statuses.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Date</span>
              <input type="date" value={form.date} onChange={update('date')} />
            </label>
            <div className="form-actions">
              {error && <p className="form-error" role="alert">{error}</p>}
              {saved && <p className="form-success" role="status">{saved}</p>}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add order'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Payment history</h3>
            <p>Review orders, change their status, or delete records.</p>
            {saved && <p className="form-success" role="status">{saved}</p>}
          </div>
          <div className="panel-tools">
            <label className="table-search">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search orders…"
                aria-label="Search payments"
              />
            </label>
            <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
              {filters.map((option) => <option key={option}>{option}</option>)}
            </select>
            {!showForm && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add order</button>
            )}
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((payment) => (
                <tr key={payment.id}>
                  <td><strong>{payment.id}</strong></td>
                  <td>{payment.customer}</td>
                  <td>{payment.product}</td>
                  <td>{payment.method}</td>
                  <td>{formatPrice(payment.amount)}</td>
                  <td>{formatDate(payment.date)}</td>
                  <td>
                    <select
                      className={`status-select status--${payment.status.toLowerCase()}`}
                      value={payment.status}
                      onChange={(event) => updatePayment(payment.id, event.target.value)}
                      aria-label={`Status for ${payment.id}`}
                    >
                      {statuses.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="row-action row-action--danger"
                      onClick={() => handleDelete(payment)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan="8" className="empty-row">No payments match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
