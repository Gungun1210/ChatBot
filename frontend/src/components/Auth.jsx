import React, { useState } from 'react'
import './Auth.css'

export default function Auth({ onAuthed }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [stage, setStage] = useState('phone') // 'phone' | 'otp'
  const [demoOtp, setDemoOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendOtp() {
    setError('')
    if (phone.trim().length < 10) {
      setError('Enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      setDemoOtp(data.demoOtp)
      setStage('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid OTP')
      localStorage.setItem('ChatBot_token', data.token)
      localStorage.setItem('ChatBot_phone', data.phone)
      localStorage.setItem('ChatBot_razorpay', data.razorpayConnected ? '1' : '0')
      onAuthed({ token: data.token, phone: data.phone, razorpayConnected: data.razorpayConnected })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="eyebrow">Sign in</span>
        <h2>Verify your number to continue</h2>
        <p className="auth-sub">
          We send a one-time code by SMS — no password to create or remember.
        </p>

        {stage === 'phone' && (
          <>
            <input
              className="chat-input auth-input"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
            />
            <button className="btn btn-primary auth-btn" onClick={sendOtp} disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </>
        )}

        {stage === 'otp' && (
          <>
            <p className="auth-demo-note">
              Demo mode — no real SMS gateway connected yet. Your OTP is{' '}
              <span className="auth-demo-otp">{demoOtp}</span>
            </p>
            <input
              className="chat-input auth-input"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
            />
            <button className="btn btn-primary auth-btn" onClick={verifyOtp} disabled={loading}>
              {loading ? 'Verifying…' : 'Verify & continue'}
            </button>
            <button className="auth-back" onClick={() => setStage('phone')}>
              Change number
            </button>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  )
}
