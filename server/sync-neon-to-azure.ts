import { Pool } from 'pg';

async function syncNeonToAzure() {
  const neonUrl = process.env.DATABASE_URL_NEON;
  const azureUrl = process.env.DATABASE_URL;

  console.log("🔄 Starting Neon → Azure database sync...");

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
    // Core tables first, then dependent tables
    const coreTables = [
      'users',
      'mentors',
      'students',
      'teacher_profiles',
      'courses',
      'bookings',
      'reviews',
      'achievements'
    ];

    const lookupTables = [
      'qualifications',
      'specializations',
      'subjects'
    ];

    const junctionTables = [
      'teacher_qualifications',
      'teacher_specializations',
      'teacher_subjects'
    ];

    const configTables = [
      'payment_configs',
      'teacher_payment_configs'
    ];

    console.log("\n🗑️  Clearing Azure database (reverse dependency order)...");
    
    // Truncate all tables (CASCADE handles foreign keys)
    const allTables = [...configTables, ...junctionTables, ...coreTables, ...lookupTables];
    for (const table of allTables) {
      try {
        await azurePool.query(`TRUNCATE TABLE ${table} CASCADE`);
        console.log(`  ✓ Cleared ${table}`);
      } catch (error: any) {
        if (!error.message.includes('does not exist')) {
          console.log(`  ⚠️  Could not clear ${table}:`, error.message);
        }
      }
    }

    console.log("\n🔄 Starting data sync...");

    // Sync in proper dependency order
    const tablesToSync = [...lookupTables, ...coreTables, ...junctionTables, ...configTables];

    for (const table of tablesToSync) {
      try {
        // Check if table exists in Neon
        const tableExists = await neonPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);

        if (!tableExists.rows[0].exists) {
          continue;
        }

        // Get data from Neon
        const { rows } = await neonPool.query(`SELECT * FROM ${table}`);
        
        if (rows.length === 0) {
          console.log(`⏭️  Skipping ${table} (no data)`);
          continue;
        }

        console.log(`📦 Syncing ${table}: ${rows.length} records`);

        // Check if table exists in Azure
        const azureTableExists = await azurePool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);

        if (!azureTableExists.rows[0].exists) {
          console.log(`  ⚠️  Table ${table} does not exist in Azure, skipping`);
          continue;
        }

        // Get Azure column info to handle JSON/JSONB differences
        const azureColumns = await azurePool.query(`
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [table]);
        
        const columnTypes = new Map(
          azureColumns.rows.map((r: any) => [r.column_name, { data_type: r.data_type, udt_name: r.udt_name }])
        );

        // Insert data into Azure
        let successCount = 0;
        for (const row of rows) {
          try {
            const columns = Object.keys(row);
            const values = Object.values(row).map((val, idx) => {
              const colName = columns[idx];
              const colInfo = columnTypes.get(colName);
              
              // Convert JSONB/JSON objects to strings for Azure
              // Check both data_type and udt_name for json/jsonb
              if (colInfo && val !== null && typeof val === 'object' && 
                  (colInfo.data_type === 'json' || colInfo.data_type === 'jsonb' || 
                   colInfo.udt_name === 'json' || colInfo.udt_name === 'jsonb')) {
                return JSON.stringify(val);
              }
              
              return val;
            });
            
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            const insertQuery = `
              INSERT INTO ${table} (${columns.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT DO NOTHING
            `;
            
            await azurePool.query(insertQuery, values);
            successCount++;
          } catch (error: any) {
            console.log(`  ⚠️  Error inserting row:`, error.message);
          }
        }

        console.log(`✅ Synced ${table}: ${successCount}/${rows.length} records`);
      } catch (error: any) {
        console.log(`⚠️  Warning syncing ${table}:`, error.message);
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
    }

    console.log("\n🎉 Database sync completed!");

  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  } finally {
    await neonPool.end();
    await azurePool.end();
  }
}

syncNeonToAzure().catch(console.error);
