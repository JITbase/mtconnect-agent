global.config = require('./config/config')

const log = require('../src/logger')
const adapter = require('../src/adapter')
const device = require('../src/webDevice')
const fileServer = require('../src/fileserver')


adapter.start()
device(config.elasticSource, config.acceleration, config.machinePort)
fileServer.listen(config.filePort, config.address, () => log.info(`File server started on ${config.filePort}`))
