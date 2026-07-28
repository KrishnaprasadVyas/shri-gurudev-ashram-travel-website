const fs = require('fs');
const svg = fs.readFileSync('./public/favicon.svg', 'utf8');

const regex = /<path\s+d="([^"]+)"[^>]*transform="translate\(([^,]+),([^)]+)\)"/g;
let match;
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

while ((match = regex.exec(svg)) !== null) {
  const d = match[1];
  const tx = parseFloat(match[2]);
  const ty = parseFloat(match[3]);
  
  if (isNaN(tx) || isNaN(ty)) continue;

  const coordRegex = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g;
  let coordMatch;
  while ((coordMatch = coordRegex.exec(d)) !== null) {
    const cx = parseFloat(coordMatch[1]);
    const cy = parseFloat(coordMatch[2]);
    
    if (!isNaN(cx) && !isNaN(cy)) {
      const absX = tx + cx;
      const absY = ty + cy;
      
      if (absX < minX) minX = absX;
      if (absX > maxX) maxX = absX;
      if (absY < minY) minY = absY;
      if (absY > maxY) maxY = absY;
    }
  }
}

console.log(`Exact Min X: ${minX}`);
console.log(`Exact Min Y: ${minY}`);
console.log(`Exact Max X: ${maxX}`);
console.log(`Exact Max Y: ${maxY}`);
