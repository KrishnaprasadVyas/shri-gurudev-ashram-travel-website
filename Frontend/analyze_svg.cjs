const fs = require('fs');
const svg = fs.readFileSync('./public/favicon.svg', 'utf8');

const regex = /transform="translate\(([^,]+),([^)]+)\)"/g;
let match;
let translations = [];

while ((match = regex.exec(svg)) !== null) {
  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);
  if (!isNaN(x) && !isNaN(y) && (x !== 0 || y !== 0)) {
    translations.push({ x, y });
  }
}

// Group by Y to see bands
let groups = {};
for (const t of translations) {
  const bucket = Math.round(t.y / 10) * 10;
  groups[bucket] = (groups[bucket] || 0) + 1;
}

console.log("Translations grouped by approximate Y:");
const buckets = Object.keys(groups).map(Number).sort((a,b) => a-b);
for (const b of buckets) {
  console.log(`Y ~ ${b}: ${groups[b]} paths`);
}
