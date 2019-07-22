// Login when required
before('login when not logged in yet', () => {
  cy.visit('/')
  cy.get('body').then(($body) => {
    if ($body.find('#signin_form').length) {
      cy.get('#email').type(Cypress.env('E2E_EMAIL'))
      cy.get('#password').type(Cypress.env('E2E_PASSWORD'))
      cy.get('#signin_form').submit()
    }
  })
})
