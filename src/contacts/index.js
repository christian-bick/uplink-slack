import { addContacts } from './add'
import {listContacts} from "./list"

export default (app) => {
  app.action({ callback_id: 'add-contacts' }, addContacts(app))
  app.options({ callback_id: 'open-chat' }, listContacts(app))
}
