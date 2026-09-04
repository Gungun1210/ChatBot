import React from 'react'
import './HowItWorks.css'

const STEPS = [
  {
    n: '01',
    icon: '📡',
    title: 'Detect',
    body: 'A Razorpay webhook fires the moment a payment fails, before the customer even reaches out.',
  },
  {
    n: '02',
    icon: '🔍',
    title: 'Diagnose',
    body: 'Text, voice, or a screenshot of the error — ChatBot reads it and classifies whose issue it is.',
  },
  {
    n: '03',
    icon: '🛠️',
    title: 'Resolve or escalate',
    body: 'Fixable issues get resolved in chat. Bank-side issues get the right helpline and a ready script.',
  },
  {
    n: '04',
    icon: '✅',
    title: 'Notify',
    body: 'The customer gets a plain-language confirmation the moment the case closes. No guessing.',
  },
]

export default function HowItWorks() {
  return (
    <section className="section how">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>One flow, start to close.</h2>
        </div>
        <div className="how-grid">
          {STEPS.map((s, i) => (
            <div className="how-card" key={s.n}>
              <div className="how-top">
                <span className="how-n">{s.n}</span>
                <span className="how-icon">{s.icon}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {i < STEPS.length - 1 && <span className="how-arrow">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
