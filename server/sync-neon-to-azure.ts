import { Pool } from 'pg';
import * as schema from "@shared/schema";

// Script to sync data from Neon (Replit) to Azure database
async function syncNeonToAzure() {
  console.log("🔄 Starting Neon → Azure database sync...");

  const neonUrl = process.env.DATABASE_URL_NEON;
  const azureUrl = process.env.DATABASE_URL;

  if (!neonUrl) {
    throw new Error("DATABASE_URL_NEON is required for source database");
  }
  if (!azureUrl) {
    throw new Error("DATABASE_URL is required for target database");
  }

  const neonPool = new Pool({ connectionString: neonUrl });
  const azurePool = new Pool({ 
    connectionString: azureUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connections
    console.log("🔗 Testing Neon connection...");
    await neonPool.query('SELECT 1');
    console.log("✅ Neon connected");

    console.log("🔗 Testing Azure connection...");
    await azurePool.query('SELECT 1');
    console.log("✅ Azure connected");

    // Get counts from Neon
    const neonCounts = await neonPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM reviews) as reviews,
        (SELECT COUNT(*) FROM achievements) as achievements,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM teacher_profiles) as teacher_profiles
    `);

    console.log("\n📊 Neon database current state:");
    console.log(neonCounts.rows[0]);

    // Tables to sync in dependency order
    const tables = [
      'users',
      'mentors',
      'students',
      'teacher_profiles',
      'courses',
      'bookings',
      'reviews',
      'achievements',
      // Add other tables as needed
      'qualifications',
      'specializations',
      'subjects',
      'teacher_qualifications',
      'teacher_specializations',
      'teacher_subjects',
      'payment_configs',
      'teacher_payment_configs'
    ];

    console.log("\n🔄 Starting data sync...");

    for (const table of tables) {
      try {
        // Get data from Neon
        const { rows } = await neonPool.query(`SELECT * FROM ${table}`);
        
        if (rows.length === 0) {
          console.log(`⏭️  Skipping ${table} (no data)`);
          continue;
        }

        console.log(`📦 Syncing ${table}: ${rows.length} records`);

        // Delete existing data in Azure (careful!)
        await azurePool.query(`DELETE FROM ${table}`);

        // Insert data into Azure
        for (const row of rows) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          const insertQuery = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;
          
          await azurePool.query(insertQuery, values);
        }

        console.log(`✅ Synced ${table}: ${rows.length} records`);
      } catch (error: any) {
        console.log(`⚠️  Warning syncing ${table}:`, error.message);
        // Continue with other tables even if one fails
      }
    }

    // Verify sync
    const azureCounts = await azurePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM reviews) as reviews,
        (SELECT COUNT(*) FROM achievements) as achievements,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM teacher_profiles) as teacher_profiles
    `);

    console.log("\n✅ Sync complete!");
    console.log("\n📊 Azure database after sync:");
    console.log(azureCounts.rows[0]);

    // Compare counts
    console.log("\n🔍 Verification:");
    const neon = neonCounts.rows[0];
    const azure = azureCounts.rows[0];
    
    let allMatch = true;
    for (const key of Object.keys(neon)) {
      const match = neon[key] === azure[key];
      const icon = match ? '✅' : '❌';
      console.log(`${icon} ${key}: Neon=${neon[key]}, Azure=${azure[key]}`);
      if (!match) allMatch = false;
    }

    if (!allMatch) {
      console.log("\n⚠️  Some counts don't match - review the sync");
    } else {
      console.log("\n✅ All data synced successfully!");
    }

  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  } finally {
    await neonPool.end();
    await azurePool.end();
  }
}

syncNeonToAzure().then(() => {
  console.log("\n🎉 Database sync completed!");
  process.exit(0);
}).catch((error) => {
  console.error("\n❌ Database sync failed:", error);
  process.exit(1);
});
