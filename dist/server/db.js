import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
let pool;
let db;
try {
    console.log('🔗 [AZURE DEBUG] Initializing PostgreSQL connection pool...');
    console.log('🔗 [AZURE DEBUG] Database configuration:', {
        hasUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        sslMode: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
    });
    if (process.env.NODE_ENV === 'production') {
        console.log('🛡️ [AZURE DEBUG] Using JavaScript-only pg driver for Azure compatibility');
    }
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 200,
        min: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        allowExitOnIdle: true,
        statement_timeout: 30000,
        query_timeout: 30000,
    });
    db = drizzle({ client: pool, schema });
    if (process.env.NODE_ENV === 'production') {
        console.log('🧪 [AZURE DEBUG] Testing database connection...');
        pool.query('SELECT 1', (err, result) => {
            if (err) {
                console.error('❌ [AZURE DEBUG] Database connection test failed:', err);
            }
            else {
                console.log('✅ [AZURE DEBUG] Database connection test successful');
            }
        });
    }
    console.log('✅ [AZURE DEBUG] PostgreSQL connection pool initialized successfully');
}
catch (pgError) {
    console.error('❌ PostgreSQL connection failed:', pgError);
    console.error('⚠️ This is likely due to native pg bindings compilation on Azure');
    throw new Error(`Database connection failed: ${pgError.message}`);
}
export { pool, db };
//# sourceMappingURL=db.js.map