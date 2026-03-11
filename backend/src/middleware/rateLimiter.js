const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter — applies to all routes.
 * Prevents brute force and DoS attacks.
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/**
 * Strict limiter for the upload endpoint to prevent LLM/email abuse.
 */
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached (10/hour). Please try again later.' },
});

module.exports = { globalRateLimiter, uploadRateLimiter };
