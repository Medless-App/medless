#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import crypto from 'crypto';

console.log('🔧 Generating build info...');

// Read version from package.json
let version = '1.0.0';
try {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
  version = packageJson.version || '1.0.0';
  console.log(`✅ Version: ${version} (from package.json)`);
} catch (error) {
  console.warn('⚠️ Could not read version from package.json, using default');
}

// Get git commit hash
let commit = 'unknown';
let branch = 'main';
try {
  commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  console.log(`✅ Git commit: ${commit} (branch: ${branch})`);
} catch (error) {
  console.warn('⚠️ Git not available, using default commit');
}

// Get hash of app.js file
let appJsHash = 'development';
const appJsPath = './public/static/app.js';
if (existsSync(appJsPath)) {
  const appJsContent = readFileSync(appJsPath, 'utf8');
  appJsHash = crypto.createHash('sha256').update(appJsContent).digest('hex');
  console.log(`✅ app.js hash: ${appJsHash.substring(0, 8)}...`);
} else {
  console.warn(`⚠️ ${appJsPath} not found, using 'development'`);
}

// Build time
const buildTime = new Date().toISOString();
console.log(`✅ Build time: ${buildTime}`);

// Generate TypeScript file
const buildInfoTS = `// Auto-generated build information
export const BUILD_INFO = {
  buildHash: '${appJsHash}',
  buildTime: '${buildTime}',
  commit: '${commit}',
  branch: '${branch}',
  asset: 'static/app.js',
  version: '${version}'
};
`;

writeFileSync('./src/build-info.generated.ts', buildInfoTS);
console.log('✅ src/build-info.generated.ts saved');

// Generate JSON file for dist
const buildInfoJSON = JSON.stringify({
  buildHash: appJsHash,
  buildTime,
  commit,
  branch,
  asset: 'static/app.js',
  version
}, null, 2);

writeFileSync('./dist/build-info.json', buildInfoJSON);
console.log('✅ dist/build-info.json saved');

writeFileSync('./public/build-info.json', buildInfoJSON);
console.log('✅ public/build-info.json saved');

console.log('🎉 Build info generation complete!');
