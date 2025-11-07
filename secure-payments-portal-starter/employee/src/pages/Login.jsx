import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getCsrf } from '../api'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    setError('')
    setLoading(true)
    try{
      await getCsrf()
      const res = await api('/api/auth/employee-login', {
        method:'POST',
        body: JSON.stringify({ username, password })
      })
      if (res.ok){
        localStorage.setItem('user', JSON.stringify(res.user))
        nav('/payments')
      }else{
        setError(res.error || 'Login failed')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="card" role="region" aria-label="Login">
      <h2>Employee Login</h2>
      <p className="subtle">Sign in to access the employee payments portal.</p>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" value={username} onChange={e=>setUsername(e.target.value)} required type="text" placeholder="username" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="••••••••••" />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
        {error && <div className="alert err">{error}</div>}
      </form>
    </div>
  )
}
