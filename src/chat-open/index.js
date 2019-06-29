import { openChat } from './open-chat'
import { showOpenChatDialog } from './open-dialog'

export default (app) => {
  app.action({ callback_id: 'open-chat' }, openChat(app))
  app.action('open-chat', openChat(app))
  app.action('select-chat', showOpenChatDialog(app))
}
