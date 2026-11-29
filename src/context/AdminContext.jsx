import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  apiFetch,
  clearAdminToken,
  createSocket,
  getAdminToken,
  setAdminToken,
} from '../lib/api'

const KEYS = {
  products: 'nextgen-admin-products',
  payments: 'nextgen-admin-payments',
  users: 'nextgen-admin-users',
  tickets: 'nextgen-admin-tickets',
}

const ADMIN_IDENTITY_KEY = 'nextgen-admin-auth'

function clearAdminIdentity() {
  try {
    localStorage.removeItem(ADMIN_IDENTITY_KEY)
  } catch {
    /* storage can be unavailable in private browsing */
  }
}

function readAdminIdentity() {
  try {
    const value = JSON.parse(localStorage.getItem(ADMIN_IDENTITY_KEY) || 'null')
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage can be unavailable in private browsing — the panel still works in memory */
  }
}

function errorMessage(error) {
  if (error?.status) return error.message || 'Request failed.'
  return 'Unable to reach the server. Check that the backend is running.'
}

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [authed, setAuthed] = useState(() => Boolean(getAdminToken()))
  const [admin, setAdmin] = useState(readAdminIdentity)
  const [products, setProducts] = useState([])
  const [payments, setPayments] = useState([])
  const [paymentSync, setPaymentSync] = useState(null)
  const [users, setUsers] = useState([])
  const [tickets, setTickets] = useState([])
  const [apiError, setApiError] = useState('')
  const [socketError, setSocketError] = useState('')

  const markApiError = (error) => {
    const message = errorMessage(error)
    if (!error?.status || error.status >= 500) setApiError(message)
    if (error?.status === 401) {
      clearAdminToken()
      clearAdminIdentity()
      setAdmin(null)
      setAuthed(false)
      setApiError('Your session expired. Please sign in again.')
    }
    return message
  }

  const backendError = apiError || socketError

  useEffect(() => save(KEYS.products, products), [products])
  useEffect(() => save(KEYS.payments, payments), [payments])
  useEffect(() => save(KEYS.users, users), [users])
  useEffect(() => save(KEYS.tickets, tickets), [tickets])

  useEffect(() => {
    if (!authed || !getAdminToken()) return undefined

    let active = true

    apiFetch('/admin/bootstrap')
      .then((data) => {
        if (!active) return
        setApiError('')
        if (Array.isArray(data?.products)) setProducts(data.products)
        if (Array.isArray(data?.payments)) setPayments(data.payments)
        if (Array.isArray(data?.users)) setUsers(data.users)
        if (Array.isArray(data?.tickets)) setTickets(data.tickets)
        setPaymentSync(data?.paymentSync || null)
      })
      .catch((error) => {
        /* Never show stale or local-only records as if they were live data. */
        if (!active) return
        setProducts([])
        setPayments([])
        setPaymentSync(null)
        setUsers([])
        setTickets([])
        markApiError(error)
      })

    const socket = createSocket({ token: getAdminToken() })
    socket.on('connect', () => setSocketError(''))
    socket.on('connect_error', () => setSocketError(
      'Real-time updates are unavailable. Changes may not appear until you refresh.',
    ))
    socket.on('products', (list) => Array.isArray(list) && setProducts(list))
    socket.on('payments', (list) => Array.isArray(list) && setPayments(list))
    socket.on('users', (list) => Array.isArray(list) && setUsers(list))
    socket.on('tickets', (list) => Array.isArray(list) && setTickets(list))
    socket.connect()

    return () => {
      active = false
      socket.disconnect()
    }
  }, [authed])

  const value = useMemo(() => {
    const restricted = admin?.scope === 'products'
    const reloadProducts = async () => setProducts(await apiFetch('/products'))
    const syncPayments = async () => {
      try {
        const data = await apiFetch('/admin/payments/sync', { method: 'POST' })
        setPayments(Array.isArray(data?.payments) ? data.payments : [])
        setPaymentSync(data)
        return null
      } catch (error) {
        return markApiError(error)
      }
    }
    const reloadUsers = async () => setUsers(await apiFetch('/admin/users'))
    const reloadTickets = async () => setTickets(await apiFetch('/admin/tickets'))

    const login = async (email, password) => {
      const cleanEmail = String(email).trim()
      if (!cleanEmail || !password) return 'Enter your email and password.'

      let data
      try {
        data = await apiFetch('/admin/login', {
          method: 'POST',
          token: '',
          body: JSON.stringify({ email: cleanEmail, password }),
        })
      } catch (error) {
        // A rejected sign-in is shown on the form; it must not be treated as a
        // session expiry or clear any unrelated local state.
        if (error?.status === 401 || error?.status === 403) {
          return error.message || 'Invalid email or password.'
        }
        return markApiError(error)
      }

      const account = data.admin || { email: cleanEmail }
      setAdminToken(data.token)
      setAdmin(account)
      try {
        localStorage.setItem(ADMIN_IDENTITY_KEY, JSON.stringify(account))
      } catch {
        /* storage can be unavailable in private browsing */
      }
      setAuthed(true)
      return { redirectTo: account.scope === 'products' ? '/admin/products' : '/admin' }
    }

    const logout = () => {
      clearAdminToken()
      clearAdminIdentity()
      setAdmin(null)
      setAuthed(false)
    }

    const addProduct = async (product) => {
      try {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(product),
        })
        await reloadProducts()
        return null
      } catch (error) {
        return markApiError(error)
      }
    }

    const updateProduct = async (id, patch) => {
      try {
        await apiFetch(`/products/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(patch),
        })
        await reloadProducts()
        return null
      } catch (error) {
        return markApiError(error)
      }
    }

    const removeProduct = async (id) => {
      try {
        await apiFetch(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
        await reloadProducts()
        return null
      } catch (error) {
        return markApiError(error)
      }
    }

    const addUser = async (user) => {
      try {
        await apiFetch('/admin/users', {
          method: 'POST',
          body: JSON.stringify(user),
        })
        await reloadUsers()
        return null
      } catch (error) {
        return markApiError(error)
      }
    }

    const updateUser = async (id, changes) => {
      try {
        await apiFetch(`/admin/users/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(changes),
        })
        await reloadUsers()
        return null
      } catch (error) {
        return markApiError(error)
      }
    }

    const toggleUser = async (id) => {
      const target = users.find((item) => String(item.id) === String(id))
      const status = target?.status === 'Active' ? 'Suspended' : 'Active'
      try {
        await apiFetch(`/admin/users/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        })
        await reloadUsers()
        return null
      } catch (error) {
        return markApiError(error)
      }
    }

    const removeUser = async (id) => {
      try {
        await apiFetch(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
        await reloadUsers()
        return null
      } catch (error) {
        return markApiError(error)
      }
    }

    const respondTicket = async (id, changes) => {
      try {
        const updated = await apiFetch(`/admin/tickets/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(changes),
        })
        setTickets((current) => current.map((item) => (
          String(item.id) === String(id) ? updated : item
        )))
        return { ok: true, ticket: updated }
      } catch (error) {
        return { ok: false, message: markApiError(error) }
      }
    }

    const removeTicket = async (id) => {
      try {
        await apiFetch(`/admin/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' })
        setTickets((current) => current.filter((item) => String(item.id) !== String(id)))
        return null
      } catch (error) {
        return markApiError(error)
      }
    }

    return {
      authed,
      admin,
      restricted,
      backendError,
      login,
      logout,
      products,
      addProduct,
      updateProduct,
      removeProduct,
      payments,
      paymentSync,
      syncPayments,
      users,
      addUser,
      updateUser,
      toggleUser,
      removeUser,
      tickets,
      reloadTickets,
      respondTicket,
      removeTicket,
    }
  }, [authed, admin, products, payments, paymentSync, users, tickets, backendError])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used inside AdminProvider')
  return context
}
