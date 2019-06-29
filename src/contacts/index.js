import { addContacts } from './add-contacts'
import { listContactsAsOptions } from './list-contacts-as-options'
import { showAddContactsDialog } from './add-dialog'
import { listContacts, listContactsMode } from './list-contacts'
import { removeContact } from './remove-contact'

export default (app) => {
  app.action({ callback_id: 'add-contacts' }, addContacts(app))
  app.options({ callback_id: 'open-chat' }, listContactsAsOptions(app))
  app.action('invite-contact', ({ ack }) => ack())
  app.action('add-contacts', showAddContactsDialog(app))
  app.action('list-contacts', listContacts(app))
  app.action('list-contacts-mode', listContactsMode(app))
  app.action('remove-contact', removeContact(app))
}
