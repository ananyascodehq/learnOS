import fs from 'fs'
import path from 'path'

export function logAiCall({ userId, feature, latency_ms, success }: any) {
  const logDir = path.join(__dirname, '../../logs')
  const logPath = path.join(logDir, 'ai_events.log')

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    user: userId,
    feature,
    latency_ms,
    success
  }) + '\n'
  fs.appendFile(logPath, line, (err) => {
    if (err) console.error('Failed to log AI event:', err)
  })
}
