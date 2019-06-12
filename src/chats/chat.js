import store from "../store"

export const openChat = (app) => async ({ body, context, ack, say }) => {
  ack()
  const contactEmail = body.submission.email
  const registration = await store.user.registration.get(contactEmail)
  if (!registration) {
    say('Don\'t know a user with this email address')
  } else {
    await app.client.groups.create({
      token: context.userToken,
      name: contactEmail
    })
  }
}
