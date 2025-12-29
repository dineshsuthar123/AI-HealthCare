/**
 * Rate Limiter Middleware
 * 
 * Provides in-memory rate limiting for API endpoints.
 * For production, consider using Upstash Redis for distributed rate limiting.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimiterConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
    identifier?: (request: Request) => string;  // Custom identifier function
}

class RateLimiter {
    private store: Map<string, RateLimitEntry> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Clean up expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key);
            }
        }
        // Prevent memory bloat - cap at 10,000 entries
        if (this.store.size > 10000) {
            const sortedEntries = Array.from(this.store.entries())
                .sort((a, b) => a[1].resetTime - b[1].resetTime);
            const toDelete = sortedEntries.slice(0, 5000);
            toDelete.forEach(([key]) => this.store.delete(key));
        }
    }

    check(key: string, config: RateLimiterConfig): { success: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now > entry.resetTime) {
            // First request or window expired - reset
            const newEntry: RateLimitEntry = {
                count: 1,
                resetTime: now + config.windowMs
            };
            this.store.set(key, newEntry);
            return {
                success: true,
                remaining: config.maxRequests - 1,
                resetTime: newEntry.resetTime
            };
        }

        if (entry.count >= config.maxRequests) {
            // Rate limit exceeded
            return {
                success: false,
                remaining: 0,
                resetTime: entry.resetTime
            };
        }

        // Increment counter
        entry.count++;
        return {
            success: true,
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime
        };
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.store.clear();
    }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
    // Standard API - 100 requests per minute
    standard: { windowMs: 60 * 1000, maxRequests: 100 },
    
    // Auth endpoints - 10 requests per minute (prevent brute force)
    auth: { windowMs: 60 * 1000, maxRequests: 10 },
    
    // AI/Expensive operations - 20 requests per minute
    ai: { windowMs: 60 * 1000, maxRequests: 20 },
    
    // File uploads - 30 per minute
    upload: { windowMs: 60 * 1000, maxRequests: 30 },
    
    // Admin operations - 200 per minute
    admin: { windowMs: 60 * 1000, maxRequests: 200 },
    
    // Strict - 5 requests per minute (for sensitive operations)
    strict: { windowMs: 60 * 1000, maxRequests: 5 },
} as const;

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from headers (for proxies like Vercel, Cloudflare)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    const ip = cfConnectingIp || realIp || forwarded?.split(',')[0]?.trim() || 'unknown';
    
    // Include user agent for additional fingerprinting
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return `${ip}:${hashString(userAgent)}`;
}

/**
 * Simple string hash for fingerprinting
 */
function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Rate limit check helper for API routes
 * 
 * @param request - The incoming request
 * @param endpoint - Endpoint identifier for rate limiting
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export function checkRateLimit(
    request: Request,
    endpoint: string,
    config: RateLimiterConfig = RATE_LIMITS.standard
): { limited: boolean; response?: Response; headers: Record<string, string> } {
    const clientId = getClientIdentifier(request);
    const key = `${endpoint}:${clientId}`;
    
    const result = rateLimiter.check(key, config);
    
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    };
    
    if (!result.success) {
        return {
            limited: true,
            response: new Response(
                JSON.stringify({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
                        ...headers
                    }
                }
            ),
            headers
        };
    }
    
    return { limited: false, headers };
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<Response>>(
    handler: T,
    endpoint: string,
    config: RateLimiterConfig = RATE_LIMITS.standard
): T {
    return (async (request: Request, ...args: unknown[]) => {
        const { limited, response, headers } = checkRateLimit(request, endpoint, config);
        
        if (limited && response) {
            return response;
        }
        
        const result = await handler(request, ...args);
        
        // Add rate limit headers to successful responses
        Object.entries(headers).forEach(([key, value]) => {
            result.headers.set(key, value);
        });
        
        return result;
    }) as T;
}

export default rateLimiter;
