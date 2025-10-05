import { Pool } from 'pg';

async function dropAzureSchema() {
  const azureUrl = process.env.DATABASE_URL;

  if (!azureUrl) {
    throw new Error("DATABASE_URL is required");
  }

  console.log("🗑️  Dropping all tables in Azure database...\n");

  const pool = new Pool({ 
    connectionString: azureUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query('SELECT 1');
    console.log("✅ Connected to Azure database\n");

    // Drop all tables in public schema
    console.log("🔍 Finding all tables...");
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`📊 Found ${result.rows.length} tables\n`);

    if (result.rows.length === 0) {
      console.log("✅ Database already empty\n");
      return;
    }

    // Drop all tables with CASCADE
    console.log("🗑️  Dropping all tables...");
    for (const { tablename } of result.rows) {
      console.log(`  - Dropping ${tablename}...`);
      await pool.query(`DROP TABLE IF EXISTS ${tablename} CASCADE`);
    }

    console.log("\n✅ All tables dropped successfully");
    console.log("💡 Next: Run 'npm run db:push --force' to recreate schema from shared/schema.ts\n");

  } catch (error) {
    console.error("❌ Failed to drop schema:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

dropAzureSchema().catch(console.error);
