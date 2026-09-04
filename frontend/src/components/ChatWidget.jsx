import React, { useRef, useState } from 'react'
import './ChatWidget.css'

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'bn', label: 'Bengali' },
]

const STARTER = {
  id: 'starter',
  role: 'assistant',
  text: "Hi, I'm ChatBot. Tell me what happened with your payment — type it, speak it, or upload a screenshot of the error. Main Hindi, Tamil, Telugu, Bengali mein bhi baat kar sakta hoon.",
}

function authHeaders() {
  const token = localStorage.getItem('ChatBot_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function FeedbackRow({ caseId }) {
  const [rated, setRated] = useState(null)

  async function rate(rating) {
    setRated(rating)
    try {
      await fetch(`/api/case/${caseId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ rating }),
      })
    } catch (err) {
      // silent fail is fine for a feedback widget — don't block the UI
    }
  }

  if (rated) {
    return <p className="feedback-thanks">Thanks for the feedback 🙏</p>
  }

  return (
    <div className="feedback-row">
      <span className="result-label">Was this helpful?</span>
      <div className="feedback-buttons">
        <button className="feedback-btn" onClick={() => rate('up')} aria-label="Helpful">
          👍
        </button>
        <button className="feedback-btn" onClick={() => rate('down')} aria-label="Not helpful">
          👎
        </button>
      </div>
    </div>
  )
}

function ResultBubble({ result }) {
  if (!result) return null
  return (
    <div className="result-card">
      <div className="result-row">
        <span className="result-tag">{result.category}</span>
        <span className="result-conf">{result.confidence}% confidence</span>
      </div>
      <p className="result-diagnosis">{result.diagnosis}</p>

      {result.steps?.length > 0 && (
        <div className="result-steps">
          <span className="result-label">What to do</span>
          <ol>
            {result.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {result.action && (
        <button className="btn btn-primary result-action">{result.action}</button>
      )}

      {result.needsHumanReview && (
        <div className="human-review">
          ⚠️ This case has been passed to a human specialist for review, as a safety and
          compliance step.
        </div>
      )}

      {result.escalation && (
        <div className="escalation">
          <span className="result-label">Call for help</span>
          <div className="escalation-row">
            <span>{result.escalation.department}</span>
            <a href={`tel:${result.escalation.phone}`}>{result.escalation.phone}</a>
          </div>
          {result.escalation.tollFree && <span className="toll-free-tag">Toll-free</span>}
          <p className="escalation-branch">{result.escalation.branch}</p>
          <span className="result-label">What to say</span>
          <p className="escalation-script">{result.escalation.script}</p>
          <button
            className="btn btn-ghost copy-btn"
            onClick={() => navigator.clipboard?.writeText(result.escalation.script)}
          >
            Copy script
          </button>
        </div>
      )}

      {result.caseId && (
        <div className="case-chip">
          Case <span>{result.caseId}</span> registered — track it below
        </div>
      )}

      {result.caseId && <FeedbackRow caseId={result.caseId} />}
    </div>
  )
}

export default function ChatWidget({ onNewCase }) {
  const [messages, setMessages] = useState([STARTER])
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const fileRef = useRef(null)
  const recognitionRef = useRef(null)

  const pushMessage = (msg) => setMessages((m) => [...m, msg])

  // Auto-switch the language dropdown if the customer types in a script we
  // recognize, so the reply comes back in the same language even if the
  // dropdown was left on "Auto-detect".
  function detectAndSetLanguage(text) {
    if (/[\u0900-\u097F]/.test(text)) setLanguage('hi')
    else if (/[\u0B80-\u0BFF]/.test(text)) setLanguage('ta')
    else if (/[\u0C00-\u0C7F]/.test(text)) setLanguage('te')
    else if (/[\u0980-\u09FF]/.test(text)) setLanguage('bn')
  }

  async function sendText(text) {
    if (!text.trim()) return
    detectAndSetLanguage(text)
    const effectiveLanguage = /[\u0900-\u097F]/.test(text)
      ? 'hi'
      : /[\u0B80-\u0BFF]/.test(text)
      ? 'ta'
      : /[\u0C00-\u0C7F]/.test(text)
      ? 'te'
      : /[\u0980-\u09FF]/.test(text)
      ? 'bn'
      : language

    pushMessage({ id: Date.now(), role: 'user', text })
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message: text, language: effectiveLanguage }),
      })
      const data = await res.json()
      pushMessage({ id: Date.now() + 1, role: 'assistant', result: data })
      if (data.caseId) onNewCase?.()
    } catch (err) {
      pushMessage({
        id: Date.now() + 1,
        role: 'assistant',
        text: "Couldn't reach the backend. Make sure the server is running on port 5050.",
      })
    } finally {
      setLoading(false)
    }
  }

  async function sendImage(file) {
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result
      pushMessage({ id: Date.now(), role: 'user', text: 'Uploaded a screenshot', image: base64 })
      setLoading(true)
      try {
        const res = await fetch('/api/diagnose-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ imageBase64: base64, language }),
        })
        const data = await res.json()
        pushMessage({ id: Date.now() + 1, role: 'assistant', result: data })
        if (data.caseId) onNewCase?.()
      } catch (err) {
        pushMessage({
          id: Date.now() + 1,
          role: 'assistant',
          text: "Couldn't reach the backend. Make sure the server is running on port 5050.",
        })
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (file) sendImage(file)
    e.target.value = ''
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome, or type instead.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'auto' ? 'en-IN' : `${language}-IN`
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      sendText(transcript)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  return (
    <div className="chat-widget">
      <div className="chat-topbar">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="lang-select"
          aria-label="Preferred language"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="chat-log">
        {messages.map((m) => (
          <div key={m.id} className={`bubble bubble-${m.role}`}>
            {m.image && <img className="bubble-image" src={m.image} alt="Uploaded screenshot" />}
            {m.text && <p>{m.text}</p>}
            {m.result && <ResultBubble result={m.result} />}
          </div>
        ))}
        {loading && (
          <div className="bubble bubble-assistant">
            <p className="typing">Reading the issue…</p>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <button
          className="icon-btn"
          title="Upload screenshot"
          onClick={() => fileRef.current?.click()}
        >
          📎
        </button>
        <button
          className={`icon-btn ${listening ? 'icon-btn-active' : ''}`}
          title="Speak your issue"
          onClick={startVoice}
        >
          {listening ? '● Listening' : '🎙️'}
        </button>
        <input
          className="chat-input"
          placeholder="e.g. Mera payment fail ho gaya, paisa kat gaya"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendText(input)}
        />
        <button className="btn btn-primary" onClick={() => sendText(input)} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  )
}
