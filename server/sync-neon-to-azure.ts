import { Pool } from 'pg';

async function syncNeonToAzure() {
  const neonUrl = process.env.DATABASE_URL_NEON;
  const azureUrl = process.env.DATABASE_URL;

  console.log("🔄 Starting Neon → Azure database sync...");

  if (!neonUrl) {
    throw new Error("DATABASE_URL_NEON is required");
  }
  if (!azureUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const neonPool = new Pool({ connectionString: neonUrl });
  const azurePool = new Pool({ 
    connectionString: azureUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🔗 Testing connections...");
    await neonPool.query('SELECT 1');
    console.log("✅ Neon connected");
    await azurePool.query('SELECT 1');
    console.log("✅ Azure connected\n");

    // Get current state
    const neonCounts = await neonPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM bookings) as bookings
    `);

    const azureCounts = await azurePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM bookings) as bookings
    `);

    console.log("📊 Current state:");
    console.log("  Neon:", neonCounts.rows[0]);
    console.log("  Azure:", azureCounts.rows[0]);
    console.log();

    // Tables in dependency order
    const tables = [
      'qualifications',
      'specializations',
      'subjects',
      'users',
      'mentors',
      'students',
      'teacher_profiles',
      'courses',
      'bookings',
      'reviews',
      'achievements',
      'teacher_qualifications',
      'teacher_subjects',
      'payment_configs',
      'teacher_payment_configs'
    ];

    console.log("🔄 Starting incremental sync (UPSERT)...\n");

    for (const table of tables) {
      try {
        // Check if table exists in Neon
        const exists = await neonPool.query(
          `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = $1)`,
          [table]
        );

        if (!exists.rows[0].exists) {
          continue;
        }

        // Get data from Neon
        const result = await neonPool.query(`SELECT * FROM ${table}`);
        
        if (result.rows.length === 0) {
          continue;
        }

        console.log(`📦 ${table}: ${result.rows.length} records`);

        // Check if table exists in Azure
        const azureExists = await azurePool.query(
          `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = $1)`,
          [table]
        );

        if (!azureExists.rows[0].exists) {
          console.log(`  ⚠️  Table missing in Azure\n`);
          continue;
        }

        // Get column info from Azure
        const cols = await azurePool.query(
          `SELECT column_name, data_type, udt_name 
           FROM information_schema.columns 
           WHERE table_schema = 'public' AND table_name = $1`,
          [table]
        );

        const colMap = new Map();
        for (const col of cols.rows) {
          colMap.set(col.column_name, {
            dataType: col.data_type,
            udtName: col.udt_name
          });
        }

        // Get primary key
        const pkQuery = await azurePool.query(
          `SELECT kcu.column_name
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu 
             ON tc.constraint_name = kcu.constraint_name
           WHERE tc.constraint_type = 'PRIMARY KEY' 
             AND tc.table_schema = 'public'
             AND tc.table_name = $1`,
          [table]
        );

        const pk = pkQuery.rows[0]?.column_name || 'id';

        // Sync each row
        let synced = 0;
        let errors = 0;

        for (const row of result.rows) {
          try {
            const columns = Object.keys(row);
            const values = [];

            // Process each value
            for (let i = 0; i < columns.length; i++) {
              const colName = columns[i];
              let value = row[colName];

              // Convert JSONB/JSON objects to strings
              if (value !== null && typeof value === 'object') {
                const colInfo = colMap.get(colName);
                if (colInfo && 
                    (colInfo.dataType === 'json' || colInfo.dataType === 'jsonb' ||
                     colInfo.udtName === 'json' || colInfo.udtName === 'jsonb')) {
                  value = JSON.stringify(value);
                }
              }

              values.push(value);
            }

            // Build UPSERT query
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            const updateSet = columns
              .filter(col => col !== pk)
              .map(col => `${col} = EXCLUDED.${col}`)
              .join(', ');

            let query;
            if (updateSet) {
              query = `
                INSERT INTO ${table} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (${pk}) DO UPDATE SET ${updateSet}
              `;
            } else {
              query = `
                INSERT INTO ${table} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (${pk}) DO NOTHING
              `;
            }

            await azurePool.query(query, values);
            synced++;
          } catch (err: any) {
            errors++;
            if (errors <= 2) {
              console.log(`  ⚠️  ${err.message}`);
            }
          }
        }

        const status = errors > 0 ? ` (${errors} errors)` : '';
        console.log(`  ✅ ${synced}/${result.rows.length}${status}\n`);

      } catch (err: any) {
        console.log(`  ❌ ${err.message}\n`);
      }
    }

    // Final verification
    const finalCounts = await azurePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM bookings) as bookings
    `);

    console.log("📊 Final Azure state:", finalCounts.rows[0]);

    console.log("\n🔍 Verification:");
    const neon = neonCounts.rows[0];
    const azure = finalCounts.rows[0];
    
    let allMatch = true;
    for (const key in neon) {
      const match = neon[key] === azure[key];
      console.log(`${match ? '✅' : '⚠️ '} ${key}: Neon=${neon[key]}, Azure=${azure[key]}`);
      if (!match) allMatch = false;
    }

    if (allMatch) {
      console.log("\n🎉 Perfect sync!");
    } else {
      console.log("\n⚠️  Some differences remain");
    }

    console.log("\n✅ Sync complete");

  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  } finally {
    await neonPool.end();
    await azurePool.end();
  }
}

syncNeonToAzure().catch(console.error);
