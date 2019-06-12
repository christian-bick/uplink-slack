import bunyan from 'bunyan'
const statusLog = bunyan.createLogger({ name: 'Status' })
const oauthLog = bunyan.createLogger({ name: 'OAuth' })

export {
  statusLog,
  oauthLog
}
