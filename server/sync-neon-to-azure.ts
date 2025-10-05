import { Pool } from 'pg';

async function syncNeonToAzure() {
  const neonUrl = process.env.DATABASE_URL_NEON;
  const azureUrl = process.env.DATABASE_URL;

  console.log("🔄 Starting incremental Neon → Azure database sync...");

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

    // Get counts from both databases
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

    console.log("\n📊 Neon database (source):", neonCounts.rows[0]);
    console.log("📊 Azure database (before sync):", azureCounts.rows[0]);

    // Tables to sync in dependency order
    const lookupTables = [
      'qualifications',
      'specializations',
      'subjects'
    ];

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

    const junctionTables = [
      'teacher_qualifications',
      'teacher_specializations',
      'teacher_subjects'
    ];

    const configTables = [
      'payment_configs',
      'teacher_payment_configs'
    ];

    console.log("\n🔄 Starting incremental sync (UPSERT only)...\n");

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
          console.log(`⏭️  Skipping ${table} (no data in Neon)`);
          continue;
        }

        console.log(`📦 Syncing ${table}: ${rows.length} records from Neon`);

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

        // Get primary key column
        const pkResult = await azurePool.query(`
          SELECT a.attname AS column_name
          FROM pg_index i
          JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $1::regclass AND i.indisprimary
        `, [table]);

        const pkColumn = pkResult.rows[0]?.column_name || 'id';

        // UPSERT data into Azure (insert or update on conflict)
        let insertCount = 0;
        let updateCount = 0;
        let skipCount = 0;

        for (const row of rows) {
          try {
            const columns = Object.keys(row);
            const values = Object.values(row).map((val, idx) => {
              const colName = columns[idx];
              const colInfo = columnTypes.get(colName);
              
              // Convert JSONB/JSON objects to strings for Azure
              if (colInfo && val !== null && typeof val === 'object' && 
                  (colInfo.data_type === 'json' || colInfo.data_type === 'jsonb' || 
                   colInfo.udt_name === 'json' || colInfo.udt_name === 'jsonb')) {
                return JSON.stringify(val);
              }
              
              return val;
            });
            
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            // Create UPSERT query (INSERT ... ON CONFLICT DO UPDATE)
            const updateColumns = columns
              .filter(col => col !== pkColumn)
              .map(col => `${col} = EXCLUDED.${col}`)
              .join(', ');

            const upsertQuery = updateColumns
              ? `
                INSERT INTO ${table} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (${pkColumn}) DO UPDATE SET ${updateColumns}
              `
              : `
                INSERT INTO ${table} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (${pkColumn}) DO NOTHING
              `;
            
            const result = await azurePool.query(upsertQuery, values);
            
            // Check if row was inserted or updated (PostgreSQL returns rowCount)
            if (result.rowCount && result.rowCount > 0) {
              insertCount++;
            } else {
              skipCount++;
            }
          } catch (error: any) {
            console.log(`  ⚠️  Error upserting row:`, error.message);
          }
        }

        console.log(`  ✅ ${insertCount} inserted/updated, ${skipCount} already up-to-date`);
      } catch (error: any) {
        console.log(`⚠️  Warning syncing ${table}:`, error.message);
      }
    }

    // Verify sync
    const azureCountsAfter = await azurePool.query(`
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
    console.log("\n📊 Azure database (after sync):", azureCountsAfter.rows[0]);

    // Compare counts
    console.log("\n🔍 Verification:");
    const neon = neonCounts.rows[0];
    const azure = azureCountsAfter.rows[0];
    
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

    console.log("\n🎉 Incremental database sync completed!");

  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  } finally {
    await neonPool.end();
    await azurePool.end();
  }
}

syncNeonToAzure().catch(console.error);
