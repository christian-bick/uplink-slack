import bunyan from 'bunyan'
const statusLog = bunyan.createLogger({name: 'Status'});

export {
  statusLog,
}
