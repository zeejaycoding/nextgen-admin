import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export const SETTINGS_KEY = 'domigen-site-settings'

export const DEFAULT_SETTINGS = {
  name: 'DOMIGEN',
  tagline: 'Gaming . accounts . tools',
  logo: '/images/domigen-logo.jpeg',
}

const APPLY = 'DOMIGEN_APPLY_SETTINGS'
const SETTINGS = 'DOMIGEN_SETTINGS'

const SiteSettingsContext = createContext(null)

function normalize(value = {}) {
  let logo = typeof value.logo === 'string' ? value.logo : DEFAULT_SETTINGS.logo
  if (logo === '/images/domigen-logo.png' || logo === '/images/domigen-logo.svg') logo = DEFAULT_SETTINGS.logo
  return {
    name: String(value.name ?? DEFAULT_SETTINGS.name).slice(0, 60),
    tagline: String(value.tagline ?? DEFAULT_SETTINGS.tagline).slice(0, 80),
    logo,
  }
}

function read() {
  try {
    return normalize(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

const configuredFrontend = import.meta.env.VITE_FRONTEND_URL || (import.meta.env.DEV ? 'http://127.0.0.1:5173' : '')

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(read)
  const bridge = useRef(null)
  const latest = useRef(settings)
  latest.current = settings

  const push = useCallback((next) => {
    bridge.current?.contentWindow?.postMessage({ type: APPLY, settings: next }, '*')
  }, [])

  const saveSettings = useCallback((next) => {
    const clean = normalize(next)
    setSettings(clean)
    latest.current = clean
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(clean))
    } catch {
      /* storage can be unavailable — settings still work in memory */
    }
    push(clean)
  }, [push])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === SETTINGS_KEY) {
        try {
          setSettings(normalize(JSON.parse(event.newValue || '{}')))
        } catch {
          /* ignore malformed settings */
        }
      }
    }
    const onMessage = (event) => {
      if (event.data?.type === SETTINGS && event.data.settings) {
        setSettings(normalize(event.data.settings))
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  useEffect(() => {
    document.title = `${settings.name} Admin`
    const icon = document.querySelector('link[rel="icon"]')
    if (icon && settings.logo) icon.href = settings.logo
  }, [settings.name, settings.logo])

  const useBridge = configuredFrontend && new URL(configuredFrontend, window.location.href).origin !== window.location.origin

  return (
    <SiteSettingsContext.Provider value={{ ...settings, settings, saveSettings }}>
      {children}
      {useBridge && (
        <iframe
          ref={bridge}
          className="settings-bridge"
          src={`${configuredFrontend.replace(/\/$/, '')}/site-settings-bridge.html`}
          title="Site settings sync"
          onLoad={() => push(latest.current)}
        />
      )}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (!context) throw new Error('useSiteSettings must be used inside SiteSettingsProvider')
  return context
}
