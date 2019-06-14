import { openChat } from './open-chat'
import {forwardMessage} from "./chat"

export default (app) => {
  app.action({ callback_id: 'open-chat' }, openChat(app))
  app.message(/.*/, forwardMessage(app))
}
