#!/usr/bin/env node

/**
 * Azure PostgreSQL Database Setup Script
 * This script creates all application tables in your Azure PostgreSQL database
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Azure PostgreSQL Database Setup');
console.log('===================================');

function askPassword() {
  return new Promise((resolve) => {
    rl.question('Enter your Azure PostgreSQL password: ', (password) => {
      resolve(password);
    });
  });
}

async function setupDatabase() {
  try {
    const password = await askPassword();
    const azureUrl = `postgresql://pgadmin:${password}@kidzaimathpg11699.postgres.database.azure.com:5432/kidzaimathpgdb?sslmode=require`;
    
    console.log('\n🔧 Step 1: Creating pgcrypto extension...');
    
    // Create pgcrypto extension
    execSync(`psql "${azureUrl}" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"`, {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('✅ pgcrypto extension created');
    
    console.log('\n🔧 Step 2: Pushing database schema to Azure...');
    
    // Set DATABASE_URL and push schema
    execSync(`DATABASE_URL="${azureUrl}" npx drizzle-kit push`, {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: azureUrl }
    });
    
    console.log('✅ Schema pushed to Azure PostgreSQL');
    
    console.log('\n🔧 Step 3: Creating initial data...');
    
    // Run seed script if it exists, or create basic data
    execSync(`DATABASE_URL="${azureUrl}" node -e "
      const { db } = require('./server/db');
      const { users, mentors, students } = require('./shared/schema');
      
      async function seedData() {
        console.log('Creating initial users...');
        
        // Create test users
        const user1 = await db.insert(users).values({
          email: 'udayakirang99@gmail.com',
          password: 'Hello111',
          firstName: 'Student',
          lastName: 'User',
          role: 'student'
        }).returning();
        
        const user2 = await db.insert(users).values({
          email: 'teacher@codeconnect.com',
          password: 'Hello111',
          firstName: 'Teacher',
          lastName: 'User',
          role: 'mentor'
        }).returning();
        
        const user3 = await db.insert(users).values({
          email: 'admin@codeconnect.com',
          password: 'Hello111',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        }).returning();
        
        // Create student record
        await db.insert(students).values({
          userId: user1[0].id,
          age: 16,
          interests: ['JavaScript', 'Python']
        });
        
        // Create mentor record
        await db.insert(mentors).values({
          userId: user2[0].id,
          title: 'Senior JavaScript Developer',
          description: 'Experienced developer with 8+ years in web development',
          specialties: ['JavaScript', 'React', 'Node.js'],
          experience: 8,
          hourlyRate: '75.00',
          availableSlots: []
        });
        
        console.log('✅ Initial data created successfully');
        process.exit(0);
      }
      
      seedData().catch(console.error);
    "`, {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: azureUrl }
    });
    
    console.log('\n🔧 Step 4: Verifying setup...');
    
    // Verify tables exist
    execSync(`psql "${azureUrl}" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"`, {
      stdio: 'inherit'
    });
    
    console.log('\n🎉 Azure PostgreSQL database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your Azure App Service to use this DATABASE_URL:');
    console.log(`   postgresql://pgadmin:YOUR_PASSWORD@kidzaimathpg11699.postgres.database.azure.com:5432/kidzaimathpgdb?sslmode=require`);
    console.log('2. Restart your Azure App Service');
    console.log('3. Test login on your Azure app');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupDatabase();