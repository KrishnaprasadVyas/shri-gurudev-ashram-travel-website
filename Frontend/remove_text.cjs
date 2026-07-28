const fs = require('fs');
const svg = fs.readFileSync('./public/favicon.svg', 'utf8');

// The SVG has lines of `<path ... />`.
const lines = svg.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith('<path')) {
    const match = line.match(/translate\([^,]+,([^)]+)\)/);
    if (match) {
      const y = parseFloat(match[1]);
      if (y >= 1200) {
        // Skip this path (it's the horizontal text)
        continue;
      }
    }
  }
  newLines.push(line);
}

// Write the new SVG
fs.writeFileSync('./public/favicon.svg', newLines.join('\n'));
