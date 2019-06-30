const key = (prefixes, identifiers) => `${prefixes.join('-')}:${identifiers.join('-')}`

export const userRegistrationKey = (userEmail) => key(['registration'], [userEmail])
export const userContactsKey = (userEmail) => key(['contacts'], [userEmail])
export const userContactsMirroredKey = (userEmail) => key(['contacts', 'mirrored'], [userEmail])

export const linkKey = (sourceEmail, sinkEmail) => key(['link'], [sourceEmail, sinkEmail])

export const slackProfileKey = (teamId, userId) => key(['slack', 'profile'], [ teamId, userId ])
export const slackUserKey = (teamId, userId) => key(['slack', 'user'], [ teamId, userId ])
export const slackTeamKey = (teamId) => key(['slack', 'team'], [teamId])
export const slackGroupKey = (teamId, groupId) => key(['slack', 'group'], [ teamId, groupId ])
