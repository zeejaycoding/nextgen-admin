import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import { useAdmin } from './context/AdminContext'
import AdminLogin from './pages/AdminLogin'
import Dashboard from './pages/Dashboard'
import Payments from './pages/Payments'
import Products from './pages/Products'
import Settings from './pages/Settings'
import Users from './pages/Users'

function Protected({ children }) {
  const { authed } = useAdmin()
  return authed ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={<Protected><AdminLayout /></Protected>}
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="payments" element={<Payments />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </>
  )
}
