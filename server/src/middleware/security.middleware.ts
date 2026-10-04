// ============================================
// NIVA — Enterprise Security & Anti-Hacking Guardrails
// Injection Sanitization, Brute-Force Throttling & Security Headers
// ============================================

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * Recursive payload sanitizer against XSS, SQLi & Path Traversal
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // 1. Remove dangerous script tags and JS event handlers
    let sanitized = value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:[^\s]*/gi, '')
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');

    // 2. Prevent path traversal attacks
    sanitized = sanitized.replace(/\.\.[\/\\]+/g, '');

    // 3. Neutralize classic SQL injection triggers
    sanitized = sanitized.replace(/(\bOR\b|\bAND\b)\s+['"]?1['"]?\s*=\s*['"]?1['"]?/gi, '');

    return sanitized;
  } else if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  } else if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
}

/**
 * Express Middleware: Deep Request Sanitization
 */
export function deepSanitizer(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }
  } catch (err: any) {
    logger.warn('Sanitizer warning:', err.message);
  }
  next();
}

/**
 * Strict Brute-Force Rate Limiter for Login & PIN endpoints
 * Blocks automated credential stuffing & password brute-forcing
 */
export const authBruteForceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Max 10 attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Account temporarily locked for 15 minutes to prevent brute-force attacks.',
      statusCode: 429,
    },
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Security Alert: Brute force throttle triggered for IP ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Enterprise Hardening Headers Middleware
 */
export function enterpriseSecurityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking via iframes
  res.setHeader('X-Frame-Options', 'DENY');
  // XSS protection filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer leakage prevention
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS Strict Transport Security (Active in production)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Disable dangerous permissions
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(self), camera=(self)');
  next();
}
