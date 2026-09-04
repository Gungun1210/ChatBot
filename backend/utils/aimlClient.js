

const BASE_URL = process.env.AIML_BASE_URL || 'https://api.aimlapi.com/v1'
const API_KEY = process.env.AIML_API_KEY
const TEXT_MODEL = process.env.AIML_TEXT_MODEL || 'gpt-4o-mini'
const VISION_MODEL = process.env.AIML_VISION_MODEL || 'gpt-4o-mini'

export function hasApiKey() {
  return Boolean(API_KEY && API_KEY !== 'your_key_here')
}

async function chatCompletion({ model, messages, temperature = 0.3 }) {
  console.log('[aimlClient] Calling', `${BASE_URL}/chat/completions`, 'with model:', JSON.stringify(model))

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[aimlClient] API error ${res.status}:`, text)
    throw new Error(`AIML API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || '{}'
  try {
    return JSON.parse(raw)
  } catch {
    console.error('[aimlClient] Failed to parse response as JSON:', raw)
    return { raw }
  }
}

export async function diagnoseText({ message, language, systemPrompt }) {
  return chatCompletion({
    model: TEXT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Preferred language: ${language}\nCustomer message: ${message}` },
    ],
  })
}

export async function diagnoseImage({ imageBase64, language, systemPrompt }) {
  return chatCompletion({
    model: VISION_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Preferred language: ${language}. Read this payment error screenshot and diagnose it.` },
          { type: 'image_url', image_url: { url: imageBase64 } },
        ],
      },
    ],
  })
}