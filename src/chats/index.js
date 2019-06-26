import { openChat } from './open-chat'
import { forwardMessage } from './forward-message'
import { informJoinedUser, rejoinLinkedGroup } from './chat-health'
import { forwardReaction } from './forward-reaction'

export default (app) => {
  app.message(forwardMessage(app))
  app.action({ callback_id: 'open-chat' }, openChat(app))
  app.event('group_left', rejoinLinkedGroup(app))
  app.event('member_joined_channel', informJoinedUser(app))
  app.event('reaction_added', forwardReaction(app))
  app.event('reaction_removed', forwardReaction(app, true))
}
