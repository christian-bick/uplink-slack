// Login when required
before('login when not logged in yet', () => {
  cy.task('resetSlack')
  cy.task('resetDb')
  cy.task('prepareCurrentUser')
  cy.task('prepareContactUser')
  cy.visit('https://uplink-e2e-one.slack.com')
  cy.get('body').then(($body) => {
    if ($body.find('#signin_form').length) {
      cy.get('#email').type(Cypress.env('CURRENT_EMAIL'))
      cy.get('#password').type(Cypress.env('CURRENT_PASSWORD'))
      cy.get('#signin_form').submit()
    }
  })
})
