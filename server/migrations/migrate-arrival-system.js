/**
 * Migration Script: Arrival-Based Deadline System
 * 
 * This script migrates existing visas to the new arrival-based deadline system.
 * It ensures backward compatibility while introducing the new arrival verification logic.
 * 
 * Run this script AFTER deploying the new schema changes.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the updated Visa model
const Visa = require('../models/Visa');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://andydaddy080:1s8trWSbR9J8rNkq@cluster0.g5rsvmu.mongodb.net/visa_system?retryWrites=true&w=majority&appName=Cluster0';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Connected to MongoDB for migration');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function migrateVisas() {
  try {
    console.log('🔄 Starting visa migration to arrival-based deadline system...');
    
    // Find all existing visas
    const existingVisas = await Visa.find({});
    console.log(`📊 Found ${existingVisas.length} existing visas to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const visa of existingVisas) {
      try {
        // Check if already migrated (has new fields)
        if (visa.hasOwnProperty('maidArrivalVerified')) {
          console.log(`⏭️  Visa ${visa.visaNumber} already migrated, skipping`);
          skippedCount++;
          continue;
        }
        
        // Set default values for new arrival fields
        visa.maidArrivalVerified = false;
        visa.maidArrivalDate = null;
        visa.maidArrivalVerifiedBy = null;
        visa.maidArrivalNotes = '';
        visa.activeCancellationDeadline = null;
        visa.deadlineStatus = 'inactive';
        
        // For visas that are already sold or cancelled, keep their current state
        if (visa.status === 'مباعة' || visa.status === 'ملغاة') {
          // These visas don't need arrival verification
          console.log(`📋 Visa ${visa.visaNumber} is ${visa.status}, keeping current state`);
        } else {
          // For active visas, they remain protected until arrival verification
          console.log(`🛡️  Visa ${visa.visaNumber} is now protected from auto-cancellation until arrival verification`);
        }
        
        await visa.save();
        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`📈 Progress: ${migratedCount}/${existingVisas.length} visas migrated`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrating visa ${visa.visaNumber}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} visas`);
    console.log(`⏭️  Already migrated (skipped): ${skippedCount} visas`);
    console.log(`❌ Errors: ${errorCount} visas`);
    console.log(`📋 Total processed: ${migratedCount + skippedCount + errorCount} visas`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. All existing visas are now protected from auto-cancellation');
      console.log('2. Use the arrival verification feature for visas in stage د or مكتملة');
      console.log('3. Only visas with verified arrivals will have active 30-day deadlines');
      console.log('4. Monitor the system logs for automatic cancellation activities');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review the error logs.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function validateMigration() {
  try {
    console.log('\n🔍 Validating migration...');
    
    // Check that all visas have the new fields
    const visasWithoutNewFields = await Visa.find({
      $or: [
        { maidArrivalVerified: { $exists: false } },
        { deadlineStatus: { $exists: false } }
      ]
    });
    
    if (visasWithoutNewFields.length > 0) {
      console.log(`⚠️  Found ${visasWithoutNewFields.length} visas without new fields`);
      return false;
    }
    
    // Check arrival verification eligibility
    const eligibleVisas = await Visa.find({
      currentStage: { $in: ['د', 'مكتملة'] },
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع'] },
      maidArrivalVerified: false
    });
    
    console.log(`📋 Found ${eligibleVisas.length} visas eligible for arrival verification`);
    
    // Check protected visas (no active deadline)
    const protectedVisas = await Visa.find({
      maidArrivalVerified: false,
      deadlineStatus: 'inactive',
      status: { $in: ['قيد_الشراء', 'معروضة_للبيع'] }
    });
    
    console.log(`🛡️  Found ${protectedVisas.length} visas protected from auto-cancellation`);
    
    console.log('✅ Migration validation completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    return false;
  }
}

async function runMigration() {
  try {
    await connectToDatabase();
    await migrateVisas();
    
    const isValid = await validateMigration();
    
    if (isValid) {
      console.log('\n🎯 Migration and validation completed successfully!');
      console.log('\n🚀 The arrival-based deadline system is now active:');
      console.log('   • Existing visas are protected from auto-cancellation');
      console.log('   • New 30-day deadlines start only after arrival verification');
      console.log('   • Use the frontend UI to verify arrivals for eligible visas');
    } else {
      console.log('\n❌ Migration validation failed. Please review and fix issues.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  console.log('🚀 Starting Arrival-Based Deadline System Migration');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🔗 Database:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
  console.log('');
  
  runMigration().catch(error => {
    console.error('💥 Migration script crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  migrateVisas,
  validateMigration
};
