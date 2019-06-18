import { userRegistrationKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const userRegistration = {
  set: (email, registration) => setJson(userRegistrationKey(email), registration),
  get: (email) => getJson(userRegistrationKey(email))
}

export default userRegistration
