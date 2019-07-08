import store from '../store'
import stringSimilarity from 'string-similarity'
import { extractEmails } from './email'
import redis from '../redis'
import { accountProfileKey } from '../redis-keys'

const rateCriteria = (criteria, emailParts) => {
  return highestRating(emailParts.map(part => ratePart(criteria, part)))
}

const ratePart = (criteria, part) => {
  if (part.startsWith(criteria)) {
    return 1
  } else {
    return stringSimilarity.findBestMatch(criteria, [part]).bestMatch.rating
  }
}

const highestRating = (ratings) => Math.max(...ratings)
const lowestRating = (ratings) => Math.min(...ratings)

export const rateEmail = (criteriaList, email) => {
  const [ emailHead ] = email.split('@')
  const emailHeadParts = email.split(/[.-_]/)
  const emailParts = [email, emailHead, ...emailHeadParts]
  const joinedRating = rateCriteria(criteriaList.join(''), [ email ])
  const splitRating = lowestRating(criteriaList.map(criteria => rateCriteria(criteria, emailParts)))
  return highestRating([joinedRating, splitRating])
}

export const filterEmails = (searchString, emailList) => {
  const criteriaList = searchString.split(' ')
  return emailList.filter(email => rateEmail(criteriaList, email) > 0.5)
}

export const listContactsAsOptions = (app) => async ({ body, context, ack }) => {
  const searchString = body.value
  const contacts = await store.account.contacts.smembers(context.accountId)
  const contactProfiles = await contacts.reduce((multi, accountId) => multi.get(accountProfileKey(accountId)), redis.multi()).execAsync().map(JSON.parse)
  const zippedProfiles = contacts.map((accountId, index) => ({ ...contactProfiles[index], accountId }))

  const filteredProfiles = zippedProfiles.filter(profile => profile.name.includes(searchString))

  const options = filteredProfiles.map(profile => ({
    label: profile.name,
    value: profile.accountId
  }))

  await ack({ options })
}
