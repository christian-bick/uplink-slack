import store from "../store"

export const unblockContact = (app) => async ({ body, context, ack, say }) => {
  ack()
  const contactAccountId = body.submission.accountId
  await store.account.blacklist.srem(context.accountId, contactAccountId)
  const contactProfile = await store.account.profile.get(contactAccountId)
  say(`*${contactProfile.name}* is not blocked anymore and can contact you again.`)
}
