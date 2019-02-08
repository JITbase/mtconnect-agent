'use strict'

const yaml = require('js-yaml');
const fs   = require('fs');
const Bluebird = require('bluebird');
const path = require('path')

const updateConfigFromYaml = () => new Bluebird((resolve, reject)=>{
  const yamlLocation = path.resolve(__dirname, '../../virtual-factory.yaml');
  fs.readFile(yamlLocation, 'UTF-8', (err, data)=>{
    if(err) return reject(err);
    let yamlDoc = yaml.safeLoad(data);
    resolve();
  });

  //global.config = require('./config/config')
});

module.exports = updateConfigFromYaml;
