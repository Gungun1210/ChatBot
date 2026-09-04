let seq = 1029
const cases = new Map()

export function createCase({ amount, category, summary, stage = 'registered', phone = 'guest' }) {
  seq += 1
  const caseId = `SHY-${seq}`
  const now = Date.now()
  const record = {
    caseId,
    amount,
    category,
    summary,
    stage,
    phone,
    createdAt: now,
    auditLog: [{ at: now, action: 'case_registered', detail: summary }],
  }
  cases.set(caseId, record)
  return record
}

export function getCase(caseId) {
  return cases.get(caseId)
}

export function setFeedback(caseId, rating) {
  const record = cases.get(caseId)
  if (!record) return null
  record.feedback = rating
  record.auditLog.push({
    at: Date.now(),
    action: 'feedback_received',
    detail: rating === 'up' ? 'Customer marked this as helpful' : 'Customer marked this as not helpful',
  })
  return record
}

export function addAuditEntry(caseId, action, detail) {
  const record = cases.get(caseId)
  if (!record) return null
  record.auditLog.push({ at: Date.now(), action, detail })
  return record
}

export function advanceCase(caseId, stage, summary) {
  const record = cases.get(caseId)
  if (!record) return null
  record.stage = stage
  if (summary) record.summary = summary
  return record
}

export function allCases(phone) {
  const list = Array.from(cases.values())
  if (!phone) return list
  return list.filter((c) => c.phone === phone)
}