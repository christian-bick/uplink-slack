import { forwardMessage } from './forward-message'
import { informJoinedUser, rejoinLinkedGroup } from './chat-health'
import { forwardReaction } from './forward-reaction'
import { forwardFileUpdate } from './forward-file-update'

export default (app) => {
  app.message(forwardMessage(app))
  app.event('group_left', rejoinLinkedGroup(app))
  app.event('member_joined_channel', informJoinedUser(app))
  app.event('reaction_added', forwardReaction(app))
  app.event('reaction_removed', forwardReaction(app, true))
  app.event('file_change', forwardFileUpdate(app))
}
