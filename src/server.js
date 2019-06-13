import { App, LogLevel } from '@slack/bolt'
import { statusLog } from './logger'
import ping from './ping'
import contacts from './contacts'
import chats from './chats'
import auth from './auth'
import entry from './entry'
import authorize from './auth/authorize'

const PORT = process.env.PORT
const LOG_LEVEL = process.env.LOG_LEVEL
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET

const run = async (port) => {
  // Configure Slack App
  const app = new App({
    signingSecret: SLACK_SIGNING_SECRET,
    logLevel: LOG_LEVEL || LogLevel.INFO,
    authorize
  })

  // Register
  auth(app)
  chats(app)
  ping(app)
  contacts(app)
  entry(app)

  // Startup Slack App
  port = port || PORT || 3000
  await app.start(port)
  statusLog.info(`App is running on port ${port}`)
  return app
}

export {
  run
}
