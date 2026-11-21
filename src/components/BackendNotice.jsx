import { useEffect, useState } from 'react'
import { BACKEND_ERROR_EVENT } from '../lib/api'
import { useAdmin } from '../context/AdminContext'

export default function BackendNotice() {
  const { backendError } = useAdmin()
  const [eventMessage, setEventMessage] = useState('')

  useEffect(() => {
    const onError = (event) => setEventMessage(
      event.detail?.message || 'The backend is unavailable right now.',
    )
    window.addEventListener(BACKEND_ERROR_EVENT, onError)
    return () => window.removeEventListener(BACKEND_ERROR_EVENT, onError)
  }, [])

  const message = backendError || eventMessage
  if (!message) return null

  return (
    <div className="backend-notice" role="alert">
      <strong>Backend unavailable</strong>
      <span>{message}</span>
    </div>
  )
}
