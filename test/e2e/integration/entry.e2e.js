describe('App Entry', () => {
  beforeEach('open app home', () => {
    cy.visitAppHome()
  })

  describe('open conversation', () => {
    it('should open conversation dialog', () => {
      cy.get('[data-qa="bk_actions_block_action"]').contains('Start a Conversation').last().click()
      cy.get('[data-qa="dialog"]')
    })
  })

  describe('manage blacklist', () => {

    describe('with blacklist entry', () => {
      beforeEach(() => {
        cy.task('prepareBlacklist')
      })

      it.only('should open manage blacklist dialog', () => {
        cy.get('[data-qa="bk_actions_block_action"] [type="ellipsis"]').last().click()
        cy.get('[data-qa="menu_item_button"]').contains('Manage Blacklist').last().click()
        cy.get('[data-qa="dialog"]')
      })
    })
  })
})
