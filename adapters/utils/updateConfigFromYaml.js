'use strict'

const yaml = require('js-yaml');
const fs   = require('fs');
const Bluebird = require('bluebird');
const path = require('path')

const updateConfigFromYaml = () => new Bluebird((resolve, reject)=>{
  const yamlLocation = path.resolve(__dirname, 'virtual-factory.yaml');
  //fs.readFile(path.resolve(__dirname, 'settings.json'), 'UTF-8', callback);

  resolve();
  //global.config = require('./config/config')
});
