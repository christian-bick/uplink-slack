import { listContactsAsOptions } from './list-contacts-as-options'
import { inviteContact } from './invite-contact'
import { blockContact } from './block-contact'
import { catchAsync } from '../errors-async'

export default (app) => {
  app.options({ callback_id: 'open-chat' }, catchAsync(listContactsAsOptions(app)))
  app.action('invite-contact', catchAsync(inviteContact(app)))
  app.action('block-contact', catchAsync(blockContact(app)))
}
