const otps = new Map() 
const users = new Map() 
const sessions = new Map() 

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function generateToken() {
  return 'tok_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function sendOtp(phone) {
  const otp = generateOtp()
  otps.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 })
  console.log(`[OTP] ${phone} -> ${otp}`)
  return otp
}

export function verifyOtp(phone, otp) {
  const record = otps.get(phone)
  if (!record) return null
  if (Date.now() > record.expiresAt) return null
  if (record.otp !== otp) return null
  otps.delete(phone)

  if (!users.has(phone)) {
    users.set(phone, { phone, razorpayConnected: false, escalationCount: 0, createdAt: Date.now() })
  }
  const token = generateToken()
  sessions.set(token, phone)
  return token
}

export function getPhoneFromToken(token) {
  return sessions.get(token)
}

export function getUser(phone) {
  return users.get(phone)
}

export function connectRazorpay(phone, keyId) {
  const user = users.get(phone)
  if (!user) return null
  user.razorpayConnected = true
  user.razorpayKeyId = keyId
  return user
}


export function incrementEscalation(phone) {
  const user = users.get(phone)
  if (!user) return 0
  user.escalationCount += 1
  return user.escalationCount
}
