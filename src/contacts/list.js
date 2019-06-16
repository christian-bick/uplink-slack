import store from '../store'
import stringSimilarity from 'string-similarity'

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
  const [ emailHead, emailTail ] = email.split('@')
  const emailHeadParts = email.split(/[.-_]/)
  const emailParts = [email, emailHead, emailTail, ...emailHeadParts]
  const joinedRating = rateCriteria(criteriaList.join(''), emailParts)
  const splitRating = lowestRating(criteriaList.map(criteria => rateCriteria(criteria, emailParts)))
  return highestRating([joinedRating, splitRating])
}

export const filterEmails = (searchString, emailList) => {
  const criteriaList = searchString.split(' ')
  return emailList.filter(email => rateEmail(criteriaList, email) > 0.5)
}

export const listContacts = (app) => async ({ body, context, ack }) => {
  console.log(body.value)
  const searchString = body.value
  const { profile } = await app.client.users.profile.get({
    token: context.userToken,
    user: context.userId
  })
  const userEmail = profile.email
  const contacts = await store.user.contacts.smembers(userEmail)
  const filteredContacts = filterEmails(searchString, contacts)

  await ack({
    'options': filteredContacts.map(contact => ({
      'label': contact,
      'value': contact
    }))
  })
}
