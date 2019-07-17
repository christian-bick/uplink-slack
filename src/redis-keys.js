import { hashed } from './redis-crypto'

const key = (prefixes, identifiers) => `${prefixes.join('-')}:${identifiers.join('-')}`

export const accountKey = (suffix, identifiers) => key(['account'].concat(suffix), identifiers)
export const slackKey = (suffix, identifiers) => key(['slack'].concat(suffix), identifiers)
export const usageKey = (suffix, identifiers) => key(['usage'].concat(suffix), identifiers)

export const registrationKey = (email) => key(['registration'], [ hashed(email) ])
export const invitesKey = (email) => key(['invites'], [ hashed(email) ])
export const mappingDmKey = (messageId) => key(['mapping', 'dm'], [ messageId ])

export const accountMediumKey = (accountId) => accountKey('medium', [ accountId ])
export const accountProfileKey = (accountId) => accountKey('profile', [ accountId ])
export const accountContactsKey = (accountId) => accountKey('contacts', [ accountId ])
export const accountBlacklistKey = (accountId) => accountKey('blacklist', [ accountId ])
export const accountLinksKey = (accountId) => accountKey('links', [ accountId ])

export const slackUsersKey = (teamId) => slackKey('users', [ teamId ])
export const slackTeamKey = (teamId) => slackKey('team', [ teamId ])
export const slackConversationsKey = (teamId) => slackKey('conversations', [ teamId ])

export const usageInvitesKey = (accountId) => usageKey('invites', [ accountId ])
export const usageChatsKey = (accountId) => usageKey('chats', [ accountId ])
