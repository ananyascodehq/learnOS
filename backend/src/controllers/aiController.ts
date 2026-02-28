import { Request, Response } from 'express'
import { runDebrief, runWeeklySummary, runNextActionSuggestion } from '../services/aiService'
import { logAiCall } from '../utils/aiLogger'

export async function aiDebrief(req: Request, res: Response) {
  try {
    const { sessionId, category, duration, what_i_did, was_useful, next_action, userId } = req.body
    const start = Date.now()
    let result, error = null
    try {
      result = await runDebrief({ sessionId, category, duration, what_i_did, was_useful, next_action })
    } catch (e) {
      error = e
    }
    const latency = Date.now() - start
    logAiCall({ userId, feature: 'debrief', latency_ms: latency, success: !error })
    if (error) throw error
    res.json({ success: true, ai_debrief: result })
  } catch (err) {
    res.status(500).json({ success: false, error: 'AI debrief failed' })
  }
}

export async function aiWeeklySummary(req: Request, res: Response) {
  try {
    const { userId, weekStart } = req.body
    const start = Date.now()
    let result, error = null
    try {
      result = await runWeeklySummary({ userId, weekStart })
    } catch (e) {
      error = e
    }
    const latency = Date.now() - start
    logAiCall({ userId, feature: 'weekly-summary', latency_ms: latency, success: !error })
    if (error) throw error
    res.json({ success: true, summary: result })
  } catch (err) {
    res.status(500).json({ success: false, error: 'AI weekly summary failed' })
  }
}

export async function aiSuggestNextAction(req: Request, res: Response) {
  try {
    const { userId, category, what_i_did, recent_next_actions } = req.body
    const start = Date.now()
    let result, error = null
    try {
      result = await runNextActionSuggestion({ userId, category, what_i_did, recent_next_actions })
    } catch (e) {
      error = e
    }
    const latency = Date.now() - start
    logAiCall({ userId, feature: 'suggest-next-action', latency_ms: latency, success: !error })
    if (error) throw error
    res.json({ success: true, suggestion: result })
  } catch (err) {
    console.error('AI suggest next action error:', err)
    res.status(500).json({ success: false, error: 'AI next-action suggestion failed' })
  }
}
