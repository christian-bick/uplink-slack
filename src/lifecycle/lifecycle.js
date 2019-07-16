import * as keys from "../redis-keys"

export const immediatelyRemovedKeys = ({ teamId, userId, accountId }) => [
  // Medium is removed immediately to break the link between account id and slack user
  // Its (none-)existence the one reliable way to know whether the app is installed
  keys.accountMediumKey(accountId)
]

export const eventuallyRemovedKeys = ({ teamId, userId, accountId }) => [
  keys.accountProfileKey(accountId),
  keys.accountBlacklistKey(accountId),
  keys.accountContactsKey(accountId),
  keys.accountLinksKey(accountId),
  keys.slackConversationsKey(teamId)
]
