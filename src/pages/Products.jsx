import { useState } from 'react'
import { formatDate, formatPrice, useAdmin } from '../context/AdminContext'

const initialForm = {
  title: '',
  game: 'MW3',
  category: 'Mod',
  price: '',
  badge: '',
  contact: '',
  published: new Date().toISOString().slice(0, 10),
  description: '',
}

export default function Products() {
  const { products, addProduct, removeProduct } = useAdmin()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [query, setQuery] = useState('')

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
    setSaved('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (form.title.trim().length < 3) return setError('Product title needs at least 3 characters.')
    if (form.price === '' || Number(form.price) < 0) return setError('Enter a valid price (0 for free).')

    addProduct({
      title: form.title.trim(),
      game: form.game,
      category: form.category,
      price: Number(form.price),
      badge: form.badge,
      contact: form.contact.trim() || 'NextGen Team',
      published: form.published,
      description: form.description.trim(),
    })

    setForm(initialForm)
    setError('')
    setSaved(`"${form.title.trim()}" was added.`)
  }

  const visible = products.filter((product) => {
    const term = query.trim().toLowerCase()
    return !term || `${product.title} ${product.game} ${product.category}`.toLowerCase().includes(term)
  })

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Add a product</h3>
            <p>Create a new release for the NextGen catalogue.</p>
          </div>
        </div>

        <form className="admin-form product-form" onSubmit={handleSubmit} noValidate>
          <label className="field field--wide">
            <span>Product title</span>
            <input type="text" value={form.title} onChange={update('title')} placeholder="e.g. MW3 Phantom" />
          </label>

          <label className="field">
            <span>Game</span>
            <select value={form.game} onChange={update('game')}>
              <option>MW3</option>
              <option>BO2</option>
              <option>MW2</option>
              <option>Destiny</option>
              <option>Other</option>
            </select>
          </label>

          <label className="field">
            <span>Category</span>
            <select value={form.category} onChange={update('category')}>
              <option>Mod</option>
              <option>Tool</option>
              <option>Script</option>
              <option>Menu</option>
              <option>Other</option>
            </select>
          </label>

          <label className="field">
            <span>Price (€)</span>
            <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} placeholder="0.00" />
          </label>

          <label className="field">
            <span>Badge</span>
            <select value={form.badge} onChange={update('badge')}>
              <option value="">None</option>
              <option>New</option>
              <option>Featured</option>
              <option>Free</option>
            </select>
          </label>

          <label className="field">
            <span>Published</span>
            <input type="date" value={form.published} onChange={update('published')} />
          </label>

          <label className="field">
            <span>Contact</span>
            <input type="text" value={form.contact} onChange={update('contact')} placeholder="NextGen Team" />
          </label>

          <label className="field field--wide">
            <span>Description</span>
            <textarea rows="3" value={form.description} onChange={update('description')} placeholder="What does this product do?" />
          </label>

          <div className="form-actions field--wide">
            {error && <p className="form-error" role="alert">{error}</p>}
            {saved && <p className="form-success" role="status">{saved}</p>}
            <button type="submit" className="btn btn-primary">Add product <span className="arrow">→</span></button>
            <button type="button" className="btn btn-ghost" onClick={() => { setForm(initialForm); setError(''); setSaved('') }}>Clear</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Catalogue</h3>
            <p>{products.length} {products.length === 1 ? 'product' : 'products'} in total.</p>
          </div>
          <label className="table-search">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
            />
          </label>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Game</th>
                <th>Category</th>
                <th>Price</th>
                <th>Badge</th>
                <th>Published</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.title}</strong></td>
                  <td>{product.game}</td>
                  <td>{product.category}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{product.badge ? <span className="tag">{product.badge}</span> : <span className="muted">—</span>}</td>
                  <td>{formatDate(product.published)}</td>
                  <td>
                    <button type="button" className="row-action row-action--danger" onClick={() => removeProduct(product.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan="7" className="empty-row">No products match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
