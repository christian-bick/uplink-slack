import { openChat } from './chat'

export default (app) => {
  app.action({ callback_id: 'open-chat' }, openChat(app))
}
