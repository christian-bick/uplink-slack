import store from "../store"

export const showOpenChatDialog = (app) => async ({ body, context, ack }) => {
  ack()
  const { email: userEmail } = await store.slack.profile.get([context.teamId, context.userId])
  const contacts = await store.user.contacts.smembers(userEmail)
  if (!contacts || contacts.length < 1) {
    await app.client.dialog.open(buildOpenChatWithoutContactsDialog(context.botToken, body.trigger_id))
  } else {
    await app.client.dialog.open(buildOpenChatDialog(context.botToken, body.trigger_id))
  }
}

export const buildOpenChatWithoutContactsDialog = (token, triggerId) => ({
  'token': token,
  'trigger_id': triggerId,
  'dialog': {
    'callback_id': 'open-chat',
    'title': 'Start a Chat',
    'submit_label': 'Start',
    'elements': [
      {
        'type': 'text',
        'subtype': 'email',
        'label': 'Your contact\'s email address',
        'name': 'email',
        'placeholder': 'john.smith@example.com'
      }
    ]
  }
})

export const buildOpenChatDialog = (token, triggerId) => ({
  'token': token,
  'trigger_id': triggerId,
  'dialog': {
    'callback_id': 'open-chat',
    'title': 'Start a Chat',
    'submit_label': 'Start',
    'elements': [
      {
        'type': 'select',
        'label': 'Your contact\'s email address',
        'name': 'email',
        'placeholder': 'john.smith@example.com',
        'data_source': 'external'
      }
    ]
  }
})
