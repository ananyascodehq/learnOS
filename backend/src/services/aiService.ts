import axios from 'axios'

// --- PROMPT CONSTANTS ---
const DEBRIEF_SYSTEM_PROMPT = `You are a study coach. Given a student's session data, provide exactly two sentences:\nSentence 1 — What limited the session's effectiveness, or what went well if it was productive.\nSentence 2 — One concrete, specific next action the student should take.\nBe direct. No filler. No encouragement. Max 60 words total.`

const WEEKLY_SUMMARY_SYSTEM_PROMPT = `You are a study coach. Given a week's study data, provide:\n1. Dominant pattern\n2. Biggest weakness\n3. This week's focus recommendation.\nEach as a single line.`

const NEXT_ACTION_SYSTEM_PROMPT = `Given the session context, suggest a single next action. Start with a verb. Under 15 words. No explanation.`

// --- SERVICE IMPLEMENTATIONS ---

export async function runDebrief({ sessionId, category, duration, what_i_did, was_useful, next_action }) {
  // Compose prompt
  const userPrompt = `Category: ${category}\nDuration: ${duration} minutes\nWhat I did: ${what_i_did}\nWas it useful: ${was_useful}\nPlanned next action: ${next_action}`
  // Call Groq API (Llama 3.1 8B Instruct)
  const response = await axios.post('https://api.groq.com/v1/chat/completions', {
    model: 'llama3-8b-8192',
    messages: [
      { role: 'system', content: DEBRIEF_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 120,
    temperature: 0.7
  }, {
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
  })
  // Persist result to DB (not implemented here)
  return response.data.choices[0].message.content.trim()
}

export async function runWeeklySummary({ userId, weekStart }) {
  // Compose prompt (details omitted)
  // Call Hugging Face Inference API (Mistral 7B)
  // Persist result to DB (not implemented here)
  return 'Weekly summary (mocked)'
}

export async function runNextActionSuggestion({ userId, category, what_i_did, recent_next_actions }) {
  // Compose prompt
  const userPrompt = `Category: ${category}\nWhat I did: ${what_i_did}\nRecent next actions: ${recent_next_actions?.join('; ')}`
  // Call Groq API (Llama 3.1 8B Instruct)
  const response = await axios.post('https://api.groq.com/v1/chat/completions', {
    model: 'llama3-8b-8192',
    messages: [
      { role: 'system', content: NEXT_ACTION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 32,
    temperature: 0.5
  }, {
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
  })
  return response.data.choices[0].message.content.trim()
}
