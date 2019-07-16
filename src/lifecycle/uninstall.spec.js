import { uninstallTeam } from './uninstall'
import store from '../store'
import { accountProfileKey } from '../redis-keys'
import redis from '../redis'

describe('uninstall', () => {
  const accountId = 'account-1'
  const twoAccountId = 'account-2'
  const threeAccountId = 'account-3'

  const userId = 'user-1'
  const teamId = 'team-1'

  const teamOne = {
    teamId
  }

  const teamTwo = {
    teamId: 'team-2'
  }

  const userOne = {
    teamId,
    userId,
    accountId
  }

  const userTwo = {
    teamId,
    userId: 'user-2',
    accountId: twoAccountId
  }

  const userThree = {
    teamId: teamTwo.teamId,
    userId: 'user-3',
    accountId: threeAccountId
  }

  beforeEach(async () => {
    await Promise.all([
      store.slack.team.set(teamId, teamOne),
      store.slack.team.set(teamTwo.teamId, teamTwo),
      store.slack.user.set([ teamId, userId ], userOne),
      store.slack.user.set([ userTwo.teamId, userTwo.userId ], userTwo),
      store.slack.user.set([ userThree.teamId, userThree.userId ], userThree),
      store.account.medium.set(accountId, {}),
      store.account.medium.set(twoAccountId, {}),
      store.account.medium.set(threeAccountId, {}),
      store.account.profile.set(accountId, {}),
      store.account.profile.set(twoAccountId, {}),
      store.account.profile.set(threeAccountId, {})
    ])
    await uninstallTeam()({ context: { teamId, userId, accountId } })
  })

  it('should remove correct team', async () => {
    const teamOneNow = await store.slack.team.get(teamId)
    const teamTwoNow = await store.slack.team.get(teamTwo.teamId)
    expect(teamOneNow).to.not.exist
    expect(teamTwoNow).to.eql(teamTwo)
  })

  it('should remove correct users', async () => {
    const userOneNow = await store.slack.user.get([ teamId, userId ])
    const userTwoNow = await store.slack.user.get([ userTwo.teamId, userTwo.userId ])
    const userThreeNow = await store.slack.user.get([ userThree.teamId, userThree.userId ])
    expect(userOneNow).to.not.exist
    expect(userTwoNow).to.not.exist
    expect(userThreeNow).to.eql(userThree)
  })

  it('should remove correct medium', async () => {
    const mediumOneNow = await store.account.medium.get(accountId)
    const mediumTwoNow = await store.account.medium.get(twoAccountId)
    const mediumThreeNow = await store.account.medium.get(threeAccountId)
    expect(mediumOneNow).to.not.exist
    expect(mediumTwoNow).to.not.exist
    expect(mediumThreeNow).to.exist
  })

  it('should expire account profile', async () => {
    const profileOneNow = await store.account.profile.get(accountId)
    const profileTwoNow = await store.account.profile.get(twoAccountId)
    const profileThreeNow = await store.account.profile.get(threeAccountId)
    expect(profileOneNow).to.exist
    expect(profileTwoNow).to.exist
    expect(profileThreeNow).to.exist

    const oneTtl = await redis.ttlAsync(accountProfileKey(accountId))
    const twoTtl = await redis.ttlAsync(accountProfileKey(twoAccountId))
    const threeTtl = await redis.ttlAsync(accountProfileKey(threeAccountId))
    expect(oneTtl).to.be.above(0)
    expect(twoTtl).to.be.above(0)
    expect(threeTtl).to.be.below(0)
  })
})
