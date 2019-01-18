global.config = require('./config/config')

const log = require('../src/logger')
const adapter = require('../src/adapter')
const device = require('../src/webDevice')
const fileServer = require('../src/fileserver')


// parse the xml
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const updateObjectValues = (fromVal, toVal, result) =>{
  if(result && Array.isArray(result) && result.length){
    result = result.map(item => updateObjectValues(fromVal, toVal, item));
    return result;
  }

  if(typeof result === 'string'){
    var regex = new RegExp(fromVal, 'g')
    result = result.replace(regex, toVal);
    return result
  }

  if(typeof result === 'object'){
    let objKeys = Object.keys(result);
    objKeys.forEach(key => {
      result[key] = updateObjectValues(fromVal, toVal, result[key]);
    });
    return result;
  }

  return result;

};

const startAdapter = (err, res) =>{
  if(err) console.error(err);
  adapter.start()
  device(config.elasticSource, config.acceleration, config.machinePort)
  fileServer.listen(config.filePort, config.address, () => log.info(`File server started on ${config.filePort}`))
};

// before starting the adapter, update the XML with the name and sender in the config
if(config.sender || config.name){
  let parser = new xml2js.Parser();
  fs.readFile(config.deviceFileOriginal, function(err, data) {
      parser.parseString(data, function (err, result) {
        if(config.sender){
          result.MTConnectDevices.Header[0].$.sender = config.sender;
        }
        if(config.name){
          result = updateObjectValues(config.originalName, config.name, result);
        }
          console.dir(result);
          console.log('Done');
          var filepath = path.normalize(config.deviceFile);
          var builder = new xml2js.Builder();
          var xml = builder.buildObject(result);
          fs.writeFile(filepath, xml, startAdapter);
      });
  });
}else{
  startAdapter();
}


