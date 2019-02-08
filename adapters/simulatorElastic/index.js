global.config = require('./config/config')

const log = require('../src/logger')
const adapter = require('../src/adapter')
const device = require('../src/webDevice')
const fileServer = require('../src/fileserver')
const updateWorkstationXml = require('../utils/updateWorkstationXml');
const updateConfigFromYaml = require('../utils/updateConfigFromYaml');
const Bluebird = require('bluebird');



const startAdapter = (err, res) =>{
  if(err) {
    console.error(err);
    return;
  }

  console.log('starting the adapter');
  adapter.start()
  device(config.elasticSource, config.acceleration, config.machinePort)
  fileServer.listen(config.filePort, config.address, () => log.info(`File server started on ${config.filePort}`))
};

// before starting the adapter, update the XML with the name and sender in the config
Bluebird.all([updateWorkstationXml(global.config),updateConfigFromYaml()])
.then(results =>{
  startAdapter();
})
.catch(console.error);