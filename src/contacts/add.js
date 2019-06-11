import { promisify } from 'util'
import { findEmailLinks, EMAIL_PATTERN, reduceEmailLinks } from './email'
import redis from '../redis'

export const receiveContacts = (app) => async ({ message, context, body, say }) => {
  const userInfo = await app.client.users.info({
    token: context.botToken,
    user: message.user
  })

  const userEmail = userInfo.user.profile.email

  const emailLinkList = findEmailLinks(message.text)
  const emailAddressList = reduceEmailLinks(emailLinkList)
  await redis.setAsync(`active-${userEmail}`, body.team_id)
  await redis.saddAsync(`install-${userEmail}`, body.team_id)
  await redis.saddAsync(`contact-${userEmail}`, ...emailAddressList)

  const installKeys = emailAddressList.map(email => `active-${email}`)

  let multi = redis.multi()
  installKeys.forEach((key) => {
    multi = multi.get(key)
  })

  const keysExist = await promisify(multi.exec).bind(multi)()
  console.log(keysExist)

  const emailBlocks = emailAddressList.map(emailAddress => ({
    'type': 'section',
    'text': {
      'type': 'mrkdwn',
      'text': emailAddress
    }
  }))

  say({
    blocks: emailBlocks
  })
}

export default (app) => {
  app.message(EMAIL_PATTERN, receiveContacts(app))
}
