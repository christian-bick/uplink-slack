import store from '../store'
import moment from 'moment'

export const buildPermissionMessage = () => ({
  blocks: [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': 'With Open Convo you can chat with others outside of your Slack team as if they were here!'
      }
    }, {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': '*Just, before we can start I need your permission to modify groups.*'
      },
      'accessory': {
        'type': 'button',
        'url': `https://${process.env.HOST}/oauth/user/request`,
        'text': {
          'type': 'plain_text',
          'text': 'Give Permission',
          'emoji': true
        }
      }
    }
  ]
})

export const buildEntryMessage = () => ({
  blocks: [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': 'What are you up for?'
      }
    }, {
      'type': 'divider'
    }, {
      'type': 'actions',
      'elements': [{
        'type': 'button',
        'action_id': `select-chat`,
        'style': 'primary',
        'text': {
          'type': 'plain_text',
          'text': 'Start a Conversation',
          'emoji': true
        }
      }, {
        'type': 'button',
        'action_id': `add-contacts`,
        'text': {
          'type': 'plain_text',
          'text': 'Add Contacts',
          'emoji': true
        }
      }]
    }
  ]
})

export const reactToAppHomeOpened = (app) => async ({ context, event, say }) => {
  const user = await store.slackUser.get(context.userId)

  const sendHomeMessage = async (message) => {
    const { messages: oldMessages } = await app.client.conversations.history({
      token: context.botToken,
      channel: event.channel
    })
    const firstMessage = oldMessages && oldMessages[0]

    if (firstMessage && !firstMessage.user) {
      return app.client.chat.update({
        ts: firstMessage.ts,
        channel: event.channel,
        token: context.botToken,
        ...message
      })
    } else {
      return say(message)
    }
  }

  if (!user) {
    await sendHomeMessage(buildPermissionMessage())
  } else {
    await sendHomeMessage(buildEntryMessage())
  }
}

export const buildFirstContactDialog = (token, triggerId) => ({
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

export const buildAddContactsDialog = (token, triggerId) => ({
  'token': token,
  'trigger_id': triggerId,
  'dialog': {
    'callback_id': 'add-contacts',
    'title': 'Add Contacts',
    'submit_label': 'Add',
    'elements': [
      {
        'type': 'textarea',
        'label': 'List of email addresses',
        'name': 'contacts',
        'hint': 'You can basically copy paste everything here that contains email addresses.',
        'placeholder': 'john.smith@example.com\nsophie.miller@example.com'
      }
    ]
  }
})

export const showSelectChatDialog = (app) => async ({ body, context, ack }) => {
  ack()
  await app.client.dialog.open(buildFirstContactDialog(context.botToken, body.trigger_id))
}

export const showAddContactsDialog = (app) => async ({ body, context, ack }) => {
  ack()
  await app.client.dialog.open(buildAddContactsDialog(context.botToken, body.trigger_id))
}
