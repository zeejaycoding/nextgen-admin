import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import Splash from './components/Splash'
import { AdminProvider } from './context/AdminContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SiteSettingsProvider>
      <Splash />
      <HashRouter>
        <AdminProvider>
          <App />
        </AdminProvider>
      </HashRouter>
    </SiteSettingsProvider>
  </React.StrictMode>,
)
