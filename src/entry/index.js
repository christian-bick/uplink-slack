import { reactToAppHomeOpened } from './entry'

export default (app) => {
  app.event('app_home_opened', reactToAppHomeOpened(app))
  app.action('entry-overflow', ({ ack }) => ack())
  app.action('contact-support', ({ ack }) => ack())
  app.action('user-install-init', ({ ack }) => ack())
}
