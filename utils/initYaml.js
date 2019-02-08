'use strict';
const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path')
const Bluebird = require('bluebird');

const YAML_FILE = path.resolve(__dirname, '../virtual-factory.yaml');

const getYamlData = () => new Bluebird((resolve, reject)=>{
  fs.readFile(YAML_FILE, 'UTF-8', (err, data)=>{
    if(err) return resolve({});
    let yamlDoc = yaml.safeLoad(data);
    resolve(yamlDoc);
  });
});

module.exports = () =>{
  let yamlData = {};
};