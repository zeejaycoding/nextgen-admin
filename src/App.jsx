import { Navigate, Route, Routes } from 'react-router-dom'
import { useAutoUpdate } from './lib/useAutoUpdate'
import AdminLayout from './components/AdminLayout'
import { useAdmin } from './context/AdminContext'
import AdminLogin from './pages/AdminLogin'
import Dashboard from './pages/Dashboard'
import Payments from './pages/Payments'
import Products from './pages/Products'
import Settings from './pages/Settings'
import Tickets from './pages/Tickets'
import Users from './pages/Users'

function Protected({ children, productsOnly = false }) {
  const { authed, restricted } = useAdmin()
  if (!authed) return <Navigate to="/admin/login" replace />
  if (productsOnly && restricted) return <Navigate to="/admin/products" replace />
  return children
}

export default function App() {
  useAutoUpdate()

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={<Protected><AdminLayout /></Protected>}
        >
          <Route index element={<Protected productsOnly><Dashboard /></Protected>} />
          <Route path="products" element={<Products />} />
          <Route path="payments" element={<Protected productsOnly><Payments /></Protected>} />
          <Route path="tickets" element={<Protected productsOnly><Tickets /></Protected>} />
          <Route path="users" element={<Protected productsOnly><Users /></Protected>} />
          <Route path="settings" element={<Protected productsOnly><Settings /></Protected>} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </>
  )
}
