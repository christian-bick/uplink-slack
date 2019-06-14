import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const expect = chai.expect
const sandbox = sinon.createSandbox()

global.expect = expect
global.sandbox = sandbox
