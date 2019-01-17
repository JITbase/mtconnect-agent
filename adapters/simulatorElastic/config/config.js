const ip = require('ip').address()
const env = process.env

console.log('MTC_LOG_DIR', env.MTC_LOG_DIR);

module.exports = {
  uuid: '43444e50-a578-11e7-a3dd-28cfe91a82ef',
  address: ip,
  machinePort: 7879,
  filePort: 8080,
  maxDelay: 3000,
  urn: 'SimulatorElastic',
  manufacturer: 'SystemInsights',
  modelName: 'Simulator',
  serialNumber: '123456',
  inputFile: './adapters/simulator/public/Mazak01.log',
  deviceFile: './adapters/simulator/public/Mazak01.xml',
  acceleration: 4,

  app: {
    name: 'Simulator_Elastic',
    version: '0.1'
  },

  logging: {
    logLevel: env.MTC_LOG_LEVEL || 'debug',
    logDir: env.MTC_LOG_DIR
  },

  elasticSource:{
    index:'jitbase-workstation-events-production-leesta-*',
    pageSize: 10,
    date:{
      from: 'now-1d/d',
      to: 'now/d',
      format: null
    },
    workstationCode: 'LSTTS3_NL300013_009',
    elasticProtocol: 'https',
    elasticUser: 'api',
    elasticPassword: '4Yy6sGHxWCMx',
    elasticUri: 'elastic.jitbase.com',
    elasticPort: 9443,
  }
}
