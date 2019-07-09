import { forwardMessage } from './forward-message'
import { removeJoinedUser, rejoinLinkedGroup } from './chat-health'
import { forwardReaction } from './forward-reaction'
import { forwardFileUpdate } from './forward-file-update'
import { catchAsync } from '../errors-async'

export default (app) => {
  app.message(forwardMessage(app))
  app.event('group_left', catchAsync(rejoinLinkedGroup(app)))
  app.event('member_joined_channel', catchAsync(removeJoinedUser(app)))
  app.event('reaction_added', catchAsync(forwardReaction(app)))
  app.event('reaction_removed', catchAsync(forwardReaction(app, true)))
  app.event('file_change', catchAsync(forwardFileUpdate(app)))
}
