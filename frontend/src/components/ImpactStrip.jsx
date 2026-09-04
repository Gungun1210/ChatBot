import React, { useEffect, useState } from 'react'
import './ImpactStrip.css'

const FALLBACK = {
  recovered: 482300,
  recoveryRate: 61,
  avgResolutionMins: 4,
  languages: 5,
  satisfaction: 87,
  trend: [210000, 260000, 300000, 340000, 390000, 430000, 482300],
}

function Sparkline({ data }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 92 - ((v - min) / range) * 84
      return `${x},${y}`
    })
    .join(' ')
  const areaPoints = `0,100 ${points} 100,100`

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="sparkline">
      <polygon points={areaPoints} className="sparkline-area" />
      <polyline points={points} className="sparkline-line" />
    </svg>
  )
}

export default function ImpactStrip() {
  const [stats, setStats] = useState(FALLBACK)

  useEffect(() => {
    const token = localStorage.getItem('ChatBot_token')
    fetch('/api/stats', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
  }, [])

  const items = [
    { label: 'Recovered', value: `₹${stats.recovered.toLocaleString('en-IN')}` },
    { label: 'Recovery rate', value: `${stats.recoveryRate}%` },
    { label: 'Satisfaction', value: `${stats.satisfaction}%` },
    { label: 'Avg resolution time', value: `${stats.avgResolutionMins} min` },
    { label: 'Languages supported', value: stats.languages },
  ]

  return (
    <section className="section impact">
      <div className="wrap">
        <div className="impact-row">
          {items.map((it) => (
            <div className="impact-item" key={it.label}>
              <span className="impact-value">{it.value}</span>
              <span className="impact-label">{it.label}</span>
            </div>
          ))}
        </div>

        <div className="trend-card">
          <div className="trend-head">
            <span className="result-label">7-day recovery trend</span>
            <span className="trend-total">₹{stats.recovered.toLocaleString('en-IN')}</span>
          </div>
          <Sparkline data={stats.trend} />
        </div>
      </div>
    </section>
  )
}
