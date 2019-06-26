import { respondToHealthCheck } from './health'

export default (app) => {
  app.receiver.app.get('/', respondToHealthCheck)
}
