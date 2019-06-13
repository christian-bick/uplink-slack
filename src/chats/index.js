import { openChat } from './open-chat'

export default (app) => {
  app.action({ callback_id: 'open-chat' }, openChat(app))
}
