#!/usr/bin/env node
/**
 * Bundle Analysis Script
 * Measures gzipped sizes of all JS files in the production bundle
 * Requirement 40.2: Bundle analysis on CI
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const distDir = path.join(__dirname, '..', 'dist');
const outputFile = path.join(__dirname, '..', 'bundle-analysis.html');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory not found. Run `pnpm build:web` first.');
  process.exit(1);
}

// Find all JS files in dist
const jsFiles = [];
function findJsFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findJsFiles(fullPath);
    } else if (file.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }
}
findJsFiles(distDir);

if (jsFiles.length === 0) {
  console.error('Error: No JS files found in dist/');
  process.exit(1);
}

// Calculate per-file and total bundle sizes (gzipped)
const fileSizes = [];
let totalSize = 0;
for (const file of jsFiles) {
  const content = fs.readFileSync(file);
  const rawSize = content.length;
  const gzipSize = zlib.gzipSync(content).length;
  totalSize += gzipSize;
  fileSizes.push({
    name: path.relative(distDir, file),
    raw: rawSize,
    gzip: gzipSize,
  });
}

// Sort by gzipped size descending
fileSizes.sort((a, b) => b.gzip - a.gzip);

const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
console.log(`Total bundle size (gzipped): ${totalSizeMB} MB`);
console.log(`Files: ${jsFiles.length}`);
console.log('');

// Print top files
for (const f of fileSizes.slice(0, 10)) {
  const kb = (f.gzip / 1024).toFixed(1);
  console.log(`  ${kb} KB  ${f.name}`);
}

if (totalSize >= 5242880) {
  console.error(`\nError: Bundle size ${totalSizeMB} MB exceeds 5 MB limit`);
  process.exit(1);
}

// Generate bundle analysis HTML report
const rows = fileSizes
  .map(
    (f) =>
      `<tr><td>${f.name}</td><td>${(f.raw / 1024).toFixed(1)} KB</td><td>${(f.gzip / 1024).toFixed(1)} KB</td></tr>`,
  )
  .join('\n');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Bundle Analysis</title>
<style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:0.5rem;border-bottom:1px solid #ddd}
th{background:#f5f5f5}.pass{color:green}.fail{color:red}</style></head>
<body><h1>Cognitive Dissonance v3.0 Bundle Analysis</h1>
<p>Total gzipped: <strong>${totalSizeMB} MB</strong> / 5.00 MB
<span class="${totalSize >= 5242880 ? 'fail' : 'pass'}">${totalSize >= 5242880 ? 'FAIL' : 'PASS'}</span></p>
<table><thead><tr><th>File</th><th>Raw</th><th>Gzip</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`;

fs.writeFileSync(outputFile, html);
console.log(`\nBundle analysis saved to: ${outputFile}`);
console.log(`Bundle size check: PASSED (${totalSizeMB} MB / 5.00 MB)`);
