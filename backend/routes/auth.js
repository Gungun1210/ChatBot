import express from 'express'
import { sendOtp, verifyOtp, getUser } from '../utils/userStore.js'

const router = express.Router()

router.post('/auth/send-otp', (req, res) => {
  const { phone } = req.body || {}
  if (!phone || phone.trim().length < 10) {
    return res.status(400).json({ error: 'Enter a valid 10-digit phone number' })
  }
  const otp = sendOtp(phone.trim())
 
  res.json({ sent: true, demoOtp: otp })
})

router.post('/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body || {}
  if (!phone || !otp) return res.status(400).json({ error: 'phone and otp are required' })

  const token = verifyOtp(phone.trim(), otp.trim())
  if (!token) return res.status(400).json({ error: 'Invalid or expired OTP' })

  const user = getUser(phone.trim())
  res.json({ token, phone: user.phone, razorpayConnected: user.razorpayConnected })
})

export default router
