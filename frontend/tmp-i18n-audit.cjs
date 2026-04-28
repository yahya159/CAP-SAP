const fs = require('fs');
const path = require('path');

function flat(obj, prefix = '', out = []) {
  for (const key of Object.keys(obj || {})) {
    const value = obj[key];
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flat(value, full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'locales', 'en', 'translation.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'locales', 'fr', 'translation.json'), 'utf8'));

const enKeys = new Set(flat(en));
const frKeys = new Set(flat(fr));

const missingInFr = [...enKeys].filter((key) => !frKeys.has(key));
const missingInEn = [...frKeys].filter((key) => !enKeys.has(key));

const source = walk(path.join(__dirname, 'src')).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const regex = /\bt\(\s*['"`]([^'"`]+)['"`]/g;
const usedKeys = new Set();
let match;
while ((match = regex.exec(source)) !== null) usedKeys.add(match[1]);

const missingInEnFromUsage = [...usedKeys].filter((key) => !enKeys.has(key));

console.log(`EN_KEYS=${enKeys.size}`);
console.log(`FR_KEYS=${frKeys.size}`);
console.log(`MISSING_IN_FR=${missingInFr.length}`);
console.log(`MISSING_IN_EN=${missingInEn.length}`);
console.log(`USED_STATIC_T_KEYS=${usedKeys.size}`);
console.log(`MISSING_IN_EN_FROM_USAGE=${missingInEnFromUsage.length}`);
if (missingInEnFromUsage.length) {
  console.log('MISSING_KEYS_SAMPLE_START');
  for (const key of missingInEnFromUsage.slice(0, 120)) console.log(key);
  console.log('MISSING_KEYS_SAMPLE_END');
}
