import { blacklisted } from '../fixtures/users'
import { currentDmChannel } from '../fixtures/channels'

describe('App Entry', () => {
  beforeEach('open app home', () => {
    cy.visitAppHome()
  })

  describe('open conversation', () => {
    it('should open conversation and send a message', () => {
      const testText = 'test message'
      cy.get('[data-qa="bk_actions_block_action"]').contains('Start a Conversation').last()
        .scrollIntoView()
        .click()
      cy.get('[data-qa="dialog"]')
      cy.get('[data-qa-formtext="true"] input')
        .type(Cypress.env('CONTACT_EMAIL'))
      cy.get('[data-qa="dialog_go"')
        .click()
      cy.get(`[aria-label*="${currentDmChannel.name}"]`)
        .click()
      cy.get('[data-qa="channel_name_header"').contains(currentDmChannel.name)
      cy.get('[data-qa="message_input"] [contenteditable="true"]')
        .first()
        .scrollIntoView()
        .type(testText)
        .type('{enter}')
      cy.shouldSubmitMessage({ text: testText })
    })
  })

  describe('manage blacklist', () => {
    describe('with blacklist entry', () => {
      beforeEach(() => {
        cy.task('prepareBlacklist')
      })

      it('should find entry in blacklist dialog and remove it', () => {
        cy.get('[data-qa="bk_actions_block_action"] [type="ellipsis"]').last()
          .scrollIntoView()
          .click()
        cy.get('[data-qa="menu_item_button"]').contains('Manage Blacklist').last()
          .click()
        cy.get('[data-qa="dialog"]')
        cy.get('[data-qa="select_input"]')
          .click()
        cy.get('[data-qa*="select_option"]').contains(blacklisted.profile.name)
          .click()
        cy.get('[data-qa="dialog_go"')
          .click()
      })
    })
  })
})
