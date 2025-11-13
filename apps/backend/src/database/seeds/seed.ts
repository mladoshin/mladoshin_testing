import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import dataSource from '../data-source';

// Load environment variables
config();

async function seed() {
  console.log('🌱 Starting database seeding...');

  try {
    // Initialize data source
    await dataSource.initialize();
    console.log('✅ Data source initialized');

    // Optional: Add minimal seed data here if needed
    // For now, we keep the database empty as tests will create their own data

    console.log('✅ Seeding completed successfully');
    console.log('ℹ️  Database is empty - tests will create their own data');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
