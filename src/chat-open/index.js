import { openChat } from './open-chat'
import { showOpenChatDialog } from './open-dialog'
import { catchAsync } from '../errors-async'

export default (app) => {
  app.action({ callback_id: 'open-chat' }, catchAsync(openChat(app)))
  app.action('open-chat', catchAsync(openChat(app)))
  app.action('select-chat', catchAsync(showOpenChatDialog(app)))
}
