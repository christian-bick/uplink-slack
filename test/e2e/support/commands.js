// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { WebClient } from '@slack/web-api'

Cypress.Commands.add('visitAppHome', () => {
  cy.visit(`/${Cypress.env('CURRENT_APP_HOME')}`)
})

Cypress.Commands.add('shouldSubmitMessage', async ({ text }) => {
  const client = new WebClient(Cypress.env('CONTACT_ADMIN_TOKEN'))
  const sleep = millies => new Promise(resolve => setTimeout(resolve, millies))

  let dmChannel
  for (let attempts = 0; attempts < 10; attempts++) {
    const { channels } = await client.conversations.list({ types: 'public_channel' })
    const dmChannelList = channels.filter(({ name }) => name.startsWith('dm-'))
    if (dmChannelList.length === 1) {
      dmChannel = dmChannelList[0]
      break;
    } else if (dmChannelList.length > 1) {
      throw new Error('There is more than one dm channel')
    }
    await sleep(500)
  }
  if (!dmChannel) {
    throw new Error('No dm channel found after several attempts')
  }

  let matchedText = false
  for (let attempts = 0; attempts < 10; attempts++) {
    const { messages } = await client.conversations.history({
      channel: dmChannel.id,
      limit: 1
    })
    const lastMessage = messages[0]
    if (lastMessage && lastMessage.text === text) {
      matchedText = true
      break;
    }
    await sleep(500)
  }
  if (!matchedText) {
    throw new Error('Could not find message with matching text after several attempts')
  }
})
