import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import streakRoutes from './routes/streakRoutes'
import aiRoutes from './routes/aiRoutes'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import fs from 'fs'
import path from 'path'

// Load environment variables
config()

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Logging
const logStream = fs.createWriteStream(path.join(__dirname, '../../logs/ai.log'), { flags: 'a' })
app.use(morgan('combined', { stream: logStream }))

// Routes
app.get('/', (req, res) => {
  res.send('LearnOS Backend is running!')
})

// Rate limiting for AI endpoints (50 calls/user/day)
const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50,
  keyGenerator: (req) => req.body.userId || req.ip,
  message: 'Daily AI usage limit reached. Try again tomorrow.',
})
app.use('/api/ai', aiLimiter)

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
