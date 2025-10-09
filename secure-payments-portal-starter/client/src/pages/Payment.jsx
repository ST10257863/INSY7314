import React, { useEffect, useState } from 'react'
import { api, getCsrf } from '../api'

export default function Payment(){
  const [form, setForm] = useState({
    beneficiary_name:'', beneficiary_iban:'', beneficiary_bic:'',
    amount:'', currency:'USD', reference:''
  })
  const [list, setList] = useState([])
  const [msg, setMsg] = useState({ type:'', text:'' })
  const [loading, setLoading] = useState(false)

  const set = (k,v)=> setForm(prev => ({ ...prev, [k]:v }))

  async function refresh(){
    const res = await api('/api/payments')
    if (res.ok) setList(res.items)
  }
  useEffect(()=>{ refresh() }, [])

  async function submit(e){
    e.preventDefault()
    setMsg({type:'', text:''})
    setLoading(true)
    try{
      await getCsrf()
      const res = await api('/api/payments', {
        method:'POST',
        body: JSON.stringify({ ...form, amount: Number(form.amount) })
      })
      if (res.ok){
        setMsg({ type:'ok', text:`Payment #${res.payment_id} created` })
        setForm({ beneficiary_name:'', beneficiary_iban:'', beneficiary_bic:'', amount:'', currency:'USD', reference:'' })
        refresh()
      }else{
        setMsg({ type:'err', text:(res.errors?.join(', ') || res.error || 'Failed') })
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{display:'grid', gap:20, width:'100%', maxWidth:980}}>
      <div className="card">
        <h2>New International Payment</h2>
        <p className="subtle">Enter recipient and amount. IBAN & BIC are validated.</p>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label>Beneficiary name</label>
            <input value={form.beneficiary_name} onChange={e=>set('beneficiary_name', e.target.value)} placeholder="Alice Example" required />
          </div>

          <div className="row">
            <div className="field">
              <label>IBAN</label>
              <input value={form.beneficiary_iban} onChange={e=>set('beneficiary_iban', e.target.value.toUpperCase())} placeholder="GB29NWBK60161331926819" required />
            </div>
            <div className="field">
              <label>SWIFT / BIC</label>
              <input value={form.beneficiary_bic} onChange={e=>set('beneficiary_bic', e.target.value.toUpperCase())} placeholder="NWBKGB2L" required />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Amount</label>
              <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>set('amount', e.target.value)} required />
            </div>
            <div className="field">
              <label>Currency</label>
              <select value={form.currency} onChange={e=>set('currency', e.target.value)}>
                <option>USD</option><option>EUR</option><option>GBP</option>
                <option>ZAR</option><option>AUD</option><option>CAD</option><option>JPY</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Reference (optional)</label>
            <input value={form.reference} onChange={e=>set('reference', e.target.value)} placeholder="Invoice 1024" />
          </div>

          <button className="btn" disabled={loading}>{loading ? 'Submitting…' : 'Create payment'}</button>
          {msg.text && <div className={`alert ${msg.type==='ok'?'ok':'err'}`}>{msg.text}</div>}
        </form>
      </div>

      <div className="card">
        <h2>Your recent payments</h2>
        {list.length === 0 ? (
          <p className="subtle">No payments yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Beneficiary</th><th>IBAN</th><th>BIC</th><th>Amount</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p=>(
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>{p.beneficiary_name}</td>
                  <td className="subtle">{p.beneficiary_iban}</td>
                  <td className="subtle">{p.beneficiary_bic}</td>
                  <td>{p.currency} {Number(p.amount).toFixed(2)}</td>
                  <td className="subtle">{new Date(p.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
