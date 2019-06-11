const key = (prefixes, identifiers) => `${prefixes.join('-')}:${identifiers.join('-')}`

export const activeTeamOfUser = (userEmail) => key(['user', 'team', 'active'], [userEmail])
export const installedTeamsOfUser = (userEmail) => key(['user', 'teams', 'installed'], [userEmail])
export const contactsOfUser = (userEmail) => key(['user', 'contacts'], [userEmail])
