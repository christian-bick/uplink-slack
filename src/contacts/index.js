import { listContactsAsOptions } from './list-contacts-as-options'
import { listContacts, listContactsMode } from './list-contacts'
import { removeContact } from './remove-contact'
import { inviteContact } from './invite-contact'
import { catchAsync } from '../errors-async'

export default (app) => {
  app.options({ callback_id: 'open-chat' }, catchAsync(listContactsAsOptions(app)))
  app.action('invite-contact', catchAsync(inviteContact(app)))
  app.action('list-contacts', catchAsync(listContacts(app)))
  app.action('list-contacts-mode', catchAsync(listContactsMode(app)))
  app.action('remove-contact', catchAsync(removeContact(app)))
}
