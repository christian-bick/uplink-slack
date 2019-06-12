import { App, LogLevel } from '@slack/bolt'
import { statusLog } from './logger'
import ping from './ping'
import contacts from './contacts'
import chats from './chats'
import auth from './auth'
import boarding from './boarding'
import authorize from './auth/authorize'

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const SLACK_LOG_LEVEL = process.env.SLACK_LOG_LEVEL
const SLACK_PORT = process.env.SLACK_PORT

const run = async (port) => {
  // Configure Slack App
  const app = new App({
    signingSecret: SLACK_SIGNING_SECRET,
    logLevel: SLACK_LOG_LEVEL || LogLevel.INFO,
    authorize
  })

  // Register
  auth(app)
  chats(app)
  ping(app)
  contacts(app)
  boarding(app)

  // Startup Slack App
  port = port || SLACK_PORT || 3000
  await app.start(port)
  statusLog.info(`App is running on port ${port}`)
  return app
}

export {
  run
}
