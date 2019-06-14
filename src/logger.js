import bunyan, { INFO } from 'bunyan'

const LOG_LEVEL = process.env.LOG_LEVEL || INFO

const statusLog = bunyan.createLogger({ name: 'status', level: LOG_LEVEL })
const oauthLog = bunyan.createLogger({ name: 'oauth', level: LOG_LEVEL })
const appLog = bunyan.createLogger({ name: 'app', level: LOG_LEVEL })

export {
  statusLog,
  oauthLog,
  appLog
}
