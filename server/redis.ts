import Redis from 'ioredis';

// Redis configuration with fallback to in-memory caching
const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
const USE_REDIS = !!REDIS_URL && process.env.NODE_ENV === 'production';

let redisClient: Redis | null = null;

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expiry: number }>();

// Clean up expired entries periodically (in-memory only)
let memoryExpiryInterval: NodeJS.Timeout | null = null;

function startMemoryExpirySweeper() {
  // Only start if not already running
  if (memoryExpiryInterval) {
    return;
  }

  memoryExpiryInterval = setInterval(() => {
    const now = Date.now();
    const entries = Array.from(memoryCache.entries());
    let cleaned = 0;
    
    for (const [key, cached] of entries) {
      if (cached.expiry <= now) {
        memoryCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries (in-memory)`);
    }
  }, 60000); // Clean every minute
}

// Validate Redis URL protocol
function validateRedisUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // ioredis supports redis://, rediss:// (SSL), and redis+unix://
    const validProtocols = ['redis:', 'rediss:'];
    if (!validProtocols.includes(parsedUrl.protocol)) {
      console.error(`❌ Invalid Redis URL protocol: ${parsedUrl.protocol}. Expected redis:// or rediss://`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Invalid Redis URL format:', error);
    return false;
  }
}

export async function initializeRedis() {
  if (USE_REDIS && REDIS_URL) {
    // Validate URL before attempting connection
    if (!validateRedisUrl(REDIS_URL)) {
      console.error('⚠️  Invalid Redis URL, falling back to in-memory cache');
      redisClient = null;
      startMemoryExpirySweeper();
      return null;
    }

    try {
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
      });

      await redisClient.connect();
      console.log('✅ Redis connected successfully');
      
      redisClient.on('error', (err) => {
        console.error('❌ Redis error:', err);
      });
      
      return redisClient;
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      console.warn('⚠️  Falling back to in-memory cache');
      redisClient = null;
      startMemoryExpirySweeper();
    }
  } else {
    console.log('📝 Using in-memory cache (development mode)');
    startMemoryExpirySweeper();
  }
  
  return null;
}

// Unified cache interface that works with or without Redis
export const cache = {
  async get(key: string): Promise<any> {
    if (redisClient) {
      try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Redis get error:', error);
        return null;
      }
    }
    
    // In-memory fallback
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    
    // Clean up expired entry
    if (cached) {
      memoryCache.delete(key);
    }
    
    return null;
  },

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }
    
    // In-memory fallback
    memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  },

  async del(key: string): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch (error) {
        console.error('Redis del error:', error);
      }
    }
    
    // In-memory fallback
    memoryCache.delete(key);
  },

  async flush(): Promise<void> {
    if (redisClient) {
      try {
        await redisClient.flushdb();
        return;
      } catch (error) {
        console.error('Redis flush error:', error);
      }
    }
    
    // In-memory fallback
    memoryCache.clear();
  }
};

export function getRedisClient(): Redis | null {
  return redisClient;
}
