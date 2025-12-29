/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user input and prevent XSS/injection attacks.
 */

/**
 * Sanitize HTML content - removes potentially dangerous HTML
 */
export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript\s*:/gi, '');
    
    // Remove data: URLs (potential XSS vector)
    sanitized = sanitized.replace(/data\s*:[^,]*base64/gi, 'data:removed');
    
    // Remove style tags
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove potentially dangerous tags
    const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta'];
    dangerousTags.forEach(tag => {
        const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
        sanitized = sanitized.replace(regex, '');
        // Self-closing tags
        sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*/?>`, 'gi'), '');
    });
    
    return sanitized.trim();
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const htmlEscapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    
    return input.replace(/[&<>"'`=\/]/g, char => htmlEscapes[char]);
}

/**
 * Sanitize input for database storage - prevents NoSQL injection
 */
export function sanitizeForDb<T>(input: T): T {
    if (input === null || input === undefined) {
        return input;
    }
    
    if (typeof input === 'string') {
        // Remove MongoDB operators
        let sanitized: string = input;
        
        // Remove $ at the start of keys (MongoDB operator prefix)
        if (sanitized.startsWith('$')) {
            sanitized = sanitized.slice(1);
        }
        
        // Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');
        
        return sanitized as unknown as T;
    }
    
    if (Array.isArray(input)) {
        return input.map(item => sanitizeForDb(item)) as unknown as T;
    }
    
    if (typeof input === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
            // Skip keys starting with $ (MongoDB operators)
            if (key.startsWith('$')) {
                continue;
            }
            // Skip keys containing dots (MongoDB nested field injection)
            if (key.includes('.')) {
                continue;
            }
            sanitized[key] = sanitizeForDb(value);
        }
        return sanitized as unknown as T;
    }
    
    return input;
}

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
export function escapeRegex(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize search query for safe use in regex
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 100): string {
    if (!query || typeof query !== 'string') return '';
    
    // Trim and limit length
    let sanitized = query.trim().slice(0, maxLength);
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Escape regex special characters
    sanitized = escapeRegex(sanitized);
    
    return sanitized;
}

/**
 * Validate and sanitize email format
 */
export function sanitizeEmail(email: string): string | null {
    if (!email || typeof email !== 'string') return null;
    
    const trimmed = email.trim().toLowerCase();
    
    // Basic email validation regex
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    
    if (!emailRegex.test(trimmed)) {
        return null;
    }
    
    // Additional checks
    if (trimmed.length > 254) return null; // Max email length
    if (trimmed.includes('..')) return null; // No consecutive dots
    
    return trimmed;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string | null {
    if (!phone || typeof phone !== 'string') return null;
    
    // Remove all non-digit characters except + at start
    let sanitized = phone.replace(/[^\d+]/g, '');
    
    // Keep + only at the start
    if (sanitized.includes('+')) {
        const hasPlus = sanitized.startsWith('+');
        sanitized = sanitized.replace(/\+/g, '');
        if (hasPlus) sanitized = '+' + sanitized;
    }
    
    // Validate length (international numbers can be 7-15 digits)
    const digitsOnly = sanitized.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return null;
    }
    
    return sanitized;
}

/**
 * Sanitize and validate URL
 */
export function sanitizeUrl(url: string): string | null {
    if (!url || typeof url !== 'string') return null;
    
    const trimmed = url.trim();
    
    // Only allow http and https protocols
    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }
        return parsed.toString();
    } catch {
        return null;
    }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return 'unnamed';
    
    // Remove path components
    let sanitized = filename.split(/[\/\\]/).pop() || 'unnamed';
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');
    
    // Replace spaces with underscores
    sanitized = sanitized.replace(/\s+/g, '_');
    
    // Limit length
    if (sanitized.length > 255) {
        const ext = sanitized.split('.').pop() || '';
        const name = sanitized.slice(0, 255 - ext.length - 1);
        sanitized = `${name}.${ext}`;
    }
    
    return sanitized || 'unnamed';
}

/**
 * Validate and constrain pagination parameters
 */
export function sanitizePagination(
    page: string | number | null | undefined,
    limit: string | number | null | undefined,
    maxLimit: number = 100
): { page: number; limit: number; skip: number } {
    let pageNum = 1;
    let limitNum = 20;
    
    if (page !== null && page !== undefined) {
        pageNum = Math.max(1, Math.floor(Number(page) || 1));
    }
    
    if (limit !== null && limit !== undefined) {
        limitNum = Math.min(maxLimit, Math.max(1, Math.floor(Number(limit) || 20)));
    }
    
    return {
        page: pageNum,
        limit: limitNum,
        skip: (pageNum - 1) * limitNum
    };
}

/**
 * Create a safe MongoDB query from user input
 */
export function createSafeSearchQuery(
    searchTerm: string,
    fields: string[]
): Record<string, unknown> | null {
    const sanitized = sanitizeSearchQuery(searchTerm);
    
    if (!sanitized) return null;
    
    return {
        $or: fields.map(field => ({
            [field]: { $regex: sanitized, $options: 'i' }
        }))
    };
}

export default {
    sanitizeHtml,
    escapeHtml,
    sanitizeForDb,
    escapeRegex,
    sanitizeSearchQuery,
    sanitizeEmail,
    sanitizePhone,
    sanitizeUrl,
    sanitizeFilename,
    sanitizePagination,
    createSafeSearchQuery
};
