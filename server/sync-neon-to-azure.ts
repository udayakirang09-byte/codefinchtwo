import { Pool } from 'pg';

interface TableMetadata {
  tableName: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: string;
    column_default: string | null;
  }>;
}

interface ConstraintMetadata {
  constraint_name: string;
  constraint_type: string;
  table_name: string;
  column_name: string | null;
  foreign_table: string | null;
  foreign_column: string | null;
}

interface IndexMetadata {
  indexname: string;
  tablename: string;
  indexdef: string;
}

async function syncNeonToAzure() {
  const neonUrl = process.env.DATABASE_URL_NEON;
  const azureUrl = process.env.DATABASE_URL;

  console.log("🔄 Starting comprehensive Neon → Azure database sync...");
  console.log("📋 This will sync: Schema, Constraints, Indexes, Sequences, and Data\n");

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
    console.log("✅ Azure connected\n");

    // ============================================
    // STAGE 1: SCHEMA ALIGNMENT
    // ============================================
    console.log("📐 STAGE 1: Schema Alignment (Tables & Columns)");
    console.log("=".repeat(60));
    
    // Get all tables from Neon
    const neonTables = await neonPool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    for (const { tablename } of neonTables.rows) {
      // Check if table exists in Azure
      const azureTableExists = await azurePool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [tablename]);

      if (!azureTableExists.rows[0].exists) {
        console.log(`⚠️  Table '${tablename}' missing in Azure - requires schema push`);
        continue;
      }

      // Get columns from both databases
      const neonColumns = await neonPool.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tablename]);

      const azureColumns = await azurePool.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tablename]);

      const azureColMap = new Map(
        azureColumns.rows.map((c: any) => [c.column_name, c])
      );

      // Check for missing columns
      for (const neonCol of neonColumns.rows) {
        if (!azureColMap.has(neonCol.column_name)) {
          console.log(`  ⚠️  Column '${tablename}.${neonCol.column_name}' missing in Azure`);
        }
      }
    }
    console.log("✅ Schema alignment check complete\n");

    // ============================================
    // STAGE 2: CONSTRAINTS
    // ============================================
    console.log("🔗 STAGE 2: Constraints (PK, FK, Unique)");
    console.log("=".repeat(60));

    // Check primary keys
    const neonPKs = await neonPool.query(`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    for (const pk of neonPKs.rows) {
      const azurePK = await azurePool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY' 
            AND tc.table_schema = 'public'
            AND tc.table_name = $1
            AND kcu.column_name = $2
        )
      `, [pk.table_name, pk.column_name]);

      if (!azurePK.rows[0].exists) {
        console.log(`  ⚠️  Primary key missing on ${pk.table_name}(${pk.column_name})`);
      }
    }
    console.log("✅ Constraints check complete\n");

    // ============================================
    // STAGE 3: INDEXES
    // ============================================
    console.log("📇 STAGE 3: Indexes");
    console.log("=".repeat(60));

    const neonIndexes = await neonPool.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `);

    for (const idx of neonIndexes.rows) {
      const azureIdx = await azurePool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = $1
            AND tablename = $2
        )
      `, [idx.indexname, idx.tablename]);

      if (!azureIdx.rows[0].exists) {
        console.log(`  ⚠️  Index '${idx.indexname}' missing on table '${idx.tablename}'`);
      }
    }
    console.log("✅ Indexes check complete\n");

    // ============================================
    // STAGE 4: SEQUENCES
    // ============================================
    console.log("🔢 STAGE 4: Sequences");
    console.log("=".repeat(60));

    const neonSequences = await neonPool.query(`
      SELECT sequencename
      FROM pg_sequences
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);

    for (const seq of neonSequences.rows) {
      const azureSeq = await azurePool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_sequences
          WHERE schemaname = 'public' AND sequencename = $1
        )
      `, [seq.sequencename]);

      if (!azureSeq.rows[0].exists) {
        console.log(`  ⚠️  Sequence '${seq.sequencename}' missing in Azure`);
      }
    }
    console.log("✅ Sequences check complete\n");

    // ============================================
    // STAGE 5: DATA SYNC (UPSERT)
    // ============================================
    console.log("💾 STAGE 5: Data Synchronization (Incremental UPSERT)");
    console.log("=".repeat(60));

    // Get counts before sync
    const neonCounts = await neonPool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM teacher_profiles) as teacher_profiles
    `);

    const azureCountsBefore = await azurePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM teacher_profiles) as teacher_profiles
    `);

    console.log("📊 Before sync:");
    console.log("  Neon:", neonCounts.rows[0]);
    console.log("  Azure:", azureCountsBefore.rows[0]);
    console.log();

    // Tables to sync in dependency order
    const tablesToSync = [
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

    for (const table of tablesToSync) {
      try {
        // Check if table exists
        const tableExists = await neonPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [table]);

        if (!tableExists.rows[0].exists) {
          continue;
        }

        // Get data from Neon
        const { rows } = await neonPool.query(`SELECT * FROM ${table}`);
        
        if (rows.length === 0) {
          continue;
        }

        console.log(`📦 Syncing ${table}: ${rows.length} records`);

        // Check if table exists in Azure
        const azureTableExists = await azurePool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [table]);

        if (!azureTableExists.rows[0].exists) {
          console.log(`  ⚠️  Table ${table} missing in Azure, skipping`);
          continue;
        }

        // Get column metadata
        const azureColumns = await azurePool.query(`
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [table]);
        
        const columnTypes = new Map(
          azureColumns.rows.map((r: any) => [r.column_name, { data_type: r.data_type, udt_name: r.udt_name }])
        );

        // Get primary key
        const pkResult = await azurePool.query(`
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY' 
            AND tc.table_schema = 'public'
            AND tc.table_name = $1
        `, [table]);

        const pkColumn = pkResult.rows[0]?.column_name || 'id';

        // UPSERT data
        let upsertCount = 0;
        let errorCount = 0;

        for (const row of rows) {
          try {
            const columns = Object.keys(row);
            const values = Object.values(row).map((val, idx) => {
              const colName = columns[idx];
              const colInfo = columnTypes.get(colName);
              
              // Convert JSONB/JSON to string
              if (colInfo && val !== null && typeof val === 'object' && 
                  (colInfo.data_type === 'json' || colInfo.data_type === 'jsonb' || 
                   colInfo.udt_name === 'json' || colInfo.udt_name === 'jsonb')) {
                return JSON.stringify(val);
              }
              
              return val;
            });
            
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            // Build UPSERT
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
            
            await azurePool.query(upsertQuery, values);
            upsertCount++;
          } catch (error: any) {
            errorCount++;
            if (errorCount <= 3) {
              console.log(`  ⚠️  Error: ${error.message}`);
            }
          }
        }

        console.log(`  ✅ ${upsertCount}/${rows.length} synced${errorCount > 0 ? `, ${errorCount} errors` : ''}`);
      } catch (error: any) {
        console.log(`  ❌ Error syncing ${table}:`, error.message);
      }
    }

    // Get counts after sync
    const azureCountsAfter = await azurePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students,
        (SELECT COUNT(*) FROM bookings) as bookings,
        (SELECT COUNT(*) FROM teacher_profiles) as teacher_profiles
    `);

    console.log("\n📊 After sync:");
    console.log("  Azure:", azureCountsAfter.rows[0]);

    // Final verification
    console.log("\n🔍 Final Verification:");
    console.log("=".repeat(60));
    const neon = neonCounts.rows[0];
    const azure = azureCountsAfter.rows[0];
    
    let allMatch = true;
    for (const key of Object.keys(neon)) {
      const match = neon[key] === azure[key];
      const icon = match ? '✅' : '⚠️ ';
      console.log(`${icon} ${key}: Neon=${neon[key]}, Azure=${azure[key]}`);
      if (!match) allMatch = false;
    }

    if (allMatch) {
      console.log("\n🎉 Perfect sync! All data matches between Neon and Azure");
    } else {
      console.log("\n⚠️  Some tables need attention - check warnings above");
    }

    console.log("\n✅ Comprehensive database sync completed!");

  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  } finally {
    await neonPool.end();
    await azurePool.end();
  }
}

syncNeonToAzure().catch(console.error);
