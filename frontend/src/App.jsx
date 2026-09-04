import React, { useEffect, useState } from 'react'
import Auth from './components/Auth.jsx'
import Navbar from './components/Navbar.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Hero from './components/Hero.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import ChatWidget from './components/ChatWidget.jsx'
import MyCases from './components/MyCases.jsx'
import CaseTracker from './components/CaseTracker.jsx'
import ImpactStrip from './components/ImpactStrip.jsx'
import Footer from './components/Footer.jsx'
import './App.css'

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [session, setSession] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('ChatBot_token')
    const phone = localStorage.getItem('ChatBot_phone')
    const razorpayConnected = localStorage.getItem('ChatBot_razorpay') === '1'
    if (token && phone) setSession({ token, phone, razorpayConnected })
    setChecked(true)
  }, [])

  function logout() {
    localStorage.removeItem('ChatBot_token')
    localStorage.removeItem('ChatBot_phone')
    localStorage.removeItem('ChatBot_razorpay')
    setSession(null)
  }

  if (!checked) return null
  if (!session) return (
    <>
      <ThemeToggle />
      <Auth onAuthed={setSession} />
    </>
  )

  return (
    <div className="app">
      <ThemeToggle />
      <Navbar
        phone={session.phone}
        razorpayConnected={session.razorpayConnected}
        onConnected={() => setSession((s) => ({ ...s, razorpayConnected: true }))}
        onLogout={logout}
      />
      <Hero razorpayConnected={session.razorpayConnected} />
      <HowItWorks />
      <section className="section" id="assistant">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Live recovery assistant</span>
            <h2>Tell it what happened. Any way you like.</h2>
            <p className="section-sub">
              Type, speak, or upload a screenshot of the error. ChatBot reads it, diagnoses it,
              and either fixes it on the spot or tells the customer exactly who to call.
            </p>
            {!session.razorpayConnected && (
              <p className="connect-nudge">
                Tip: connect your Razorpay account from the profile menu above so ChatBot can
                track payments automatically.
              </p>
            )}
          </div>
          <ChatWidget onNewCase={() => setRefreshKey((k) => k + 1)} />
        </div>
      </section>
      <section className="section" id="tracker">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Case status</span>
            <h2>Every failure gets a case ID, a date, and an audit trail.</h2>
            <p className="section-sub">
              All your registered issues show up below automatically. Tap a case to see exactly
              what happened and when. Or look one up by ID.
            </p>
          </div>
          <MyCases refreshKey={refreshKey} />
          <div className="tracker-divider" />
          <CaseTracker />
        </div>
      </section>
      <ImpactStrip />
      <Footer />
    </div>
  )
}


