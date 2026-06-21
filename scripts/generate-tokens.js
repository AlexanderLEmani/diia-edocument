function usage() {
  console.log([
    'Usage:',
    '  node scripts/generate-tokens.js <userId> <expireDate> [--hex]',
    '',
    'Examples:',
    '  node scripts/generate-tokens.js user412 2026-07',
    '  node scripts/generate-tokens.js user412 2026-07 --hex',
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

var args = process.argv.slice(2);
var format = 'base64';

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  usage();
  process.exit(args.length ? 0 : 1);
}

if (args[args.length - 1] === '--hex') {
  format = 'hex';
  args.pop();
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

console.log('User ID: ' + userId);
console.log('Expires: ' + expireDate);
console.log('Payload: ' + payload);
console.log('Token: ' + token);
console.log('Link tail: ?t=' + token);
