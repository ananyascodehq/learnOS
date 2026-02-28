import express from 'express'
import { aiDebrief, aiWeeklySummary, aiSuggestNextAction } from '../controllers/aiController'

const router = express.Router()

// POST /api/ai/debrief
router.post('/debrief', aiDebrief)

// POST /api/ai/weekly-summary
router.post('/weekly-summary', aiWeeklySummary)

// POST /api/ai/suggest-next-action
router.post('/suggest-next-action', aiSuggestNextAction)

export default router
