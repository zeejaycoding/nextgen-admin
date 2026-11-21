import { useEffect, useRef, useState } from 'react'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { DEFAULT_SETTINGS } from '../lib/site-settings'

/** Resize an attached logo so it fits comfortably in localStorage. */
function attachLogo(file, maxSize = 600, quality = 0.8) {
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

export default function Settings() {
  const { name, tagline, logo, saveSettings } = useSiteSettings()
  const [form, setForm] = useState({ name, tagline, logo })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const fileInput = useRef(null)

  useEffect(() => setForm({ name, tagline, logo }), [name, tagline, logo])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
    setSaved('')
  }

  const handleLogo = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const dataUrl = await attachLogo(file)
      setForm((current) => ({ ...current, logo: dataUrl }))
      setError('')
      setSaved('')
    } catch {
      setError('Could not read that image. Try another file.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.name.trim().length < 2) return setError('Website name needs at least 2 characters.')
    const next = {
      name: form.name.trim(),
      tagline: form.tagline.trim() || DEFAULT_SETTINGS.tagline,
      logo: form.logo,
    }

    setError('')
    setSaved('')
    const message = await saveSettings(next)
    if (message) {
      setError(message)
      return
    }

    setForm(next)
    setSaved('Site name and logo updated. The public site is synced automatically.')
  }

  const handleReset = () => {
    saveSettings(DEFAULT_SETTINGS)
    setForm(DEFAULT_SETTINGS)
    setError('')
    setSaved('Default branding restored.')
  }

  return (
    <div className="page-stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Site branding</h3>
            <p>Change the website name, tagline and logo. Updates appear in this panel and on the public site.</p>
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <label className="field field--wide">
            <span>Website name</span>
            <input type="text" value={form.name} onChange={update('name')} placeholder="DOMIGEN" />
            <span className="field-hint">Shown in the header, footer, browser title and admin panel.</span>
          </label>

          <label className="field field--wide">
            <span>Tagline</span>
            <input type="text" value={form.tagline} onChange={update('tagline')} placeholder="Gaming . accounts . tools" />
          </label>

          <div className="field field--wide">
            <span>Logo</span>
            <div className="attach-row">
              <input ref={fileInput} type="file" accept="image/*" onChange={handleLogo} className="hidden-file" aria-label="Attach website logo" />
              <button type="button" className="btn btn-ghost btn-sm attach-btn" onClick={() => fileInput.current?.click()}>
                <Paperclip /> {form.logo ? 'Change logo' : 'Attach logo'}
              </button>
              {form.logo && <img className="attach-preview" src={form.logo} alt="Logo preview" />}
              {form.logo && (
                <button type="button" className="attach-remove" onClick={() => { setForm((c) => ({ ...c, logo: '' })); setSaved('') }} aria-label="Remove logo">×</button>
              )}
            </div>
            <span className="field-hint">Transparent PNG or SVG works best. Leave empty to use the text wordmark.</span>
          </div>

          <div className="form-actions field--wide">
            {error && <p className="form-error" role="alert">{error}</p>}
            {saved && <p className="form-success" role="status">{saved}</p>}
            <button type="submit" className="btn btn-primary">Save branding <span className="arrow">→</span></button>
            <button type="button" className="btn btn-ghost" onClick={handleReset}>Restore default</button>
          </div>
        </form>
      </div>
    </div>
  )
}
