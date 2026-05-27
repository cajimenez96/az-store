#!/usr/bin/env node
/**
 * Execute pending Prisma migrations against production database
 * Usage: node scripts/migrate-production.js
 *
 * Requires DATABASE_URL env var pointing to production Postgres
 */

const { execSync } = require('child_process');

console.log('🔄 Deploying pending migrations...\n');

try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env },
  });
  console.log('\n✅ Migrations deployed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
