import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, getCsrf } from '../api'

export default function Login(){
  const [email, setEmail] = useState('')
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
      const res = await api('/api/auth/login', {
        method:'POST',
        body: JSON.stringify({ email, password })
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
      <h2>Welcome back</h2>
      <p className="subtle">Sign in to manage your international payments.</p>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" value={email} onChange={e=>setEmail(e.target.value)} required type="email" placeholder="you@example.com" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" value={password} onChange={e=>setPassword(e.target.value)} required type="password" placeholder="••••••••••" />
        </div>
        <button className="btn" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
        {error && <div className="alert err">{error}</div>}
      </form>
      <p className="subtle" style={{marginTop:10}}>
        Don’t have an account? <Link className="link" to="/register">Create one</Link>
      </p>
    </div>
  )
}
