#!/usr/bin/env node
/**
 * Seed QA database
 * Loads DATABASE_URL from .env.qa and runs db seed
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
console.log('🌱 Seeding QA database...');
console.log('Database:', databaseUrl.split('://')[0] + '://***\n');

try {
  execSync('npx tsx db/seed.ts', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  console.log('\n✅ QA database seeded successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Seed failed:', error.message);
  process.exit(1);
}
