import shortHash from 'short-hash'
import { omit } from 'lodash'
import { HASH_SALT } from './global'

const OMITTED_FIELDS = ['matches', 'token']

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
      name: obfuscateValue(obj.name),
      botToken: obfuscateValue(obj.botToken),
      userToken: obfuscateValue(obj.userToken)
    }
  }
}

const obfuscateHalfOfString = (string) => {
  const length = string.length
  let from = length < 8 ? Math.floor(length / 3) : Math.ceil(length / 4)
  let to = length < 8 ? Math.ceil((2 * length) / 3) : Math.floor((3 * length) / 4)
  return `${string.slice(0, from)}${string.slice(from, to).replace(/./g, '*')}${string.slice(to, length)}`
}

export const obfuscateEmailAddress = (email) => {
  const [ head, tail ] = email.split('@')
  const obfuscatedHead = obfuscateHalfOfString(head)
  const deconstructedTail = tail.split('.')
  const tld = deconstructedTail[deconstructedTail.length - 1]
  deconstructedTail.pop()
  const tailWithoutTld = deconstructedTail.join('.')
  const obfuscatedTailWithoutTld = obfuscateHalfOfString(tailWithoutTld)
  return `${obfuscatedHead}@${obfuscatedTailWithoutTld}.${tld}`
}
