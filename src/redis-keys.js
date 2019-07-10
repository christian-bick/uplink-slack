import { hashed } from './redis-crypto'

const key = (prefixes, identifiers) => `${prefixes.join('-')}:${identifiers.join('-')}`

export const registrationKey = (email) => key(['registration'], [hashed(email)])
export const invitesKey = (email) => key(['invites'], [hashed(email)])

export const accountMediumKey = (accountId) => key(['account', 'medium'], [ accountId ])
export const accountProfileKey = (accountId) => key(['account', 'profile'], [ accountId ])
export const accountAddressKey = (accountId) => key(['account', 'address'], [ accountId ])
export const accountContactsKey = (accountId) => key(['account', 'contacts'], [ accountId ])
export const accountLinkKey = (sourceAccountId, sinkAccountId) => key(['account', 'link'], [sourceAccountId, sinkAccountId])

export const slackUserKey = (teamId, userId) => key(['slack', 'user'], [ teamId, userId ])
export const slackTeamKey = (teamId) => key(['slack', 'team'], [teamId])
export const slackConversationKey = (teamId, groupId) => key(['slack', 'conversation'], [ teamId, groupId ])

export const usageInvitesKey = (accountId) => key(['usage', 'invites'], [ accountId ])
export const usageChatsKey = (accountId) => key(['usage', 'chats'], [ accountId ])
