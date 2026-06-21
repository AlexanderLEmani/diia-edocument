const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIIA_MANIFEST = path.join(ROOT, 'manifest.webmanifest');
const REZERV_MANIFEST = path.join(ROOT, 'rezerv/manifest.webmanifest');

function usage() {
  console.log([
    'Usage:',
    '  node scripts/generate-tokens.js <userId> <expireDate> [--hex] [--write-manifest]',
    '',
    'Examples:',
    '  node scripts/generate-tokens.js user412 2026-07',
    '  node scripts/generate-tokens.js user412 2026-07 --write-manifest',
  ].join('\n'));
}

function isValidExpireDate(value) {
  return /^\d{4}-\d{2}$/.test(value);
}

function encodeToken(payload, format) {
  if (format === 'hex') {
    return Buffer.from(payload, 'utf8').toString('hex');
  }
  return Buffer.from(payload, 'utf8').toString('base64');
}

function updateManifest(filePath, startUrl) {
  var manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  manifest.start_url = startUrl;
  manifest.id = startUrl;
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n');
}

var args = process.argv.slice(2);
var format = 'base64';
var writeManifest = false;

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  usage();
  process.exit(args.length ? 0 : 1);
}

while (args.length) {
  var flag = args[args.length - 1];
  if (flag === '--hex') {
    format = 'hex';
    args.pop();
    continue;
  }
  if (flag === '--write-manifest') {
    writeManifest = true;
    args.pop();
    continue;
  }
  break;
}

var userId = args[0];
var expireDate = args[1];

if (!userId || !expireDate) {
  usage();
  process.exit(1);
}

if (!isValidExpireDate(expireDate)) {
  console.error('expireDate must look like 2026-07');
  process.exit(1);
}

var payload = userId + ':' + expireDate;
var token = encodeToken(payload, format);
var query = '?t=' + token;

console.log('User ID: ' + userId);
console.log('Expires: ' + expireDate);
console.log('Payload: ' + payload);
console.log('Token: ' + token);
console.log('');
console.log('Browser links:');
console.log('  https://diia-edocument.vercel.app/' + query);
console.log('  https://diia-edocument.vercel.app/rezerv' + query);

if (writeManifest) {
  updateManifest(DIIA_MANIFEST, '/' + query);
  updateManifest(REZERV_MANIFEST, '/rezerv/' + query);
  console.log('');
  console.log('Updated manifest.webmanifest start_url -> /' + query);
  console.log('Updated rezerv/manifest.webmanifest start_url -> /rezerv/' + query);
  console.log('Redeploy required for iOS home screen icons to pick this up.');
}
