import React, { useEffect, useState } from 'react'
import './MyCases.css'

const STAGE_LABEL = {
  registered: 'Registered',
  diagnosing: 'Diagnosing',
  resolved_or_escalated: 'Resolved / Escalated',
  closed: 'Closed — notified',
}

const STAGE_CLASS = {
  registered: 'pending',
  diagnosing: 'pending',
  resolved_or_escalated: 'progress',
  closed: 'done',
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MyCases({ refreshKey }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  async function loadCases() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('ChatBot_token')
      const res = await fetch('/api/cases', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setCases(data)
    } catch (err) {
      setError('Could not reach the backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [refreshKey])

  return (
    <div className="mycases">
      <div className="mycases-head">
        <span className="result-label">{cases.length} case{cases.length === 1 ? '' : 's'}</span>
        <button className="btn btn-ghost mycases-refresh" onClick={loadCases}>
          Refresh
        </button>
      </div>

      {error && <p className="tracker-error">{error}</p>}
      {!loading && cases.length === 0 && (
        <p className="mycases-empty">No cases yet — describe an issue above to register one.</p>
      )}

      <div className="mycases-list">
        {cases.map((c) => (
          <div className="mycases-item" key={c.caseId}>
            <button
              className="mycases-row"
              onClick={() => setExpanded(expanded === c.caseId ? null : c.caseId)}
            >
              <div className="mycases-info">
                <span className="mycases-id">{c.caseId}</span>
                <span className="mycases-summary">{c.summary}</span>
                <span className="mycases-date">{formatDate(c.createdAt)}</span>
              </div>
              <div className="mycases-right">
                <span className="mycases-amount">₹{(c.amount || 0).toLocaleString('en-IN')}</span>
                <span className={`mycases-badge ${STAGE_CLASS[c.stage] || 'pending'}`}>
                  {STAGE_LABEL[c.stage] || c.stage}
                </span>
              </div>
            </button>

            {expanded === c.caseId && c.auditLog && (
              <div className="audit-trail">
                <span className="result-label">Audit trail</span>
                {c.auditLog.map((entry, i) => (
                  <div className="audit-entry" key={i}>
                    <span className="audit-time">{formatDate(entry.at)}</span>
                    <span className="audit-action">{entry.action.replace(/_/g, ' ')}</span>
                    <span className="audit-detail">{entry.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
