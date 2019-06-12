import { replyToGreetings } from './greetings'
import { respondToHealthCheck } from './health'

export default (app) => {
  app.receiver.app.get('/', respondToHealthCheck)
  // app.message('hi', replyToGreetings)
}
