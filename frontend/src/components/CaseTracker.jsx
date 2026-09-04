import React, { useState } from 'react'
import './CaseTracker.css'

const STAGES = ['registered', 'diagnosing', 'resolved_or_escalated', 'closed']

const STAGE_LABEL = {
  registered: 'Registered',
  diagnosing: 'Diagnosing',
  resolved_or_escalated: 'Resolved / Escalated',
  closed: 'Closed — customer notified',
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CaseTracker() {
  const [caseId, setCaseId] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')

  async function lookup() {
    setError('')
    setStatus(null)
    if (!caseId.trim()) return
    try {
      const res = await fetch(`/api/case/${caseId.trim()}`)
      if (!res.ok) {
        setError('No case found with that ID.')
        return
      }
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      setError('Could not reach the backend.')
    }
  }

  const currentIndex = status ? STAGES.indexOf(status.stage) : -1

  return (
    <div className="tracker">
      <div className="tracker-input-row">
        <input
          className="chat-input"
          placeholder="Enter your case ID, e.g. SHY-1029"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookup()}
        />
        <button className="btn btn-primary" onClick={lookup}>
          Check status
        </button>
      </div>

      {error && <p className="tracker-error">{error}</p>}

      {status && (
        <div className="tracker-card">
          <div className="tracker-meta">
            <span>{status.caseId}</span>
            <span>{formatDate(status.createdAt)}</span>
            <span>₹{status.amount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="tracker-steps">
            {STAGES.map((stage, i) => (
              <div key={stage} className={`tracker-step ${i <= currentIndex ? 'done' : ''}`}>
                <span className="tracker-dot" />
                <span>{STAGE_LABEL[stage]}</span>
              </div>
            ))}
          </div>
          {status.stage === 'closed' && (
            <div className="tracker-notify">✅ {status.summary}</div>
          )}

          {status.auditLog?.length > 0 && (
            <div className="audit-trail tracker-audit">
              <span className="result-label">Audit trail</span>
              {status.auditLog.map((entry, i) => (
                <div className="audit-entry" key={i}>
                  <span className="audit-time">{formatDate(entry.at)}</span>
                  <span className="audit-action">{entry.action.replace(/_/g, ' ')}</span>
                  <span className="audit-detail">{entry.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
