import { openChat } from './open-chat'
import { forwardMessage } from './chat'
import { informJoinedUser, rejoinLinkedGroup } from './chat-health'

export default (app) => {
  app.action({ callback_id: 'open-chat' }, openChat(app))
  app.message(/.*/, forwardMessage(app))
  app.event('group_left', rejoinLinkedGroup(app))
  app.event('member_joined_channel', informJoinedUser(app))
}
