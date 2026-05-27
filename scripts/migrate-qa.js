#!/usr/bin/env node
/**
 * Migrate QA database
 * Loads DATABASE_URL from .env.qa and runs prisma migrate deploy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read .env.qa
const envPath = path.join(__dirname, '..', '.env.qa');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Extract DATABASE_URL
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL not found in .env.qa');
  process.exit(1);
}

const databaseUrl = dbUrlMatch[1];
console.log('📡 Connecting to QA database...');
console.log('Database:', databaseUrl.split('://')[0] + '://***');

try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  console.log('\n✅ QA database migration complete!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
