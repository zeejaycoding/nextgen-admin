import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { seedPayments, seedProducts, seedUsers } from '../data/seed'

const KEYS = {
  auth: 'nextgen-admin-auth',
  products: 'nextgen-admin-products',
  payments: 'nextgen-admin-payments',
  users: 'nextgen-admin-users',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage can be unavailable in private browsing — demo still works in memory */
  }
}

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [authed, setAuthed] = useState(() => read(KEYS.auth, false))
  const [products, setProducts] = useState(() => read(KEYS.products, seedProducts))
  const [payments, setPayments] = useState(() =>
    read(KEYS.payments, seedPayments).map((item) => ({
      ...item,
      method: item.method === 'PayPal' ? 'Apple Pay' : item.method,
    })),
  )
  const [users, setUsers] = useState(() => read(KEYS.users, seedUsers))

  useEffect(() => save(KEYS.auth, authed), [authed])
  useEffect(() => save(KEYS.products, products), [products])
  useEffect(() => save(KEYS.payments, payments), [payments])
  useEffect(() => save(KEYS.users, users), [users])

  const value = useMemo(() => {
    const login = (email, password) => {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address.'
      if (password.length < 4) return 'Password must be at least 4 characters.'
      setAuthed(true)
      return null
    }

    const logout = () => setAuthed(false)

    const addProduct = (product) => {
      const nextId = products.reduce((max, item) => Math.max(max, item.id), 0) + 1
      const slug = product.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setProducts((current) => [
        {
          ...product,
          id: nextId,
          slug: `${nextId}-${slug}`,
          images: product.images || [],
          features: product.features || [],
          video: product.video || '',
          published: product.published || new Date().toISOString().slice(0, 10),
        },
        ...current,
      ])
    }

    const updateProduct = (id, patch) =>
      setProducts((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      )

    const removeProduct = (id) => setProducts((current) => current.filter((item) => item.id !== id))

    const updatePayment = (id, status) =>
      setPayments((current) => current.map((item) => (item.id === id ? { ...item, status } : item)))

    const addUser = (user) => {
      const nextId = users.reduce((max, item) => Math.max(max, item.id), 0) + 1
      setUsers((current) => [
        { ...user, id: nextId, joined: new Date().toISOString().slice(0, 10) },
        ...current,
      ])
    }

    const toggleUser = (id) =>
      setUsers((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, status: item.status === 'Active' ? 'Suspended' : 'Active' }
            : item,
        ),
      )

    const removeUser = (id) => setUsers((current) => current.filter((item) => item.id !== id))

    return {
      authed,
      login,
      logout,
      products,
      addProduct,
      updateProduct,
      removeProduct,
      payments,
      updatePayment,
      users,
      addUser,
      toggleUser,
      removeUser,
    }
  }, [authed, products, payments, users])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used inside AdminProvider')
  return context
}

export function formatPrice(price) {
  return Number(price) === 0 ? 'FREE' : `$${Number(price).toFixed(2)}`
}

export function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  const monthName = new Date(year, month - 1, day).toLocaleString('en', { month: 'short' })
  return `${monthName} ${day}, ${year}`
}
