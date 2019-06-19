import bunyan, { INFO } from 'bunyan'
import shortHash from 'short-hash'
import _ from 'lodash'

const LOG_LEVEL = process.env.LOG_LEVEL || INFO

const HASH_SALT = 'x1yc'
const OMITTED_FIELDS = ['botToken', 'userToken']

const obfuscateValue = (value) => value ? shortHash(`${HASH_SALT}${value}`) : value

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

const obfuscateSensitiveParams = {
  user: obfuscatePersonalData,
  team: obfuscatePersonalData,
  link: obfuscatePersonalData,
  registration: obfuscatePersonalData,
  context: obfuscatePersonalData,
  source: obfuscatePersonalData,
  target: obfuscatePersonalData
}

const statusLog = bunyan.createLogger({ name: 'status', level: LOG_LEVEL })
const oauthLog = bunyan.createLogger({ name: 'oauth', level: LOG_LEVEL, serializers: obfuscateSensitiveParams })
const appLog = bunyan.createLogger({ name: 'app', level: LOG_LEVEL, serializers: obfuscateSensitiveParams })

export {
  statusLog,
  oauthLog,
  appLog
}
