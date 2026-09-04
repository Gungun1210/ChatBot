import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import diagnoseRoutes from './routes/diagnose.js'
import caseRoutes from './routes/cases.js'
import authRoutes from './routes/auth.js'
import razorpayRoutes from './routes/razorpay.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '8mb' })) 

app.use('/api', authRoutes)
app.use('/api', razorpayRoutes)
app.use('/api', diagnoseRoutes)
app.use('/api', caseRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 5050
app.listen(PORT, () => {
  console.log(`ChatBot backend running on http://localhost:${PORT}`)
})
