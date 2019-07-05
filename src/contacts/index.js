import { addContacts } from './add-contacts'
import { listContactsAsOptions } from './list-contacts-as-options'
import { showAddContactsDialog } from './add-dialog'
import { listContacts, listContactsMode } from './list-contacts'
import { removeContact } from './remove-contact'
import { inviteContact } from './invite-contact'
import { catchAsync } from '../errors-async'

export default (app) => {
  app.action({ callback_id: 'add-contacts' }, catchAsync(addContacts(app)))
  app.options({ callback_id: 'open-chat' }, catchAsync(listContactsAsOptions(app)))
  app.action('invite-contact', catchAsync(inviteContact(app)))
  app.action('add-contacts', catchAsync(showAddContactsDialog(app)))
  app.action('list-contacts', catchAsync(listContacts(app)))
  app.action('list-contacts-mode', catchAsync(listContactsMode(app)))
  app.action('remove-contact', catchAsync(removeContact(app)))
}
