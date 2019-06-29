import { openChat } from '../chat-open/open-chat'

export default (app) => {
  app.action({ callback_id: 'open-chat' }, openChat(app))
}
