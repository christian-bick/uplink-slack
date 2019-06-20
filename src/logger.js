import bunyan, { INFO } from 'bunyan'
import shortHash from 'short-hash'
import _ from 'lodash'

const LOG_LEVEL = process.env.LOG_LEVEL || INFO
const HASH_SALT = process.env.HASH_SALT || ''

const OMITTED_FIELDS = ['botToken', 'userToken']

const obfuscateValue = (value) => {
  if (!value || HASH_SALT === 'no-hash') {
    return value
  } else {
    return shortHash(`${HASH_SALT}${value}`)
  }
}

const obfuscatePersonalData = (obj) => {
  if (!obj) {
    return obj
  } else {
    const omitted = _.omit(obj, OMITTED_FIELDS)
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

const serializeMessage = (message) => {
  return {
    type: message.type,
    subtype: message.subtype,
    userId: obfuscateValue(message.user),
    channelId: obfuscateValue(message.channel)
  }
}

const obfuscateSensitiveParams = {
  // Individual attributes
  teamId: obfuscateValue,
  userId: obfuscateValue,
  botId: obfuscateValue,
  channelId: obfuscateValue,
  email: obfuscateValue,
  name: obfuscateValue,
  // Common objects
  user: obfuscatePersonalData,
  team: obfuscatePersonalData,
  link: obfuscatePersonalData,
  reverseLink: obfuscatePersonalData,
  group: obfuscatePersonalData,
  registration: obfuscatePersonalData,
  context: obfuscatePersonalData,
  message: serializeMessage,
  // Standard serializers
  err: bunyan.stdSerializers.err
}

const statusLog = bunyan.createLogger({ name: 'status', level: LOG_LEVEL })
const appLog = bunyan.createLogger({ name: 'app', level: LOG_LEVEL, serializers: obfuscateSensitiveParams })

export {
  statusLog,
  appLog
}
