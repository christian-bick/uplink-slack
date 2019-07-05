import { reactToAppHomeOpened } from './entry'
import {catchAsync} from "../errors-async"

export default (app) => {
  app.event('app_home_opened', catchAsync(reactToAppHomeOpened(app)))
  app.action('entry-overflow', ({ ack }) => ack())
  app.action('contact-support', ({ ack }) => ack())
  app.action('user-install-init', ({ ack }) => ack())
}
