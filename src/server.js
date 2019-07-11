import { App, LogLevel } from '@slack/bolt'
import { appLog, statusLog } from './logger'
import ping from './ping'
import contacts from './contacts'
import chat from './chat'
import chatOpen from './chat-open'
import auth from './auth'
import entry from './entry'
import authorize from './auth/authorize'
import * as express from 'express'

const PORT = process.env.PORT
const LOG_LEVEL = process.env.LOG_LEVEL
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET

export const run = async (port) => {
  // Configure Slack App
  const app = new App({
    signingSecret: SLACK_SIGNING_SECRET,
    logLevel: LOG_LEVEL || LogLevel.INFO,
    authorize
  })

  app.error(err => {
    appLog.error(err)
  })

  // Register http routes
  auth(app)
  ping(app)

  // Register bot handlers
  entry(app)
  chat(app)
  chatOpen(app)
  contacts(app)

  app.receiver.app.use(express.static('public'))

  // Startup Slack App
  port = port || PORT || 3000
  await app.start(port)
  statusLog.info(`app is running on port ${port}`)
  return app
}
