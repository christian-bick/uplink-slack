import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)
const expect = chai.expect
const sandbox = sinon.createSandbox()

global.expect = expect
global.sandbox = sandbox
