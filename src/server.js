import { App, LogLevel } from '@slack/bolt'
import dotEnv from 'dotenv'
import { statusLog } from './logger'
import ping from './ping'
import contacts from './contacts'
import chats from './chats'

const run = async (port) => {
  // Load .env file when available
  dotEnv.config()

  // Configure Slack App
  const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    logLevel: process.env.SLACK_LOG_LEVEL || LogLevel.INFO,
    authorize: async () => ({
      teamId: 'T12345',
      botId: 'BK9HWFACU',
      userToken: 'xoxp-470302301987-471454174487-655608513380-a7d4144889dfae6ea7cdf8c45b988f6a',
      botToken: 'xoxb-470302301987-655608521924-Eyl6s19RBGr76y8xMtE6S4xa',
      botUserId: 'UK9HWFBT6'
    })
  })

  // Register modules
  chats(app)
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
