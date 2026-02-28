import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import streakRoutes from './routes/streakRoutes'

// Load environment variables
config()

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.send('LearnOS Backend is running!')
})

app.use('/api/streak', streakRoutes)

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
