import registration from './registration'
import invites from './invites'

import accountProfile from './account-profile'
import accountLink from './account-link'
import accountAddress from './account-address'
import accountContacts from './account-contacts'
import accountMedium from './account-medium'

import slackUser from './slack-user'
import slackTeam from './slack-team'
import slackConversation from './slack-conversation'

import usageInvites from './usage-invites'
import usageChats from "./usage-chats"

export default {
  registration,
  invites,
  slack: {
    team: slackTeam,
    user: slackUser,
    conversation: slackConversation
  },
  account: {
    medium: accountMedium,
    link: accountLink,
    profile: accountProfile,
    address: accountAddress,
    contacts: accountContacts
  },
  usage: {
    invites: usageInvites,
    chats: usageChats
  }
}
