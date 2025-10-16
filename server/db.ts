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
  console.log('🔗 [AZURE DEBUG] Initializing PostgreSQL connection pool...');
  console.log('🔗 [AZURE DEBUG] Database configuration:', {
    hasUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    sslMode: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
  });
  
  // Force disable native bindings on Azure to avoid compilation issues
  if (process.env.NODE_ENV === 'production') {
    console.log('🛡️ [AZURE DEBUG] Using JavaScript-only pg driver for Azure compatibility');
  }
  
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // High-concurrency connection pool settings (optimized for 3000+ concurrent users)
    max: 200, // Architect recommendation: Support up to 200 concurrent connections
    min: 10, // Keep minimum 10 connections alive for fast response
    idleTimeoutMillis: 30000, // 30 seconds - keep connections alive longer
    connectionTimeoutMillis: 2000, // 2 seconds - fail fast on connection issues
    // Azure-specific settings
    allowExitOnIdle: true,
    statement_timeout: 30000, // 30 seconds
    query_timeout: 30000, // 30 seconds
  });
  
  db = drizzle({ client: pool, schema });
  
  // Test connection immediately on Azure
  if (process.env.NODE_ENV === 'production') {
    console.log('🧪 [AZURE DEBUG] Testing database connection...');
    pool.query('SELECT 1', (err, result) => {
      if (err) {
        console.error('❌ [AZURE DEBUG] Database connection test failed:', err);
      } else {
        console.log('✅ [AZURE DEBUG] Database connection test successful');
      }
    });
  }
  
  console.log('✅ [AZURE DEBUG] PostgreSQL connection pool initialized successfully');
} catch (pgError: any) {
  console.error('❌ PostgreSQL connection failed:', pgError);
  console.error('⚠️ This is likely due to native pg bindings compilation on Azure');
  throw new Error(`Database connection failed: ${pgError.message}`);
}

export { pool, db };