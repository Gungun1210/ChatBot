import express from 'express'
import { getPhoneFromToken, connectRazorpay, getUser } from '../utils/userStore.js'

const router = express.Router()

function authPhone(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  return getPhoneFromToken(token)
}


router.post('/razorpay/connect', (req, res) => {
  const phone = authPhone(req)
  if (!phone) return res.status(401).json({ error: 'Not authenticated' })
  const { keyId, keySecret } = req.body || {}
  if (!keyId || !keySecret) {
    return res.status(400).json({ error: 'Key ID and Key Secret are required' })
  }
  const user = connectRazorpay(phone, keyId)
  res.json({ connected: true, phone: user.phone })
})

router.get('/razorpay/status', (req, res) => {
  const phone = authPhone(req)
  if (!phone) return res.status(401).json({ error: 'Not authenticated' })
  const user = getUser(phone)
  res.json({ connected: !!user?.razorpayConnected })
})

export default router
