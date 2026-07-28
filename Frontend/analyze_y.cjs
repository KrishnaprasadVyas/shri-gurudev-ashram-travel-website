const fs = require('fs');
const svg = fs.readFileSync('./public/favicon.svg', 'utf8');

const regex = /transform="translate\([^,]+,([^)]+)\)"/g;
let match;
let count = 0;

const lines = svg.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('translate')) {
    const match = line.match(/translate\([^,]+,([^)]+)\)/);
    if (match) {
      const y = parseFloat(match[1]);
      if (y >= 1200) {
        console.log(`Line ${i + 1}: Y=${y}`);
      }
    }
  }
}
