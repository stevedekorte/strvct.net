#!/usr/bin/env node

// run with: 
//  node _build_maps.js 
// in the strvct/external-libs directory

const fs = require('fs');
const path = require('path');
const { build } = require('esbuild');

function findJsFiles (dir, results = []) {
  const scriptPath = path.resolve(__filename);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === '_unused' || entry.name === 'tests' || entry.name === 'test') continue;
      findJsFiles(fullPath, results);
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.js') &&
      !entry.name.endsWith('.bundle.js') &&
      path.resolve(fullPath) !== scriptPath &&
      !entry.name.match(/(?:^|[-_])test\.js$/)
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

async function buildAllJsFiles () {
  const files = findJsFiles(process.cwd());
  for (const file of files) {
    const dir = path.dirname(file);
    const base = path.basename(file, '.js');
    const outfile = path.join(dir, `${base}.bundle.js`);
    console.log(`Building ${file} → ${outfile}`);
    await build({
      entryPoints: [file],
      outfile,
      sourcemap: true,
      bundle: true
    });
  }
}

buildAllJsFiles().catch(err => {
  console.error(err);
  process.exit(1);
});
