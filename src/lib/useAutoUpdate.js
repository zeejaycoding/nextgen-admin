import { useEffect } from 'react'

/**
 * Reload the admin panel automatically when a newer deployment is live.
 * Open tabs otherwise keep the old build until the user refreshes manually.
 */
export function useAutoUpdate() {
  useEffect(() => {
    if (!import.meta.env.PROD) return undefined

    let active = true
    let baseline = ''

    const readVersion = async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!response.ok) throw new Error('Version check failed.')
      const data = await response.json()
      return String(data.version || '')
    }

    readVersion()
      .then((version) => { if (active) baseline = version })
      .catch(() => {})

    const timer = setInterval(async () => {
      if (!active || document.visibilityState !== 'visible') return

      const focused = document.activeElement
      if (focused && ['INPUT', 'TEXTAREA', 'SELECT'].includes(focused.tagName)) return

      try {
        const version = await readVersion()
        if (!active || !version) return
        if (!baseline) {
          baseline = version
          return
        }
        if (version !== baseline) window.location.reload()
      } catch {
        /* Never reload because of a transient network error. */
      }
    }, 30000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])
}
