import store from '../store'
import { supportLink, userAuthLink } from '../global'

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
      }, {
        'type': 'button',
        'action_id': 'list-contacts',
        'text': {
          'type': 'plain_text',
          'text': 'List Contacts',
          'emoji': true
        }
      }]
    }
  ]
})
