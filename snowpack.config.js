// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration
const fs = require('fs');

console.log(fs.readdirSync('./node_modules').filter(a => a[0] == 'p'))

if (fs.existsSync('./node_modules')) {
  if (fs.existsSync('./node_modules/process')) {
    fs.writeFileSync('./node_modules/process/package.json', `{
  "author": "Roman Shtylman <shtylman@gmail.com>",
  "name": "process",
  "description": "process information for node.js and browsers",
  "keywords": [
    "process"
  ],
  "scripts": {
    "test": "mocha test.js",
    "browser": "zuul --no-coverage --ui mocha-bdd --local 8080 -- test.js"
  },
  "version": "0.11.10",
  "repository": {
    "type": "git",
    "url": "git://github.com/shtylman/node-process.git"
  },
  "license": "MIT",
  "browser": "./index.js",
  "main": "./index.js",
  "engines": {
    "node": ">= 0.6.0"
  },
  "devDependencies": {
    "mocha": "2.2.1",
    "zuul": "^3.10.3"
  }
}
`)
  }
}

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  root: './src',
  mount: {
    /* ... */
    
  },
  plugins: [
    ['snowpack-plugin-less', {}]
  ],
  packageOptions: {
    /* ... */
    knownEntrypoints: ['has-symbols', 'call-bind']
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
    style: 'compressed', // 'compressed' or 'expanded'
  },
  
};
