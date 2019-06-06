import greetings from './greetings'
import health from './health'

export default (app) => {
  greetings(app)
  health(app)
}
