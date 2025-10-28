#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * Simple script to run the arrival-based deadline system migration.
 * Usage: node run-migration.js
 */

const { runMigration } = require('./migrations/migrate-arrival-system');

console.log('🔄 Running Arrival-Based Deadline System Migration...\n');

runMigration()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
