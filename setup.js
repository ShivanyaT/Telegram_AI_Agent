/**
 * Setup script to create all necessary directories for Tclaw Bot
 * Run with: node setup.js
 */

const fs = require('fs');
const path = require('path');

// Define all directories that need to be created
const directories = [
  'src/agent',
  'src/memory',
  'src/rag',
  'src/tools',
  'src/telegram',
  'src/scheduler',
  'src/config',
  'data/memory',
  'data/rag',
  'data/state',
  'docs',
  'tests',
];

// Create directories
directories.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  }
});

console.log('\n✓ Directory structure initialized!');
console.log('✓ Ready for source file generation');
