const key = (prefixes, identifiers) => `${prefixes.join('-')}:${identifiers.join('-')}`

export const activeTeamOfUser = (userEmail) => key(['user', 'team', 'active'], [userEmail])
export const usedTeamsOfUser = (userEmail) => key(['user', 'teams', 'used'], [userEmail])
export const contactsOfUser = (userEmail) => key(['user', 'contacts'], [userEmail])

export const slackUser = (userId) => key(['slack', 'user'], [userId])
export const slackTeam = (teamId) => key(['slack', 'team'], [teamId])
