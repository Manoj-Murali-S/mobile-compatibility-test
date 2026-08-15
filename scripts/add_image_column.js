const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const os = require('os');

const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Mobile Compatibility Finder', 'mobile-compatibility-finder', 'catalog.db');
const db = new DatabaseSync(appDataPath);

try {
  db.exec('ALTER TABLE catalog_mobiles ADD COLUMN image TEXT;');
  console.log('Added image column to catalog_mobiles');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('Column image already exists in catalog_mobiles');
  } else {
    console.error('Error adding column:', e.message);
  }
}

db.close();
