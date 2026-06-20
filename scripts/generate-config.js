const fs = require('fs');
const path = require('path');
const vm = require('vm');

const corePath = path.join(__dirname, '../admin/core.js');
const code = fs.readFileSync(corePath, 'utf8');
const sandbox = { global: {} };
vm.runInNewContext(code, sandbox);
const AdminCore = sandbox.global.AdminCore;

const config = AdminCore.buildDefaultsConfig();
fs.writeFileSync(
  path.join(__dirname, '../admin/config.json'),
  JSON.stringify(config, null, 2) + '\n'
);
console.log('Wrote admin/config.json');
