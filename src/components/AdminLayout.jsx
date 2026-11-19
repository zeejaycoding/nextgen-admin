import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import Logo from './Logo'

const navItems = [
  {
    to: '/admin',
    label: 'Dashboard',
    end: true,
    icon: 'M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM3 13h8v8H3v-8Zm10 4h8v4h-8v-4Zm0-7h8v4h-8v-4Z',
  },
  {
    to: '/admin/products',
    label: 'Products',
    icon: 'M3 5h18l-2 13H5L3 5Zm4 0V3h10v2H7Zm2 5h6v2H9v-2Z',
  },
  {
    to: '/admin/payments',
    label: 'Payments',
    icon: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm2 3v2h16V9H4Zm0 5v3h5v-3H4Z',
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z',
  },
]

function titleFor(pathname) {
  if (pathname.startsWith('/admin/products')) return 'Products'
  if (pathname.startsWith('/admin/payments')) return 'Payments'
  if (pathname.startsWith('/admin/users')) return 'Users'
  return 'Dashboard'
}

export default function AdminLayout() {
  const { logout } = useAdmin()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Logo size={40} />
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          <span className="sidebar-label">Menu</span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} /></svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="sidebar-label">Session</span>
          <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3Zm5.5 4L14 8.5l3.5 3.5H8v2h9.5L14 17.5 15.5 19 21 13.5 15.5 7Z" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="mobile-topbar">
            <Link to="/admin" className="mobile-brand" aria-label="NextGen Update admin home">
              <Logo size={34} withText={false} />
              <span>NEXTGEN UPDATE <b>ADMIN</b></span>
            </Link>
            <button type="button" className="mobile-logout-btn" onClick={handleLogout} aria-label="Log out">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3Zm5.5 4L14 8.5l3.5 3.5H8v2h9.5L14 17.5 15.5 19 21 13.5 15.5 7Z" />
              </svg>
            </button>
          </div>

          <div className="topbar-title">
            <span className="topbar-kicker">NextGen Update / Admin</span>
            <h1>{titleFor(pathname)}</h1>
          </div>
          <div className="topbar-user">
            <span className="avatar">AD</span>
            <div>
              <strong>Admin</strong>
              <span>admin@nextgenupdate.com</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `bottom-link${isActive ? ' active' : ''}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.icon} /></svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
