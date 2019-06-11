import { App, LogLevel } from '@slack/bolt'
import dotEnv from 'dotenv'
import { statusLog } from './logger'
import ping from './ping'
import contacts from './contacts'

const run = async (port) => {
  // Load .env file when available
  dotEnv.config()

  // Configure Slack App
  const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
    logLevel: process.env.SLACK_LOG_LEVEL || LogLevel.INFO
  })

  // Register modules
  ping(app)
  contacts(app)

  // Startup Slack App
  port = port || process.env.SLACK_PORT || 3000
  await app.start(port)
  statusLog.info(`App is running on port ${port}`)
  return app
}

export {
  run
}
