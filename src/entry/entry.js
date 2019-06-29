import store from '../store'
import { supportLink, userAuthLink } from '../global'

export const PERMISSIONS_TEXT = 'Let\'s get started!'
export const ENTRY_TEXT = '*You are ready to go!* Start messaging contacts outside of this workspace.'

export const buildPermissionMessage = (teamId) => ({
  text: PERMISSIONS_TEXT,
  blocks: [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': 'You are just one step away from an awesome messaging experience with your contacts on other Slack ' +
        'workspaces!'
      }
    }, {
      'type': 'divider'
    }, {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': '*Just before we can start, I need to ask for some permissions.*'
      },
      'accessory': {
        'action_id': 'user-install-init',
        'type': 'button',
        'url': userAuthLink(teamId),
        'text': {
          'type': 'plain_text',
          'text': 'Give Permission',
          'emoji': false
        }
      }
    }
  ]
})

export const buildEntryMessage = (teamId) => ({
  text: ENTRY_TEXT,
  blocks: [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': ENTRY_TEXT
      },
      'accessory': {
        'type': 'overflow',
        'action_id': 'entry-overflow',
        'options': [
          {
            'text': {
              'type': 'plain_text',
              'text': 'Get Support',
              'emoji': true
            },
            'value': 'support',
            'url': supportLink(teamId)
          },
          {
            'text': {
              'type': 'plain_text',
              'text': 'Reinstall App'
            },
            'value': 'reinstall',
            'url': userAuthLink(teamId)
          }
        ]
      }
    }, {
      'type': 'divider'
    }, {
      'type': 'actions',
      'elements': [{
        'type': 'button',
        'action_id': 'select-chat',
        'style': 'primary',
        'text': {
          'type': 'plain_text',
          'text': 'Start a Conversation',
          'emoji': true
        }
      }, {
        'type': 'button',
        'action_id': 'add-contacts',
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
  const user = await store.slack.user.get([context.teamId, context.userId])

  const sendHomeMessage = async (message) => {
    const { messages: oldMessages } = await app.client.conversations.history({
      token: context.botToken,
      channel: event.channel
    })
    const lastMessage = oldMessages && oldMessages[0]
    if (lastMessage && lastMessage.text === message.text) {
      return app.client.chat.update({
        ts: lastMessage.ts,
        channel: event.channel,
        token: context.botToken,
        ...message
      })
    } else {
      return say(message)
    }
  }

  if (!user) {
    await sendHomeMessage(buildPermissionMessage(context.teamId))
  } else {
    await sendHomeMessage(buildEntryMessage(context.teamId))
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

export const showAddContactsDialog = (app) => async ({ body, context, ack }) => {
  ack()
  await app.client.dialog.open(buildAddContactsDialog(context.botToken, body.trigger_id))
}
