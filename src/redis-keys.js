const key = (prefixes, identifiers) => `${prefixes.join('-')}:${identifiers.join('-')}`

export const userRegistration = (userEmail) => key(['registration'], [userEmail])
export const userContacts = (userEmail) => key(['contacts'], [userEmail])

export const slackUser = (userId) => key(['slack', 'user'], [userId])
export const slackTeam = (teamId) => key(['slack', 'team'], [teamId])
export const slackGroup = (userEmail, contactEmail) => key(['slack', 'group'], [userEmail, contactEmail])
