import React, { useEffect, useState } from 'react'
import { api, getCsrf } from '../api'

export default function Payment() {
  const [list, setList] = useState([])
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  async function refresh() {
    const res = await api('/api/payments/pending')
    if (res.ok) setList(res.items)
  }
  useEffect(() => { refresh() }, [])

  const verifyPayment = async (id) => {
    setLoading(true)
    await getCsrf()
    const res = await api(`/api/payments/${id}/verify`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      setMsg({ type: 'ok', text: `Payment #${id} verified` })
      refresh()
    } else {
      setMsg({ type: 'err', text: (res.errors?.join(', ') || res.error || 'Failed') })
    }
  }

  const rejectPayment = async (id) => {
    setRejectingId(id)
    setRejectReason('')
    setMsg({ type: '', text: '' })
  }

  const confirmReject = async (id) => {
    setLoading(true)
    await getCsrf()
    const res = await api(`/api/payments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: rejectReason })
    })
    setLoading(false)
    setRejectingId(null)
    setRejectReason('')
    if (res.ok) {
      setMsg({ type: 'ok', text: `Payment #${id} rejected` })
      refresh()
    } else {
      setMsg({ type: 'err', text: (res.errors?.join(', ') || res.error || 'Failed') })
    }
  }

  const cancelReject = () => {
    setRejectingId(null)
    setRejectReason('')
  }

  const submitToSwift = async () => {
    setSubmitting(true)
    await getCsrf()
    const res = await api('/api/payments/submit', { method: 'POST' })
    setSubmitting(false)
    if (res.ok) {
      setMsg({ type: 'ok', text: `Submitted ${res.updated || 0} payment(s) to SWIFT` })
      refresh()
    } else {
      setMsg({ type: 'err', text: (res.errors?.join(', ') || res.error || 'Failed') })
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: 980 }}>
      <div className="card">
        <h2>International Payments Queue</h2>
        <p className="subtle">Review, verify, reject, and submit payments to SWIFT.</p>
        {msg.text && <div className={`alert ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div>}
        {list.length === 0 ? (
          <p className="subtle">No payments pending.</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Beneficiary</th><th>IBAN</th><th>BIC</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.beneficiary_name}</td>
                    <td className="subtle">{p.beneficiary_iban}</td>
                    <td className="subtle">{p.beneficiary_bic}</td>
                    <td>{p.currency} {Number(p.amount).toFixed(2)}</td>
                    <td className="subtle">{new Date(p.created_at).toLocaleString()}</td>
                    <td>
                      {p.submitted
                        ? <span className="ok">Submitted</span>
                        : p.verified
                          ? <span className="ok">Verified</span>
                          : <span className="err">Pending</span>
                      }
                    </td>
                    <td>
                      {!p.verified && !p.submitted && !p.rejected && (
                        <>
                          <button onClick={() => verifyPayment(p.id)} disabled={loading}>Verify</button>
                          <button onClick={() => rejectPayment(p.id)} disabled={loading} style={{ marginLeft: 8 }}>Reject</button>
                        </>
                      )}
                      {rejectingId === p.id && (
                        <div style={{ marginTop: 8 }}>
                          <input
                            type="text"
                            placeholder="Reason for rejection"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            style={{ width: 180, marginRight: 8 }}
                            disabled={loading}
                          />
                          <button onClick={() => confirmReject(p.id)} disabled={loading || !rejectReason.trim()}>Confirm</button>
                          <button onClick={cancelReject} disabled={loading} style={{ marginLeft: 4 }}>Cancel</button>
                        </div>
                      )}
                      {p.verified && !p.submitted && <span>Ready for SWIFT</span>}
                      {p.submitted && <span>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="btn"
              style={{ marginTop: 16 }}
              onClick={submitToSwift}
              disabled={submitting || !list.some(p => p.verified && !p.submitted)}
            >
              {submitting ? 'Submitting…' : 'Submit Verified to SWIFT'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
