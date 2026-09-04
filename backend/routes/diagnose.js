import express from 'express'
import { diagnoseText, diagnoseImage, hasApiKey } from '../utils/aimlClient.js'
import { buildFallbackScript } from '../utils/helplines.js'
import { createCase, addAuditEntry } from '../utils/caseStore.js'
import { getPhoneFromToken, incrementEscalation } from '../utils/userStore.js'

const router = express.Router()

const MAX_ESCALATIONS_PER_USER = 3

const SYSTEM_PROMPT = `You are ChatBot, a warm and patient AI assistant that helps Indian customers understand and fix failed payments for a Razorpay merchant.

CRITICAL LANGUAGE RULE: Always reply in the customer's preferred language, in that language's native script (e.g. Hindi in Devanagari, not Hinglish/roman letters, unless the customer themselves wrote in roman script). If the preferred language is "auto", detect the language of the customer's own message and reply in that same language and script. Never default to English unless the customer's language is English or genuinely undetectable.

CRITICAL TONE RULE: Assume the customer is NOT technical and may be anxious about losing money. Use short, everyday sentences. Never use jargon without immediately explaining it in plain words. Be reassuring and clear, like a helpful neighbour, not a support ticket.

CRITICAL AMOUNT RULE: Only fill in "amount" if the customer explicitly mentions a specific rupee amount or number in their own message. Never guess, estimate, or invent an amount. If no amount is mentioned, "amount" must be null.

CRITICAL TXN ID RULE: Only fill in "txnId" if the customer explicitly provides a transaction ID, order ID, or reference number. Never invent one. If not mentioned, "txnId" must be null.

Reply ONLY with JSON in this exact shape:
{
  "category": "customer_side" | "bank_side" | "merchant_side",
  "confidence": 0-100,
  "diagnosis": "one or two short, simple sentences explaining what went wrong, in the customer's language",
  "steps": ["short actionable step in simple language", "..."],
  "action": "short button label like 'Send new payment link' or null",
  "needsEscalation": true|false,
  "amount": number or null,
  "txnId": "string or null"
}
If needsEscalation is true, category should usually be bank_side.`

function detectLanguage(message, requested) {
  if (requested && requested !== 'auto') return requested
  const text = message || ''
  if (/[\u0900-\u097F]/.test(text)) return 'hi'
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'
  return 'en'
}


const CATEGORIES = [
  {
    key: 'wrong_pin',
    keywords: ['pin', 'otp', 'galat pin', 'incorrect', 'गलत पिन', 'पिन', 'wrong pin'],
    category: 'customer_side',
    needsEscalation: false,
    action: 'Send new payment link',
    amount: 499,
    en: {
      diagnosis: 'It looks like the UPI PIN you entered was wrong, so your bank stopped the payment to keep your account safe.',
      steps: ['Open your UPI app again', 'Enter the correct PIN carefully', 'Use the button below to try the payment again'],
    },
    hi: {
      diagnosis: 'Aisa lagta hai ki UPI PIN galat daala gaya tha, isliye bank ne payment rok diya — yeh aapke account ko surakshit rakhne ke liye hai.',
      steps: ['Apna UPI app dobara kholein', 'Sahi PIN dhyan se daalein', 'Neeche diye button se payment dobara try karein'],
    },
  },
  {
    key: 'bank_down',
    keywords: ['server', 'bank down', 'bank server', 'timeout', 'down', 'बैंक', 'सर्वर', 'server down'],
    category: 'bank_side',
    needsEscalation: true,
    action: null,
    amount: 1250,
    en: {
      diagnosis: "This looks like a problem on the bank's side — their system was slow or down for a moment. This is not your mistake and not something we can fix directly.",
      steps: ['Please wait 10-15 minutes and try again', 'If money was deducted, it usually comes back automatically in 5-7 days', 'If it does not come back, call your bank using the details below'],
    },
    hi: {
      diagnosis: 'Yeh bank ki taraf se dikkat lagti hai — unka system kuch der ke liye dheema ya band tha. Yeh aapki galti nahi hai.',
      steps: ['Kripya 10-15 minute रुकें aur dobara try karein', 'Agar paisa kata hai, to aam taur par 5-7 din mein wapas aa jaata hai', 'Agar wapas nahi aaya, to neeche di gayi jaankari se bank ko call karein'],
    },
  },
  {
    key: 'insufficient_balance',
    keywords: ['insufficient', 'balance', 'kam balance', 'no balance', 'बैलेंस', 'paisa kam', 'low balance'],
    category: 'customer_side',
    needsEscalation: false,
    action: 'Send new payment link',
    amount: 650,
    en: {
      diagnosis: 'Your account balance was too low at the time of payment, so the bank could not complete it.',
      steps: ['Check your account balance', 'Add money if needed, or use a different card/UPI app', 'Retry the payment using the link below'],
    },
    hi: {
      diagnosis: 'Payment ke waqt aapke account mein balance kam tha, isliye bank payment complete nahi kar paya.',
      steps: ['Apna account balance check karein', 'Zaroorat ho to paisa daalein, ya doosra card/UPI app use karein', 'Neeche diye link se payment dobara try karein'],
    },
  },
  {
    key: 'network_issue',
    keywords: ['network', 'internet', 'connection', 'wifi', 'signal', 'नेटवर्क', 'इंटरनेट', 'connectivity'],
    category: 'customer_side',
    needsEscalation: false,
    action: 'Send new payment link',
    amount: 599,
    en: {
      diagnosis: 'Your payment likely failed because of a weak or interrupted internet connection during the transaction.',
      steps: ['Move to a spot with better network signal, or switch to WiFi', 'Try the payment again using the link below'],
    },
    hi: {
      diagnosis: 'Payment ke dauraan internet connection kamzor ya beech mein cut hone ki wajah se yeh fail hua lagta hai.',
      steps: ['Behtar network signal wali jagah jaayein, ya WiFi use karein', 'Neeche diye link se payment dobara try karein'],
    },
  },
  {
    key: 'wrong_amount',
    keywords: ['wrong amount', 'galat amount', 'extra charged', 'overcharged', 'amount mismatch', 'ज्यादा पैसे'],
    category: 'merchant_side',
    needsEscalation: false,
    action: 'Report amount mismatch',
    amount: 199,
    en: {
      diagnosis: 'It looks like the amount charged does not match what you expected. This needs a quick check on the merchant side.',
      steps: ['Note down the exact amount shown in your bank SMS or app', 'Share it with us using the button below so we can verify and correct it'],
    },
    hi: {
      diagnosis: 'Aisa lagta hai ki charge kiya gaya amount aapki expectation se match nahi kar raha. Isse merchant side par check karna hoga.',
      steps: ['Bank SMS ya app mein dikha exact amount note karein', 'Neeche diye button se hume batayein taaki hum verify aur theek kar sakein'],
    },
  },
  {
    key: 'duplicate_payment',
    keywords: ['duplicate', 'twice', 'do baar', 'double charge', 'charged twice', 'दो बार'],
    category: 'merchant_side',
    needsEscalation: false,
    action: 'Start duplicate charge review',
    amount: 899,
    en: {
      diagnosis: 'It looks like you may have been charged twice for the same order. We can look into this and refund the extra charge if confirmed.',
      steps: ['Check your bank statement for two entries with the same amount and date', "Click below and we'll start reviewing it"],
    },
    hi: {
      diagnosis: 'Aisa lagta hai ki ek hi order ke liye do baar paisa kata hai. Hum ise check karke, confirm hone par extra paisa wapas kar denge.',
      steps: ['Bank statement mein same amount aur date ki do entries check karein', 'Neeche click karein, hum review shuru kar denge'],
    },
  },
  {
    key: 'refund_pending',
    keywords: ['refund', 'wapas', 'reversal', 'paisa wapas', 'रिफंड', 'वापस'],
    category: 'bank_side',
    needsEscalation: true,
    action: null,
    amount: 1499,
    en: {
      diagnosis: 'Your refund is taking longer than expected. Refunds usually reach your account in 5-7 working days depending on your bank.',
      steps: ['Check your bank statement once more after 7 working days', 'If it still has not arrived, call your bank with the details below'],
    },
    hi: {
      diagnosis: 'Aapka refund expected samay se zyada le raha hai. Refund aam taur par 5-7 working days mein aapke account mein aa jaata hai, bank par depend karta hai.',
      steps: ['7 working days ke baad ek baar phir se bank statement check karein', 'Agar tab bhi nahi aaya, to neeche di gayi jaankari se bank ko call karein'],
    },
  },
  {
    key: 'link_expired',
    keywords: ['expired', 'link expire', 'session expired', 'expire ho gaya', 'लिंक'],
    category: 'customer_side',
    needsEscalation: false,
    action: 'Send new payment link',
    amount: 349,
    en: {
      diagnosis: 'The payment link or session had expired before you could complete the payment. This happens after a few minutes of inactivity for your safety.',
      steps: ["Use the fresh link below — it's valid for the next 15 minutes", 'Complete the payment without long pauses this time'],
    },
    hi: {
      diagnosis: 'Payment link ya session expire ho gaya tha aapke payment complete karne se pehle. Yeh aapki suraksha ke liye kuch der niष्क्रियता ke baad hota hai.',
      steps: ['Neeche diya naya link use karein — yeh agle 15 minute tak valid hai', 'Is baar bina zyada ruke payment complete karein'],
    },
  },
  {
    key: 'card_expired',
    keywords: ['card expired', 'expired card', 'card ki expiry', 'कार्ड एक्सपायर'],
    category: 'customer_side',
    needsEscalation: false,
    action: 'Send new payment link',
    amount: 899,
    en: {
      diagnosis: 'Your card seems to have expired, which is why the payment could not go through.',
      steps: ['Check the expiry date printed on your card', 'Use a different card, or pay via UPI instead using the link below'],
    },
    hi: {
      diagnosis: 'Aapka card expire ho chuka lagta hai, isi wajah se payment complete nahi hua.',
      steps: ['Card par print expiry date check karein', 'Doosra card use karein, ya neeche diye link se UPI se pay karein'],
    },
  },
  {
    key: 'generic',
    keywords: [],
    category: 'customer_side',
    needsEscalation: false,
    action: 'Send new payment link',
    amount: 899,
    en: {
      diagnosis: 'Your payment did not go through — this can happen if your account balance is low or your card has expired.',
      steps: ['Please check your account balance or your card expiry date', 'Try the payment again using the button below, or pay using UPI instead'],
    },
    hi: {
      diagnosis: 'Aapka payment complete nahi hua — aisa tab hota hai jab account mein balance kam ho ya card expire ho gaya ho.',
      steps: ['Kripya apna account balance ya card ki expiry date check karein', 'Neeche diye button se dobara payment try karein, ya UPI se bhi pay kar sakte hain'],
    },
  },
]

function mockDiagnosis(message, language) {
  const text = (message || '').toLowerCase()
  const match =
    CATEGORIES.find((c) => c.keywords.some((k) => text.includes(k.toLowerCase()))) ||
    CATEGORIES[CATEGORIES.length - 1]

  const t = match[language] || match.en
  return {
    category: match.category,
    confidence: match.key === 'generic' ? 58 : Math.floor(Math.random() * 15) + 78,
    diagnosis: t.diagnosis,
    steps: t.steps,
    action: match.action,
    needsEscalation: match.needsEscalation,
    amount: match.amount,
    txnId: 'TXN' + Math.floor(Math.random() * 900000 + 100000),
  }
}

function authPhone(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  return getPhoneFromToken(token) || 'guest'
}

async function buildResult({ diagnosis, language, phone, problemText }) {
  const result = {
    category: diagnosis.category,
    confidence: diagnosis.confidence,
    diagnosis: diagnosis.diagnosis,
    steps: diagnosis.steps || [],
    action: diagnosis.action || null,
  }

  let stoppedByRule = false
  if (diagnosis.needsEscalation && phone !== 'guest') {
    const count = incrementEscalation(phone)
    if (count > MAX_ESCALATIONS_PER_USER) stoppedByRule = true
  }

  if (diagnosis.needsEscalation && stoppedByRule) {
    result.needsHumanReview = true
    result.diagnosis +=
      language === 'hi'
        ? ' Aapke liye escalation ki seema poori ho chuki hai, isliye is baar hum ise seedhe ek insaan (human specialist) ko bhej rahe hain.'
        : ' You have reached the automated escalation limit for this account, so this case is being routed to a human support specialist instead — this keeps the process safe and compliant.'
  } else if (diagnosis.needsEscalation) {
    result.escalation = buildFallbackScript({
      category: diagnosis.category,
      amount: diagnosis.amount || 0,
      txnId: diagnosis.txnId || 'N/A',
      language,
    })
  }

  const record = createCase({
    amount: diagnosis.amount || 0,
    category: diagnosis.category,
    phone,
    summary: problemText, 
    stage: diagnosis.needsEscalation || stoppedByRule ? 'resolved_or_escalated' : 'closed',
  })

  if (stoppedByRule) {
    addAuditEntry(record.caseId, 'compliance_stop', `Escalation limit (${MAX_ESCALATIONS_PER_USER}) reached for this customer — flagged for human review`)
  } else if (diagnosis.needsEscalation) {
    addAuditEntry(record.caseId, 'escalated', `Routed to ${result.escalation.department} (${result.escalation.phone})`)
  } else {
    addAuditEntry(record.caseId, 'notified_customer', diagnosis.diagnosis) // solution text now lives here in the audit trail, not as the title
  }

  result.caseId = record.caseId
  result.auditLog = record.auditLog
  return result
}

router.post('/diagnose', async (req, res) => {
  const { message, language: requestedLanguage = 'auto' } = req.body || {}
  const phone = authPhone(req)
  if (!message) return res.status(400).json({ error: 'message is required' })

  const language = detectLanguage(message, requestedLanguage)

  try {
    const diagnosis = hasApiKey()
      ? await diagnoseText({ message, language, systemPrompt: SYSTEM_PROMPT })
      : mockDiagnosis(message, language)
    const result = await buildResult({ diagnosis, language, phone, problemText: message })
    res.json(result)
  } catch (err) {
    console.error('[diagnose] Real AI call failed, falling back to mock diagnosis. Reason:', err.message)
    const diagnosis = mockDiagnosis(message, language)
    const result = await buildResult({ diagnosis, language, phone, problemText: message })
    res.json(result)
  }
})

router.post('/diagnose-image', async (req, res) => {
  const { imageBase64, language: requestedLanguage = 'auto' } = req.body || {}
  const phone = authPhone(req)
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' })

  const language = requestedLanguage === 'auto' ? 'en' : requestedLanguage
  const problemText = 'Payment error screenshot uploaded'

  try {
    const diagnosis = hasApiKey()
      ? await diagnoseImage({ imageBase64, language, systemPrompt: SYSTEM_PROMPT })
      : mockDiagnosis('screenshot uploaded — unclear error text', language)
    const result = await buildResult({ diagnosis, language, phone, problemText })
    res.json(result)
  } catch (err) {
    console.error('[diagnose-image] Real AI call failed, falling back to mock diagnosis. Reason:', err.message)
    const diagnosis = mockDiagnosis('screenshot uploaded — unclear error text', language)
    const result = await buildResult({ diagnosis, language, phone, problemText })
    res.json(result)
  }
})

export default router