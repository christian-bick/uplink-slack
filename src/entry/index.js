import { reactToAppHomeOpened, showSelectChatDialog } from './entry'

export default (app) => {
  app.event('app_home_opened', reactToAppHomeOpened(app))
  app.action('select-chat', showSelectChatDialog(app))
}
