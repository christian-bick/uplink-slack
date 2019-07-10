import { accountProfileKey } from '../redis-keys'
import {getEncryptedJson, setEncryptedJson } from '../redis-ops'

const accountProfile = {
  set: (accountId, profile) => setEncryptedJson(accountProfileKey(accountId), profile),
  get: (accountId) => getEncryptedJson(accountProfileKey(accountId))
}

export default accountProfile
