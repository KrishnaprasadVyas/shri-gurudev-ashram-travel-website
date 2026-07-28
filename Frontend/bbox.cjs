const fs = require('fs');
const svg = fs.readFileSync('./public/favicon.svg', 'utf8');

const regex = /transform="translate\(([^,]+),([^)]+)\)"/g;
let match;
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

while ((match = regex.exec(svg)) !== null) {
  const x = parseFloat(match[1]);
  const y = parseFloat(match[2]);
  if (!isNaN(x) && !isNaN(y)) {
    if (x === 0 && y === 0) continue; // Skip the empty ones at 0,0
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
}

console.log(`Min X: ${minX}`);
console.log(`Min Y: ${minY}`);
console.log(`Max X: ${maxX}`);
console.log(`Max Y: ${maxY}`);
