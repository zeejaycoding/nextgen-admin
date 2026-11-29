import { Link } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { formatDate, formatPrice } from '../lib/format'

export default function Dashboard() {
  const { products, payments, users, tickets } = useAdmin()

  const revenue = payments
    .filter((item) => item.source === 'stripe' && item.status === 'Completed')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const stats = [
    { label: 'Products', value: products.length, note: 'in catalogue', tone: 'cyan' },
    { label: 'Revenue', value: `$${revenue.toFixed(2)}`, note: 'completed Stripe payments', tone: 'green' },
    { label: 'Users', value: users.length, note: 'registered', tone: 'navy' },
    { label: 'Orders', value: payments.length, note: 'Stripe + free orders', tone: 'amber' },
  ]

  return (
    <div className="page-stack">
      <div className="page-intro">
        <div>
          <h2>Overview</h2>
          <p>A quick look at what is happening across DOMIGEN.</p>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <div className={`stat-card stat-card--${stat.tone}`} key={stat.label}>
            <span className="stat-label">{stat.label}</span>
            <strong className="stat-value">{stat.value}</strong>
            <span className="stat-note">{stat.note}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Recent payments</h3>
            <p>Latest Stripe Checkout payments and free orders.</p>
          </div>
          <Link to="/admin/payments" className="btn btn-outline btn-sm">View all</Link>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 5).map((payment) => (
                <tr key={payment.id}>
                  <td><strong>{payment.id}</strong></td>
                  <td>{payment.customer}</td>
                  <td>{payment.product}</td>
                  <td>{formatPrice(payment.amount)}</td>
                  <td><span className={`status status--${payment.status.toLowerCase()}`}>{payment.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Quick actions</h3>
            <p>Jump straight to a management screen.</p>
          </div>
        </div>
        <div className="quick-actions">
          <Link to="/admin/products" className="quick-card">
            <strong>Add a product</strong>
            <span>Create a new release and set its price.</span>
          </Link>
          <Link to="/admin/payments" className="quick-card">
            <strong>Manage payments</strong>
            <span>Review real Stripe records and free orders.</span>
          </Link>
          <Link to="/admin/tickets" className="quick-card">
            <strong>Answer tickets</strong>
            <span>{tickets.filter((item) => item.status === 'Open').length} open member requests waiting.</span>
          </Link>
          <Link to="/admin/users" className="quick-card">
            <strong>Manage users</strong>
            <span>Add members and control access.</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
