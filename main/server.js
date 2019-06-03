import { App, LogLevel } from '@slack/bolt'
import dotEnv from 'dotenv'
import { statusLog } from './logger'
import ping from './ping'

const run = async (port) => {
  // Load .env file when available
  dotEnv.config()

  // Configure Slack App
  const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
    logLevel: process.env.SLACK_LOG_LEVEL || LogLevel.INFO,
  });

  // Register handlers module by module
  ping(app)

  // Startup Slack App
  await app.start(port || process.env.SLACK_PORT || 8080)
  statusLog.info('App is running')
  return app
}

export {
  run
}