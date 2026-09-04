# ChatBot — AI Revenue Recovery (Razorpay Buildathon)

One website with the core features: multilingual chat, voice input, screenshot
diagnosis, guided fixes, escalation scripts, and case tracking (list + lookup).
Frontend is React (Vite). Backend is Node/Express — the AI/ML integration
lives inside it (not a separate service), so there's just one backend folder
to run. If no API key is set, it falls back to built-in mock responses so the
whole flow still works for a demo.

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
cp .env.example .env      # add your AIML_API_KEY, or leave as-is to use mock mode
npm start                 # runs on http://localhost:5050
```

## Run the frontend
```
cd ChatBot-app/frontend
npm install
npm run dev                # runs on http://localhost:5173, proxies /api to :5050
```

Open http://localhost:5173

## Notes
- Without an `AIML_API_KEY`, `/api/diagnose` and `/api/diagnose-image` return
  realistic mock diagnoses so text, voice, and screenshot flows all still work
  end-to-end for a live demo.
- With a key (from aimlapi.com or any OpenAI-compatible provider), set
  `AIML_BASE_URL` / `AIML_TEXT_MODEL` / `AIML_VISION_MODEL` in `.env` and real
  model calls are used instead.
- Voice input uses the browser's built-in Web Speech API (works best in
  Chrome) — no extra backend work needed.
- Cases are stored in memory for the demo; two sample cases are pre-seeded so
  the tracker has something to show immediately (try `SHY-1027` or `SHY-1028`).
- "My Cases" (below the chat) lists every registered case automatically and
  refreshes itself the moment a new one is created from the chat widget — no
  need to know the case ID. The ID search box underneath is a secondary,
  optional lookup.
