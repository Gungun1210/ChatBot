import React, { useEffect, useRef, useState } from 'react'
import RazorpayConnectModal from './RazorpayConnectModal.jsx'
import './Navbar.css'

export default function Navbar({ phone, razorpayConnected, onConnected, onLogout }) {
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = phone ? phone.slice(-2) : '??'

  return (
    <div className="navbar">
      <div className="wrap navbar-row">
        <span className="navbar-brand">ChatBot</span>
        <div className="navbar-profile" ref={menuRef}>
          <button className="profile-btn" onClick={() => setOpen((o) => !o)} aria-label="Profile menu">
            {initials}
          </button>
          {open && (
            <div className="profile-menu">
              <div className="profile-menu-phone">+91 {phone}</div>
              <div className="profile-menu-divider" />
              {razorpayConnected ? (
                <div className="profile-menu-status connected">✓ Razorpay connected</div>
              ) : (
                <button
                  className="profile-menu-item"
                  onClick={() => {
                    setShowModal(true)
                    setOpen(false)
                  }}
                >
                  Connect Razorpay account
                </button>
              )}
              <button className="profile-menu-item logout" onClick={onLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <RazorpayConnectModal onClose={() => setShowModal(false)} onConnected={onConnected} />
      )}
    </div>
  )
}
