'use strict';
const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path')
const Bluebird = require('bluebird');
const inquirer = require('inquirer'); 
// https://www.npmjs.com/package/inquirer


const YAML_FILE = path.resolve(__dirname, '../virtual-factory.yaml');

const getYamlData = () => new Bluebird((resolve, reject)=>{
  fs.readFile(YAML_FILE, 'UTF-8', (err, data)=>{
    if(err) return resolve({});
    let yamlDoc = yaml.safeLoad(data);
    resolve(yamlDoc);
  });
});

  let yamlData = {};
  console.log('starting yaml');
  inquirer
  .prompt([
    'hello world'
  ])
  .then(answers => {
    let myanswers = answers;
  });