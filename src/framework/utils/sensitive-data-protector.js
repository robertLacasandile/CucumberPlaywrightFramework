const crypto = require('crypto');

const PROTECTED_VALUE = '[PROTECTED]';
const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'authorization',
  'credential'
];

function isSensitive(label = '') {
  const normalized = String(label).toLowerCase();
  return SENSITIVE_KEYS.some((key) => normalized.includes(key));
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 12);
}

function protect(label, value) {
  if (!isSensitive(label)) {
    return value;
  }

  if (value === undefined || value === null || value === '') {
    return PROTECTED_VALUE;
  }

  return `${PROTECTED_VALUE} sha256:${fingerprint(value)}`;
}

function protectText(text) {
  if (!text) {
    return text;
  }

  return String(text)
    .replace(/(password\s*[:=]\s*)[^\r\n]+/gi, `$1${PROTECTED_VALUE}`)
    .replace(/(secret\s*[:=]\s*)[^\r\n]+/gi, `$1${PROTECTED_VALUE}`)
    .replace(/(token\s*[:=]\s*)[^\r\n]+/gi, `$1${PROTECTED_VALUE}`);
}

module.exports = {
  protect,
  protectText,
  isSensitive
};
