import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api, getCsrf } from './api.js'

export default function App(){
  const nav = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  async function logout(){
    await getCsrf()
    await api('/api/auth/logout', { method:'POST' })
    localStorage.removeItem('user')
    nav('/login')
  }

  return (
    <div className="shell">
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="/payments">
            <div className="logo" aria-hidden />
            <h1>• Secure Payments</h1>
          </a>
          <nav className="nav" role="navigation">
            {user && <span className="subtle" style={{marginRight:8}}>Signed in as <b>{user.email}</b></span>}
            <NavLink to="/payments" className={({isActive}) => isActive ? 'active' : ''}>Payments</NavLink>
            {!user && <NavLink to="/login" className={({isActive}) => isActive ? 'active' : ''}>Login</NavLink>}
            {user && <button onClick={logout}>Logout</button>}
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <div className="footer">
        <div className="badges center">
          <span className="badge">HTTPS enforced</span>
          <span className="badge">CSP + X-Frame-Options</span>
          <span className="badge">CSRF protection</span>
          <span className="badge">HttpOnly + SameSite</span>
          <span className="badge">Rate limiting</span>
        </div>
      </div>
    </div>
  )
}
