import userRegistration from './registration'
import userContacts from './contacts'

import link from './link'

import slackUser from './slack-user'
import slackTeam from './slack-team'
import slackGroup from './slack-group'
import slackProfile from "./slack-profile"

export default {
  link,
  slack: {
    team: slackTeam,
    user: slackUser,
    profile: slackProfile,
    group: slackGroup
  },
  user: {
    registration: userRegistration,
    contacts: userContacts
  }
}
