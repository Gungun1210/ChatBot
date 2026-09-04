# ChatBot — AI Revenue Recovery

One website with the core features: multilingual chat, voice input, screenshot
diagnosis, guided fixes, escalation scripts, and case tracking (list + lookup).
Helping customer to understand problem and how to fix it in an easy way and in their own preferrable language 

## Folder structure
```
ChatBot-app/
  frontend/            React app (Vite)
  backend/              Express API + AI/ML logic together
    server.js
    routes/
      diagnose.js       text + screenshot diagnosis endpoints
      cases.js          case list + case lookup + stats endpoints
    utils/
      aimlClient.js      <- the AI/ML API integration (OpenAI-compatible)
      helplines.js       escalation helpline directory + script builder
      caseStore.js        in-memory case storage
```

## What's included
- OTP-based login (no passwords) — phone number → OTP → session token
- Profile menu (top right) → connect your Razorpay account (mock OAuth for the demo)
- Multilingual chat: text, voice, and screenshot diagnosis — auto-detects Hindi/Tamil/Telugu/Bengali script and replies in the same language, in everyday non-technical wording
- Escalation: correct helpline, toll-free tag, nearest-branch guidance, and a ready-to-read call script
- Compliance stopping rule: after 3 automated escalations for the same customer, further cases are routed to human review instead of another automated script
- Every case has a date/time and a full audit trail (tap a case in "My Cases" to expand it)
- Case list (auto-updating) + secondary case-ID lookup
- Impact strip with 4 live metrics

## Run the backend
```
cd ChatBot-app/backend
npm install
npm start                
```

## Run the frontend
```
cd ChatBot-app/frontend
npm install
npm run dev           
```
