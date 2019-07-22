export const blacklisted = {
  profile: {
    name: 'Captain Blacklisted',
    email: 'blacklisted@uplink-chat.com'
  },
  user: {
    accountId: 'blacklisted-account-id',
  }
}

export const buildCurrent = (config) =>  ({
  profile : {
    name: 'Current User',
    email: config.env.CURRENT_EMAIL
  },
  team: {
    teamId: config.env.CURRENT_TEAM_ID,
    botToken: config.env.CURRENT_TEAM_BOT_TOKEN,
    botId: config.env.CURRENT_TEAM_BOT_ID
  },
  user: {
    teamId: config.env.CURRENT_TEAM_ID,
    userId: config.env.CURRENT_USER_ID,
    userToken: config.env.CURRENT_USER_TOKEN,
    accountId: 'current-account-id'
  }
})
