import { receiveContacts } from './add'
import { EMAIL_PATTERN } from './email'

export default (app) => {
  app.message(EMAIL_PATTERN, receiveContacts(app))
}
