import { Request, Response } from 'express'
import { getStreakForUser } from '../services/streakService'

export async function handleGetUserStreak(req: Request, res: Response) {
  try {
    const { userId } = req.params
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' })
    }

    const streakData = await getStreakForUser(userId)

    if (!streakData) {
      return res.status(404).json({ message: 'Streak data not found for this user.' })
    }

    return res.status(200).json(streakData)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return res.status(500).json({ message })
  }
}
