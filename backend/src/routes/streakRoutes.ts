import { Router } from 'express'
import { handleGetUserStreak } from '../controllers/streakController'

const router = Router()

// GET /api/streak/:userId
router.get('/:userId', handleGetUserStreak)

export default router
