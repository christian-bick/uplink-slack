import { reactToAppHomeOpened, showAddContactsDialog, showOpenChatDialog } from './entry'

export default (app) => {
  app.event('app_home_opened', reactToAppHomeOpened(app))
  app.action('select-chat', showOpenChatDialog(app))
  app.action('add-contacts', showAddContactsDialog(app))
  app.action('entry-overflow', ({ack}) => ack())
}
