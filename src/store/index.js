import registration from './registration'
import invites from './invites'

import mappingDm from './mapping-dm'

import accountProfile from './account-profile'
import accountLink from './account-link'
import accountContacts from './account-contacts'
import accountMedium from './account-medium'
import accountBlacklist from './account-blacklist'

import slackUser from './slack-user'
import slackTeam from './slack-team'
import slackConversation from './slack-conversation'

import usageInvites from './usage-invites'
import usageChats from "./usage-chats"

export default {
  registration,
  invites,
  mapping: {
    dm: mappingDm
  },
  slack: {
    team: slackTeam,
    user: slackUser,
    conversation: slackConversation
  },
  account: {
    medium: accountMedium,
    link: accountLink,
    profile: accountProfile,
    contacts: accountContacts,
    blacklist: accountBlacklist
  },
  usage: {
    invites: usageInvites,
    chats: usageChats
  }
}
