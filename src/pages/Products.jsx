import { useEffect, useRef, useState } from 'react'
import { formatDate, formatPrice, useAdmin } from '../context/AdminContext'

const today = new Date().toISOString().slice(0, 10)

const GAMES = ['MW19', 'CW', 'MW2', 'MW3', 'Bo6', 'Bo7', 'MW4', 'GTA VI']

const initialForm = {
  title: '',
  game: 'MW3',
  category: 'Mod',
  price: '',
  badge: '',
  contact: '',
  published: today,
  version: '',
  image: '',
  images: [],
  video: '',
  features: '',
  description: '',
}

const toLines = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean)

/** Resize an attached image so it fits comfortably in localStorage. */
function attachImage(file, maxSize = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function Paperclip() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.5 6.5v9a4.5 4.5 0 0 1-9 0V6a3 3 0 0 1 6 0v9a1.5 1.5 0 0 1-3 0V7h1.5v8a1.5 1.5 0 0 0 3 0V6a3 3 0 0 0-6 0v9.5a4.5 4.5 0 0 0 9 0v-9h1.5Z" />
    </svg>
  )
}

export default function Products() {
  const { products, addProduct, updateProduct, removeProduct } = useAdmin()
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [query, setQuery] = useState('')
  const [viewer, setViewer] = useState(null)
  const mainInput = useRef(null)
  const shotsInput = useRef(null)

  useEffect(() => {
    if (!viewer) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setViewer(null)
      if (event.key === 'ArrowRight') setViewer((current) => ({ ...current, index: (current.index + 1) % current.images.length }))
      if (event.key === 'ArrowLeft') setViewer((current) => ({ ...current, index: (current.index - 1 + current.images.length) % current.images.length }))
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [viewer])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
    setSaved('')
  }

  const handleMain = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const dataUrl = await attachImage(file)
      setForm((current) => ({ ...current, image: dataUrl }))
      setError('')
      setSaved('')
    } catch {
      setError('Could not read that image. Try another file.')
    }
  }

  const handleShots = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    try {
      const images = await Promise.all(files.map((file) => attachImage(file)))
      setForm((current) => ({ ...current, images: [...current.images, ...images] }))
      setError('')
      setSaved('')
    } catch {
      setError('Could not read one of those images.')
    }
  }

  const removeShot = (index) => setForm((current) => ({
    ...current,
    images: current.images.filter((_, i) => i !== index),
  }))

  const resetForm = () => {
    setEditingId(null)
    setForm(initialForm)
    setError('')
    setSaved('')
  }

  const handleDelete = (id) => {
    if (editingId === id) resetForm()
    removeProduct(id)
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setForm({
      title: product.title || '',
      game: product.game || 'MW3',
      category: product.category || 'Mod',
      price: product.price ?? '',
      badge: product.badge || '',
      contact: product.contact || '',
      published: product.published || today,
      version: product.version || '',
      image: product.image || '',
      images: [...(product.images || [])],
      video: product.video || '',
      features: (product.features || []).join('\n'),
      description: product.description || '',
    })
    setError('')
    setSaved('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (form.title.trim().length < 3) return setError('Product title needs at least 3 characters.')
    if (form.price === '' || Number(form.price) < 0) return setError('Enter a valid price (0 for free).')

    const payload = {
      title: form.title.trim(),
      game: form.game,
      category: form.category,
      price: Number(form.price),
      badge: form.badge,
      contact: form.contact.trim() || 'NextGen Update Team',
      published: form.published,
      version: form.version.trim() || '1.0',
      description: form.description.trim(),
      image: form.image,
      images: form.images,
      video: form.video.trim(),
      features: toLines(form.features),
    }

    const wasEditing = editingId !== null
    if (wasEditing) {
      updateProduct(editingId, payload)
    } else {
      addProduct(payload)
    }

    setEditingId(null)
    setForm(initialForm)
    setError('')
    setSaved(`"${payload.title}" was ${wasEditing ? 'updated' : 'added'}.`)
  }

  const visible = products.filter((product) => {
    const term = query.trim().toLowerCase()
    return !term || `${product.title} ${product.game} ${product.category}`.toLowerCase().includes(term)
  })

  const openViewer = (product) => {
    const images = [...new Set([product.image, ...(product.images || [])].filter(Boolean))]
    if (images.length) setViewer({ images, index: 0, title: product.title })
  }

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>{editingId !== null ? 'Edit product' : 'Add a product'}</h3>
            <p>
              {editingId !== null
                ? 'Update any field below and save your changes.'
                : 'Create a new release for the NextGen Update catalogue.'}
            </p>
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
              {GAMES.map((game) => <option key={game}>{game}</option>)}
              {!GAMES.includes(form.game) && <option>{form.game}</option>}
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
            <span>Price ($)</span>
            <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} placeholder="0.00" />
          </label>

          <label className="field">
            <span>Version</span>
            <input type="text" value={form.version} onChange={update('version')} placeholder="e.g. 2.22" />
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
            <input type="text" value={form.contact} onChange={update('contact')} placeholder="NextGen Update Team" />
          </label>

          <div className="field field--wide">
            <span>Main image</span>
            <div className="attach-row">
              <input ref={mainInput} type="file" accept="image/*" onChange={handleMain} className="hidden-file" aria-label="Attach main image" />
              <button type="button" className="btn btn-ghost btn-sm attach-btn" onClick={() => mainInput.current?.click()}>
                <Paperclip /> {form.image ? 'Change image' : 'Attach image'}
              </button>
              {form.image && <img className="attach-preview" src={form.image} alt="Main image preview" />}
              {form.image && (
                <button type="button" className="attach-remove" onClick={() => setForm((c) => ({ ...c, image: '' }))} aria-label="Remove main image">×</button>
              )}
            </div>
            <span className="field-hint">Opens your file explorer. The big image on the product page.</span>
          </div>

          <div className="field field--wide">
            <span>Extra screenshots</span>
            <div className="attach-row">
              <input ref={shotsInput} type="file" accept="image/*" multiple onChange={handleShots} className="hidden-file" aria-label="Attach screenshots" />
              <button type="button" className="btn btn-ghost btn-sm attach-btn" onClick={() => shotsInput.current?.click()}>
                <Paperclip /> Add screenshots
              </button>
              <span className="attach-count">{form.images.length} attached</span>
            </div>
            {form.images.length > 0 && (
              <div className="attach-thumbs">
                {form.images.map((src, index) => (
                  <div className="attach-thumb" key={index}>
                    <img src={src} alt={`Screenshot ${index + 1}`} />
                    <button type="button" onClick={() => removeShot(index)} aria-label={`Remove screenshot ${index + 1}`}>×</button>
                  </div>
                ))}
              </div>
            )}
            <span className="field-hint">Attach several images at once. They appear in the gallery.</span>
          </div>

          <label className="field field--wide">
            <span>YouTube video link</span>
            <input type="text" value={form.video} onChange={update('video')} placeholder="https://www.youtube.com/watch?v=…" />
            <span className="field-hint">Optional. Embedded on the product page.</span>
          </label>

          <label className="field field--wide">
            <span>Description</span>
            <textarea rows="3" value={form.description} onChange={update('description')} placeholder="What does this product do?" />
          </label>

          <label className="field field--wide">
            <span>Features</span>
            <textarea rows="2" value={form.features} onChange={update('features')} placeholder="One feature per line" />
            <span className="field-hint">Optional. Displayed as a checklist.</span>
          </label>

          <div className="form-actions field--wide">
            {error && <p className="form-error" role="alert">{error}</p>}
            {saved && <p className="form-success" role="status">{saved}</p>}
            <button type="submit" className="btn btn-primary">
              {editingId !== null ? 'Save changes' : 'Add product'} <span className="arrow">→</span>
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              {editingId !== null ? 'Cancel' : 'Clear'}
            </button>
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
                <th>Media</th>
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
              {visible.map((product) => {
                const cover = product.image || product.images?.[0]
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="cell-media">
                        {cover ? (
                          <button
                            type="button"
                            className="cell-media-button"
                            onClick={() => openViewer(product)}
                            aria-label={`Open images for ${product.title}`}
                          >
                            <img className="cell-thumb" src={cover} alt="" />
                          </button>
                        ) : <span className="muted">—</span>}
                        {product.video && <span className="video-dot" title="Has video">▶</span>}
                      </div>
                    </td>
                    <td><strong>{product.title}</strong></td>
                    <td>{product.game}</td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.badge ? <span className="tag">{product.badge}</span> : <span className="muted">—</span>}</td>
                    <td>{formatDate(product.published)}</td>
                    <td className="actions-cell">
                      <button type="button" className="row-action" onClick={() => startEdit(product)}>
                        Edit
                      </button>
                      <button type="button" className="row-action row-action--danger" onClick={() => handleDelete(product.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr><td colSpan="8" className="empty-row">No products match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewer && (
        <div className="admin-lightbox" role="dialog" aria-modal="true" aria-label={`${viewer.title} images`} onClick={() => setViewer(null)}>
          <button type="button" className="admin-lightbox-close" onClick={() => setViewer(null)} aria-label="Close image">×</button>
          {viewer.images.length > 1 && (
            <button
              type="button"
              className="admin-lightbox-nav admin-lightbox-nav--prev"
              onClick={(event) => { event.stopPropagation(); setViewer((current) => ({ ...current, index: (current.index - 1 + current.images.length) % current.images.length })) }}
              aria-label="Previous image"
            >‹</button>
          )}
          <img
            className="admin-lightbox-image"
            src={viewer.images[viewer.index]}
            alt={viewer.title}
            onClick={(event) => event.stopPropagation()}
          />
          {viewer.images.length > 1 && (
            <button
              type="button"
              className="admin-lightbox-nav admin-lightbox-nav--next"
              onClick={(event) => { event.stopPropagation(); setViewer((current) => ({ ...current, index: (current.index + 1) % current.images.length })) }}
              aria-label="Next image"
            >›</button>
          )}
          <span className="admin-lightbox-caption">{viewer.title} · {viewer.index + 1}/{viewer.images.length}</span>
        </div>
      )}
    </div>
  )
}
