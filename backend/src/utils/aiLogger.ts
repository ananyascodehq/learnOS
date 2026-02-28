import fs from 'fs'
import path from 'path'

const logPath = path.join(__dirname, '../../logs/ai_events.log')

export function logAiCall({ userId, feature, latency_ms, success }: any) {
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
