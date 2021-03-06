// ***********************************************************
// This support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands'
import './hooks'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// pass anything here you'd normally pass to cy.server().
Cypress.Server.defaults({
  delay: 500,
  force404: false,
  whitelist: (xhr) => {}
})

// All cookies are preserved across sessions
Cypress.Cookies.defaults({
  whitelist: () => {}
})
