import React, { useEffect, useState } from 'react'
import './Hero.css'

export default function Hero({ razorpayConnected }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!razorpayConnected) return
    const token = localStorage.getItem('ChatBot_token')
    fetch('/api/stats', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [razorpayConnected])

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Razorpay Buildathon · Revenue Recovery</span>
          <h1>
            Every failed payment
            <br />
            has a story. <span className="accent">ChatBot reads it.</span>
          </h1>
          <p className="hero-sub">
            When a payment fails, most customers don't know why, don't know how to fix it, and
            don't know who to call. ChatBot diagnoses the failure from a message, a voice note,
            or a screenshot — in the customer's own language — fixes what it can, and tells them
            exactly what to do when it can't.
          </p>
          <div className="hero-actions">
            <a href="#assistant" className="btn btn-primary">
              Try the recovery assistant
            </a>
            <a href="#tracker" className="btn btn-ghost">
              Track a case
            </a>
          </div>
        </div>

        {razorpayConnected ? (
          <div className="ticket" role="img" aria-label="Live recovery summary">
            <div className="ticket-head">
              <span>ChatBot</span>
              <span>RECOVERY RECEIPT</span>
            </div>
            <div className="ticket-total">
              <span className="ticket-total-label">Recovered so far</span>
              <span className="ticket-total-amount">
                ₹{(stats?.recovered ?? 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="ticket-divider" />
            <div className="ticket-row">
              <span>Recovery rate</span>
              <span>{stats?.recoveryRate ?? 0}%</span>
            </div>
            <div className="ticket-row">
              <span>Satisfaction</span>
              <span>{stats?.satisfaction ?? 0}%</span>
            </div>
            <div className="ticket-row status">
              <span>Account</span>
              <span className="status-pill">Connected</span>
            </div>
            <div className="ticket-perf" />
          </div>
        ) : (
          <div className="ticket ticket-empty">
            <div className="ticket-head">
              <span>ChatBot</span>
              <span>RECOVERY RECEIPT</span>
            </div>
            <div className="ticket-empty-icon">🔌</div>
            <p className="ticket-empty-text">
              No account connected yet. Connect your Razorpay account from the profile menu
              (top right) to start tracking real recovered payments here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
