// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

require('babel-register')

process.env.ENCRYPTION_SECRET = '12345678901234567890123456789012'
process.env.REDIS_HOST = 'localhost'
process.env.REDIS_PORT = '6380'
process.env.HASH_SALT= 'no-hash'

module.exports = require('./main')
