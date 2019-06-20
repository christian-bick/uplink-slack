import { openChat } from './open-chat'
import { forwardMessage} from './forward-message'
import { informJoinedUser, rejoinLinkedGroup } from './chat-health'

export default (app) => {
  app.message(/.*/, forwardMessage(app))
  app.action({ callback_id: 'open-chat' }, openChat(app))
  app.event('group_left', rejoinLinkedGroup(app))
  app.event('member_joined_channel', informJoinedUser(app))
}
