import React, { useState } from 'react'
import './RazorpayConnectModal.css'

export default function RazorpayConnectModal({ onClose, onConnected }) {
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setError('')
    if (!keyId.trim() || !keySecret.trim()) {
      setError('Enter both Key ID and Key Secret')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('ChatBot_token')
      const res = await fetch('/api/razorpay/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ keyId: keyId.trim(), keySecret: keySecret.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not connect')
      localStorage.setItem('ChatBot_razorpay', '1')
      onConnected()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <span className="eyebrow">Connect Razorpay</span>
        <h3>Link your Razorpay account</h3>
        <p className="modal-sub">
          ChatBot uses these to listen for payment-failure webhooks and track recovery for your
          account. Find them under <strong>Settings → API Keys</strong> in your Razorpay
          dashboard.
        </p>

        <label className="modal-label">Key ID</label>
        <input
          className="chat-input modal-input"
          placeholder="rzp_test_xxxxxxxxxxxx"
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
        />

        <label className="modal-label">Key Secret</label>
        <input
          className="chat-input modal-input"
          type="password"
          placeholder="••••••••••••••••"
          value={keySecret}
          onChange={(e) => setKeySecret(e.target.value)}
        />

        {error && <p className="auth-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={connect} disabled={loading}>
            {loading ? 'Connecting…' : 'Connect account'}
          </button>
        </div>

        <p className="modal-note">
          Demo mode — these keys are not validated against a real Razorpay account and nothing is
          stored beyond this session.
        </p>
      </div>
    </div>
  )
}
