import { registrationKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const registration = {
  set: (email, registration) => setJson(registrationKey(email), registration),
  get: (email) => getJson(registrationKey(email))
}

export default registration
