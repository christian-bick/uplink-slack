import { addContacts } from './add-contacts'
import { listContacts } from './list-contacts'
import { showAddContactsDialog } from './add-dialog'

export default (app) => {
  app.action({ callback_id: 'add-contacts' }, addContacts(app))
  app.options({ callback_id: 'open-chat' }, listContacts(app))
  app.action('invite-contact', ({ ack }) => ack())
  app.action('add-contacts', showAddContactsDialog(app))
}
