const fs = require('fs');
const path = require('path');

const enPath = './src/i18n/locales/en/common.json';
const hiPath = './src/i18n/locales/hi/common.json';
const mrPath = './src/i18n/locales/mr/common.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf8'));
const mr = JSON.parse(fs.readFileSync(mrPath, 'utf8'));

const getVal = (obj, keyPath) => {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr == null || typeof curr !== 'object') return undefined;
    curr = curr[p];
  }
  return curr;
};

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? prefix + '.' + k : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllKeys(obj[k], full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

const srcDir = path.resolve('./src');

function scanDirDetails(dir, results = new Map()) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanDirDetails(full, results);
      }
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name) && !entry.name.includes('audit_i18n')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        let match;
        const lineRegex = /\bt\(\s*['"]([^'"`${}]+)['"]/g;
        while ((match = lineRegex.exec(line)) !== null) {
          const key = match[1].trim();
          if (!results.has(key)) {
            results.set(key, []);
          }
          results.get(key).push({
            file: path.relative(srcDir, full),
            line: idx + 1,
            snippet: line.trim()
          });
        }
      });
    }
  }
  return results;
}

const usedKeysMap = scanDirDetails(srcDir);
const usedKeys = Array.from(usedKeysMap.keys()).sort();
console.log('========================================');
console.log('         I18N VALIDATION REPORT         ');
console.log('========================================');
console.log(`Unique static keys used in code: ${usedKeys.length}`);

const missingInEn = [];
for (const k of usedKeys) {
  const enVal = getVal(en, k);
  if (enVal === undefined || typeof enVal !== 'string') {
    missingInEn.push({ key: k, type: typeof enVal, usages: usedKeysMap.get(k) });
  }
}

const enKeys = getAllKeys(en);
const missingInHi = enKeys.filter(k => getVal(hi, k) === undefined);
const missingInMr = enKeys.filter(k => getVal(mr, k) === undefined);

console.log(`Total keys defined in English: ${enKeys.length}`);
console.log(`Missing keys in English (used in code): ${missingInEn.length}`);
console.log(`Missing keys in Hindi (vs English): ${missingInHi.length}`);
console.log(`Missing keys in Marathi (vs English): ${missingInMr.length}`);

if (missingInEn.length > 0) {
  console.error('\n[FAIL] Missing keys in English:');
  missingInEn.forEach(item => {
    console.error(`- ${item.key} (in ${item.usages[0].file}:${item.usages[0].line})`);
  });
}

if (missingInHi.length > 0) {
  console.error('\n[FAIL] Keys present in English but missing in Hindi:');
  missingInHi.slice(0, 20).forEach(k => console.error(`- ${k}`));
}

if (missingInMr.length > 0) {
  console.error('\n[FAIL] Keys present in English but missing in Marathi:');
  missingInMr.slice(0, 20).forEach(k => console.error(`- ${k}`));
}

const isSuccess = missingInEn.length === 0 && missingInHi.length === 0 && missingInMr.length === 0;

if (isSuccess) {
  console.log('\n[SUCCESS] All translation resources are 100% complete and synchronized!');
  process.exit(0);
} else {
  console.error('\n[ERROR] Translation audit failed with missing keys.');
  process.exit(1);
}
