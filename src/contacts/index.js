import { addContacts } from './add'

export default (app) => {
  app.action({ callback_id: 'add-contacts' }, addContacts(app))
}
