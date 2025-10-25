import { Pool } from 'pg';

async function syncNeonToAzure() {
  const sourceUrl = process.env.DATABASE_URL;
  const azureUrl = process.env.DATABASE_URL_AZURE;

  console.log("🔄 Starting comprehensive Replit → Azure sync...\n");

  if (!sourceUrl || !azureUrl) {
    throw new Error("Both DATABASE_URL and DATABASE_URL_AZURE are required");
  }

  const sourcePool = new Pool({ connectionString: sourceUrl });
  const azurePool = new Pool({ 
    connectionString: azureUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🔗 Testing connections...");
    await sourcePool.query('SELECT 1');
    console.log("✅ Source database connected");
    await azurePool.query('SELECT 1');
    console.log("✅ Azure database connected\n");

    // STEP 1: FIX SCHEMA DIFFERENCES
    console.log("🔧 STEP 1: Fixing schema differences...\n");

    // Get all tables from source
    const sourceTables = await sourcePool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    for (const { tablename } of sourceTables.rows) {
      // Check if table exists in Azure
      const azureTableExists = await azurePool.query(
        `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = $1)`,
        [tablename]
      );

      if (!azureTableExists.rows[0].exists) {
        console.log(`⏭️  Table '${tablename}' missing in Azure (needs schema push)`);
        continue;
      }

      // Get columns from both databases
      const sourceCols = await sourcePool.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tablename]);

      const azureCols = await azurePool.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tablename]);

      const azureColMap = new Map(azureCols.rows.map(c => [c.column_name, c]));

      // Check for missing columns
      for (const sourceCol of sourceCols.rows) {
        if (!azureColMap.has(sourceCol.column_name)) {
          console.log(`  🔧 Adding column: ${tablename}.${sourceCol.column_name}`);
          
          // Build ALTER TABLE statement
          let colType = sourceCol.data_type;
          if (sourceCol.data_type === 'USER-DEFINED') {
            colType = sourceCol.udt_name;
          }
          if (sourceCol.data_type === 'ARRAY') {
            colType = sourceCol.udt_name + '[]';
          }
          
          const nullable = sourceCol.is_nullable === 'YES' ? '' : ' NOT NULL';
          const defaultVal = sourceCol.column_default ? ` DEFAULT ${sourceCol.column_default}` : '';
          
          try {
            await azurePool.query(`
              ALTER TABLE ${tablename} 
              ADD COLUMN ${sourceCol.column_name} ${colType}${defaultVal}${nullable}
            `);
            console.log(`    ✅ Added successfully`);
          } catch (err: any) {
            console.log(`    ⚠️  Could not add: ${err.message}`);
          }
        }
      }
    }

    console.log("\n✅ Schema sync complete\n");

    // STEP 2: SYNC DATA
    console.log("💾 STEP 2: Syncing data...\n");

    const tables = [
      'qualifications',
      'specializations',
      'subjects',
      'users',
      'mentors',
      'students',
      'teacher_profiles',
      'time_slots',
      'courses',
      'course_enrollments',
      'bookings',
      'reviews',
      'achievements',
      'teacher_qualifications',
      'teacher_subjects',
      'success_stories',
      'chat_sessions',
      'chat_messages',
      'video_sessions',
      'class_feedback',
      'notifications',
      'user_sessions',
      'admin_config',
      'admin_payment_config',
      'footer_links',
      'payment_methods',
      'transaction_fee_config',
      'payment_transactions',
      'unsettled_finances',
      'payment_workflows',
      'analytics_events',
      'system_alerts',
      'ai_insights',
      'business_metrics',
      'compliance_monitoring',
      'chat_analytics',
      'audio_analytics',
      'predictive_models',
      'cloud_deployments',
      'technology_stack',
      'quantum_tasks',
      'help_tickets',
      'help_knowledge_base',
      'help_ticket_messages',
      'forum_categories',
      'forum_posts',
      'forum_replies',
      'forum_likes',
      'project_categories',
      'projects',
      'project_comments',
      'project_likes',
      'event_categories',
      'events',
      'event_registrations',
      'event_comments',
      'teacher_audio_metrics',
      'home_section_controls',
      'azure_storage_config',
      'recording_parts',
      'merged_recordings',
      'admin_ui_config'
    ];

    for (const table of tables) {
      try {
        const exists = await sourcePool.query(
          `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = $1)`,
          [table]
        );

        if (!exists.rows[0].exists) continue;

        const result = await sourcePool.query(`SELECT * FROM ${table}`);
        if (result.rows.length === 0) continue;

        console.log(`📦 ${table}: ${result.rows.length} records`);

        const azureExists = await azurePool.query(
          `SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = $1)`,
          [table]
        );

        if (!azureExists.rows[0].exists) {
          console.log(`  ⚠️  Table missing, skipping\n`);
          continue;
        }

        // Get Azure columns
        const cols = await azurePool.query(
          `SELECT column_name, data_type, udt_name 
           FROM information_schema.columns 
           WHERE table_schema = 'public' AND table_name = $1`,
          [table]
        );

        const colMap = new Map(cols.rows.map(c => [c.column_name, { dataType: c.data_type, udtName: c.udt_name }]));

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

        let synced = 0;
        let errors = 0;

        for (const row of result.rows) {
          try {
            // Filter out columns that don't exist in Azure
            const columns = Object.keys(row).filter(col => colMap.has(col));
            
            if (columns.length === 0) {
              errors++;
              if (errors === 1) console.log(`  ⚠️  No matching columns found between Neon and Azure`);
              continue;
            }

            const values = columns.map(col => {
              let val = row[col];
              
              // Convert JSONB to string
              if (val !== null && typeof val === 'object') {
                const info = colMap.get(col);
                if (info && (info.dataType === 'json' || info.dataType === 'jsonb' || 
                             info.udtName === 'json' || info.udtName === 'jsonb')) {
                  val = JSON.stringify(val);
                }
              }
              
              return val;
            });

            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const updateSet = columns.filter(c => c !== pk).map(c => `${c} = EXCLUDED.${c}`).join(', ');

            const query = updateSet
              ? `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${pk}) DO UPDATE SET ${updateSet}`
              : `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${pk}) DO NOTHING`;

            await azurePool.query(query, values);
            synced++;
          } catch (err: any) {
            errors++;
            if (errors <= 2) console.log(`  ⚠️  ${err.message}`);
          }
        }

        console.log(`  ✅ ${synced}/${result.rows.length}${errors > 0 ? ` (${errors} errors)` : ''}\n`);
      } catch (err: any) {
        console.log(`  ❌ ${err.message}\n`);
      }
    }

    // Final verification
    const sourceCounts = await sourcePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students
    `);

    const azureCounts = await azurePool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM mentors) as mentors,
        (SELECT COUNT(*) FROM students) as students
    `);

    console.log("📊 Final counts:");
    console.log("  Source: ", sourceCounts.rows[0]);
    console.log("  Azure:", azureCounts.rows[0]);

    const source = sourceCounts.rows[0];
    const azure = azureCounts.rows[0];
    let allMatch = true;
    
    console.log("\n🔍 Verification:");
    for (const key in source) {
      const match = source[key] === azure[key];
      console.log(`${match ? '✅' : '⚠️ '} ${key}: Source=${source[key]}, Azure=${azure[key]}`);
      if (!match) allMatch = false;
    }

    console.log(allMatch ? "\n🎉 Perfect sync!" : "\n⚠️  Some differences remain");
    console.log("\n✅ Sync complete");

  } catch (error) {
    console.error("❌ Sync failed:", error);
    throw error;
  } finally {
    await sourcePool.end();
    await azurePool.end();
  }
}

syncNeonToAzure().catch(console.error);
