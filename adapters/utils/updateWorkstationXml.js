'use strict'
const Bluebird = require('bluebird');

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

module.exports = config => new Bluebird((resolve, reject)=>{
  let parser = new xml2js.Parser();
  fs.readFile(config.deviceFileOriginal, function(err, data) {
      if(err) return reject(err);
      parser.parseString(data, function (err, result) {
        if(err) return reject(err);
        // update the sender
        if(config.sender) result.MTConnectDevices.Header[0].$.sender = config.sender;
        // update the name everywhere in the XML
        if(config.name) result = updateObjectValues(config.originalName, config.name, result);

        // save to new file
        var filepath = path.normalize(config.deviceFile);
        var builder = new xml2js.Builder();
        var xml = builder.buildObject(result);
        fs.writeFile(filepath, xml, (err, res)=>{
          if(err) return reject(err);
          return resolve(res);
        });
      });
  });
});