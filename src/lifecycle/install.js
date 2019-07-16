import uuid from 'uuid/v4'
import store from '../store'
import { appLog } from '../logger'
import { eventuallyRemovedKeys } from './lifecycle'
import redis from '../redis'

export const installUser = (app) => async ({ team, user }) => {
  const { profile: slackProfile } = await app.client.users.profile.get({
    token: user.userToken,
    user: user.userId
  })

  const profile = {
    name: slackProfile.display_name || slackProfile.real_name,
    avatar: slackProfile.image_48,
    email: slackProfile.email
  }

  const existingRegistration = await store.registration.get(profile.email)

  const registration = existingRegistration || {
    accountId: uuid(),
    createDate: Date.now()
  }

  const medium = {
    platform: 'slack',
    teamId: user.teamId,
    userId: user.userId
  }

  if (team) {
    await store.slack.team.set(team.teamId, team)
  } else {
    team = await store.slack.team.get(user.teamId)
  }
  user = {...user, accountId: registration.accountId }
  await store.slack.user.set([user.teamId, user.userId], user)
  await store.registration.set(slackProfile.email, registration)
  await store.account.profile.set(registration.accountId, profile)
  await store.account.medium.set(registration.accountId, medium)

  const restoreCommands = eventuallyRemovedKeys(user).map(key => redis.expireAsync(key, -1))
  await Promise.all(restoreCommands)

  appLog.info({ team, user, medium, registration }, 'install completed')
  return { profile, medium, registration, team, user, existed: !!existingRegistration }
}
