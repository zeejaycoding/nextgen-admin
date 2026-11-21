import { io } from 'socket.io-client'

export const BACKEND_ERROR_EVENT = 'domigen:admin-backend-error'

function reportBackendError(message) {
  window.dispatchEvent(new CustomEvent(BACKEND_ERROR_EVENT, { detail: { message } }))
}

const configured = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:4000' : '')

export const API_BASE = String(configured).replace(/\/$/, '')

export function apiUrl(path) {
  const suffix = path.startsWith('/api/') || path === '/api' ? path : `/api${path}`
  return `${API_BASE}${suffix}`
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch(path, { token, ...options } = {}) {
  let response
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token === undefined ? getAdminToken() : token),
        ...options.headers,
      },
    })
  } catch {
    const message = 'Unable to reach the server. Check that the backend is running.'
    reportBackendError(message)
    const error = new Error(message)
    error.status = 0
    throw error
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    /* Some endpoints return an empty body. */
  }

  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status}).`
    if (response.status >= 500) reportBackendError(message)
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}

export function createSocket(auth = {}) {
  return io(API_BASE || window.location.origin, {
    autoConnect: false,
    transports: ['polling', 'websocket'],
    auth,
  })
}

export const ADMIN_TOKEN_KEY = 'domigen-admin-token'

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function adminLogin(email, password) {
  const data = await apiFetch('/admin/login', {
    method: 'POST',
    token: '',
    body: JSON.stringify({ email, password }),
  })
  setAdminToken(data.token)
  return data
}
