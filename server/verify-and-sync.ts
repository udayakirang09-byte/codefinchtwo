import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n🔍 Pre-Deployment Verification\n');
  console.log('=' .repeat(50));
  
  // Check if schema file has uncommitted changes
  let hasSchemaChanges = false;
  let hasUncommittedChanges = false;
  
  try {
    // Check for uncommitted changes to schema.ts
    const diffOutput = execSync('git diff --name-only shared/schema.ts', { encoding: 'utf-8' });
    if (diffOutput.trim()) {
      hasSchemaChanges = true;
      hasUncommittedChanges = true;
      console.log('⚠️  Uncommitted changes detected in shared/schema.ts');
    }
    
    // Check for staged changes to schema.ts
    const stagedOutput = execSync('git diff --cached --name-only shared/schema.ts', { encoding: 'utf-8' });
    if (stagedOutput.trim()) {
      hasSchemaChanges = true;
      console.log('📝 Staged changes detected in shared/schema.ts');
    }
    
    // Check last commit for schema changes
    const lastCommitOutput = execSync('git diff HEAD~1 HEAD --name-only shared/schema.ts 2>/dev/null || true', { encoding: 'utf-8' });
    if (lastCommitOutput.trim() && !hasSchemaChanges) {
      hasSchemaChanges = true;
      console.log('✅ Schema changes found in last commit');
    }
    
  } catch (error: any) {
    console.log('ℹ️  Unable to check git history (this is normal for first commit)');
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (hasSchemaChanges) {
    console.log('\n🗄️  DATABASE CHANGES DETECTED!\n');
    console.log('Your schema.ts has been modified. This requires:');
    console.log('1. Pushing schema changes to Neon (dev database)');
    console.log('2. Syncing all data to Azure (production database)\n');
    
    if (hasUncommittedChanges) {
      console.log('⚠️  WARNING: You have uncommitted schema changes!');
      console.log('Please commit your changes first.\n');
      
      const commit = await question('Do you want to commit these changes now? (y/n): ');
      if (commit.toLowerCase() === 'y') {
        const message = await question('Enter commit message: ');
        execSync(`git add shared/schema.ts`);
        execSync(`git commit -m "${message}"`);
        console.log('✅ Changes committed!\n');
      } else {
        console.log('❌ Deployment cancelled. Please commit your changes first.');
        rl.close();
        process.exit(1);
      }
    }
    
    // Require database sync when schema changes detected
    console.log('🔒 DATABASE SYNC REQUIRED!\n');
    console.log('Schema changes detected. You must sync before deploying.\n');
    console.log('Options:\n');
    console.log('1. Auto-sync now (recommended) - Sync automatically');
    console.log('2. I already synced manually - Verify and continue');
    console.log('3. Cancel deployment - I\'ll sync later\n');
    
    const choice = await question('Select option (1/2/3): ');
    
    if (choice === '1') {
      console.log('\n🔄 Starting database sync to Azure...\n');
      
      try {
        // First, push schema to Neon
        console.log('📤 Step 1: Pushing schema to Neon database...');
        execSync('npm run db:push', { stdio: 'inherit' });
        console.log('✅ Schema pushed to Neon\n');
        
        // Then sync to Azure
        console.log('📤 Step 2: Syncing data to Azure...');
        execSync('FORCE_SYNC=true tsx server/sync-to-azure.ts', { stdio: 'inherit' });
        console.log('\n✅ Database fully synced to Azure!\n');
        
      } catch (error: any) {
        console.error('❌ Sync failed:', error.message);
        console.log('\n💡 Fix the error and run sync manually:');
        console.log('   npm run db:push && FORCE_SYNC=true tsx server/sync-to-azure.ts\n');
        rl.close();
        process.exit(1);
      }
    } else if (choice === '2') {
      console.log('\n🔍 Verifying manual sync...\n');
      
      const confirmed = await question('Did you run both commands?\n  1. npm run db:push\n  2. FORCE_SYNC=true tsx server/sync-to-azure.ts\n\nConfirm (yes/no): ');
      
      if (confirmed.toLowerCase() !== 'yes') {
        console.log('\n❌ Deployment cancelled - Database not synced!');
        console.log('\nPlease sync manually:');
        console.log('   npm run db:push');
        console.log('   FORCE_SYNC=true tsx server/sync-to-azure.ts');
        console.log('\nThen run ./deploy.sh again.\n');
        rl.close();
        process.exit(1);
      }
      
      console.log('\n✅ Manual sync confirmed\n');
    } else {
      console.log('\n❌ Deployment cancelled - Database sync required!');
      console.log('\nYou cannot deploy with unsynced database changes.');
      console.log('\nTo deploy, first sync the database:');
      console.log('   npm run db:push');
      console.log('   FORCE_SYNC=true tsx server/sync-to-azure.ts');
      console.log('\nThen run ./deploy.sh again.\n');
      rl.close();
      process.exit(1);
    }
    
  } else {
    console.log('\n✅ No schema changes detected - database sync not required\n');
  }
  
  console.log('='.repeat(50));
  console.log('\n🚀 Ready for deployment!\n');
  console.log('Next steps:');
  console.log('1. Push your code: git push');
  console.log('2. Deploy to Azure App Service');
  console.log('3. Verify application is running\n');
  
  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
