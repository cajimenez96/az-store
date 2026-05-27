#!/usr/bin/env node
/**
 * Reset QA database completely
 * - Drops all tables
 * - Applies all migrations
 * - Runs seeds
 *
 * WARNING: This will DELETE ALL DATA in QA database
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
console.log('⚠️  WARNING: This will DELETE ALL DATA in QA database');
console.log('Database:', databaseUrl.split('://')[0] + '://***\n');

console.log('🔄 Resetting QA database...');
console.log('  1. Dropping all tables');
console.log('  2. Running all migrations');
console.log('  3. Executing seeds\n');

try {
  // Run prisma migrate reset with --force flag to skip confirmation
  execSync('npx prisma migrate reset --force', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log('\n✅ QA database reset and seeded successfully!');
  console.log('   All tables recreated, migrations applied, and data seeded.');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Database reset failed:', error.message);
  process.exit(1);
}
