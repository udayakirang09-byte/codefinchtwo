import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Initialize database connection with Azure native module fallbacks
let pool: pg.Pool;
let db: any;

try {
  console.log('🔗 Initializing PostgreSQL connection pool...');
  
  // Force disable native bindings on Azure to avoid compilation issues
  if (process.env.NODE_ENV === 'production') {
    // Note: pg native bindings are handled at runtime, not via defaults
    console.log('🛡️ Using JavaScript-only pg driver for Azure compatibility');
  }
  
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Azure-specific connection settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  db = drizzle({ client: pool, schema });
  console.log('✅ PostgreSQL connection pool initialized successfully');
} catch (pgError: any) {
  console.error('❌ PostgreSQL connection failed:', pgError);
  console.error('⚠️ This is likely due to native pg bindings compilation on Azure');
  throw new Error(`Database connection failed: ${pgError.message}`);
}

export { pool, db };