// Login when required
before('login when not logged in yet', () => {
  cy.task('resetDb')
  cy.task('prepareCurrentUser')
  cy.visit('/')
  cy.get('body').then(($body) => {
    if ($body.find('#signin_form').length) {
      cy.get('#email').type(Cypress.env('CURRENT_EMAIL'))
      cy.get('#password').type(Cypress.env('CURRENT_PASSWORD'))
      cy.get('#signin_form').submit()
    }
  })
})
