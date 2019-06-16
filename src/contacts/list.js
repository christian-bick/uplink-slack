import store from '../store'
import stringSimilarity from 'string-similarity'
import { extractEmails } from './email'

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

export const listContacts = (app) => async ({ body, context, ack }) => {
  const searchString = body.value
  const { email: userEmail } = await store.slackProfile.get(context.userId)
  const contacts = await store.user.contacts.smembers(userEmail)
  const filteredContacts = filterEmails(searchString, contacts)

  const options = filteredContacts.map(contact => ({
    label: contact,
    value: contact
  }))

  const extractedEmails = extractEmails(searchString)
  if (extractedEmails && extractedEmails[0]) {
    options.push({
      label: searchString,
      value: extractedEmails[0]
    })
  }

  await ack({ options })
}
