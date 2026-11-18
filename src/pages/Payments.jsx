import { useState } from 'react'
import { formatDate, formatPrice, useAdmin } from '../context/AdminContext'

const filters = ['All', 'Completed', 'Pending', 'Refunded']

export default function Payments() {
  const { payments, updatePayment } = useAdmin()
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')

  const completed = payments.filter((item) => item.status === 'Completed')
  const revenue = completed.reduce((sum, item) => sum + Number(item.amount), 0)
  const pending = payments.filter((item) => item.status === 'Pending').length
  const refunded = payments.filter((item) => item.status === 'Refunded').length

  const visible = payments.filter((item) => {
    const term = query.trim().toLowerCase()
    const matchesStatus = status === 'All' || item.status === status
    const matchesTerm = !term || `${item.id} ${item.customer} ${item.product}`.toLowerCase().includes(term)
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
          <span className="stat-label">Pending</span>
          <strong className="stat-value">{pending}</strong>
          <span className="stat-note">awaiting approval</span>
        </div>
        <div className="stat-card stat-card--cyan">
          <span className="stat-label">Refunded</span>
          <strong className="stat-value">{refunded}</strong>
          <span className="stat-note">sent back</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Payment history</h3>
            <p>Review orders and update their status.</p>
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
                      <option>Completed</option>
                      <option>Pending</option>
                      <option>Refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan="7" className="empty-row">No payments match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
