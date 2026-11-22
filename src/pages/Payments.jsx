import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { formatDate, formatPrice } from '../lib/format'

const filters = ['All', 'Completed', 'Refunded', 'Free']

export default function Payments() {
  const { payments, paymentSync, syncPayments } = useAdmin()
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  const stripeOrders = payments.filter((item) => item.source === 'stripe')
  const completed = stripeOrders.filter((item) => item.status === 'Completed')
  const revenue = completed.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const freeOrders = payments.filter((item) => item.method === 'Free')
  const refunded = payments.filter((item) => item.status === 'Refunded')

  const handleSync = async () => {
    setSyncing(true)
    setSyncError('')
    const message = await syncPayments()
    setSyncing(false)
    if (message) setSyncError(message)
  }

  const visible = payments.filter((item) => {
    const term = query.trim().toLowerCase()
    const matchesStatus = status === 'All'
      || (status === 'Free' ? item.method === 'Free' : item.status === status)
    const matchesTerm = !term
      || [
        item.id,
        item.customer,
        item.product,
        item.method,
        item.stripePaymentIntentId,
        item.stripeSessionId,
      ].join(' ').toLowerCase().includes(term)
    return matchesStatus && matchesTerm
  })

  const syncSummary = paymentSync?.stripeConfigured === false
    ? 'Stripe is not configured on the backend. No paid records can be fetched.'
    : paymentSync?.checked !== undefined
      ? `Last Stripe check: ${paymentSync.checked} sessions · ${paymentSync.paid} paid · ${paymentSync.updated} updated`
      : ''

  return (
    <div className="page-stack">
      <div className="stat-grid stat-grid--four">
        <div className="stat-card stat-card--green">
          <span className="stat-label">Revenue</span>
          <strong className="stat-value">${revenue.toFixed(2)}</strong>
          <span className="stat-note">completed Stripe payments</span>
        </div>
        <div className="stat-card stat-card--navy">
          <span className="stat-label">Paid orders</span>
          <strong className="stat-value">{stripeOrders.length}</strong>
          <span className="stat-note">from Stripe Checkout</span>
        </div>
        <div className="stat-card stat-card--cyan">
          <span className="stat-label">Free orders</span>
          <strong className="stat-value">{freeOrders.length}</strong>
          <span className="stat-note">no payment taken</span>
        </div>
        <div className="stat-card stat-card--amber">
          <span className="stat-label">Refunded</span>
          <strong className="stat-value">{refunded.length}</strong>
          <span className="stat-note">reported by Stripe</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Payment history</h3>
            <p>
              Paid rows are read from Stripe Checkout. Free orders are local records with a
              $0 total. Nothing here can be entered or edited by hand.
            </p>
            {syncSummary && <p className="form-success" role="status">{syncSummary}</p>}
            {syncError && <p className="form-error" role="alert">{syncError}</p>}
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
            <select
              className="filter-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              {filters.map((option) => <option key={option}>{option}</option>)}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Checking Stripe…' : 'Sync with Stripe'}
            </button>
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
                <th>Card</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((payment) => (
                <tr key={payment.id}>
                  <td><strong>{payment.id}</strong></td>
                  <td>{payment.customer}</td>
                  <td>{payment.product}</td>
                  <td>{payment.method}</td>
                  <td>
                    {payment.cardBrand && payment.cardLast4
                      ? `${payment.cardBrand} •••• ${payment.cardLast4}`
                      : '—'}
                  </td>
                  <td>{formatPrice(payment.amount)}</td>
                  <td>{formatDate(payment.date)}</td>
                  <td>
                    <span className={`status status--${String(payment.status).toLowerCase()}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    {payment.source === 'stripe'
                      ? `Stripe ${String(payment.stripeSessionId || '').slice(0, 16)}…`
                      : 'Free order'}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan="9" className="empty-row">No Stripe payments or free orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
