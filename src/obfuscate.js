import shortHash from 'short-hash'
import { omit } from 'lodash'

const HASH_SALT = process.env.HASH_SALT || ''
const OMITTED_FIELDS = ['botToken', 'userToken', 'matches', 'token']

export const obfuscateValue = (value) => {
  if (!value || HASH_SALT === 'no-hash') {
    return value
  } else {
    return shortHash(`${HASH_SALT}${value}`)
  }
}
export const obfuscatePersonalData = (obj) => {
  if (!obj) {
    return obj
  } else {
    const omitted = omit(obj, OMITTED_FIELDS)
    return {
      ...omitted,
      teamId: obfuscateValue(obj.teamId),
      userId: obfuscateValue(obj.userId),
      botId: obfuscateValue(obj.botId),
      channelId: obfuscateValue(obj.channelId),
      email: obfuscateValue(obj.email),
      name: obfuscateValue(obj.name)
    }
  }
}
