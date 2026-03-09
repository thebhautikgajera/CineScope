import rateLimit from 'express-rate-limit';
import { getRedisClient, isRedisReady } from '../utils/redis.js';
import { hashEmail, extractEmailFromRequest } from '../utils/emailHash.js';
import { logRequest } from '../utils/logger.js';

/**
 * Advanced Rate Limiter with Redis, Exponential Backoff, and Monitoring
 * Implements production-grade rate limiting with:
 * - Redis store for multi-instance support
 * - Hashed email keys for privacy
 * - Dual-layer protection (per-IP + per-email)
 * - Exponential backoff
 * - Separate resend frequency limits
 * - Logging and alerting
 * - Prometheus metrics (optional)
 */

// Prometheus metrics (optional - requires prom-client)
let rateLimitMetrics = null;

/**
 * Initialize Prometheus metrics (lazy loading)
 */
const initMetrics = async () => {
  if (rateLimitMetrics !== null) return rateLimitMetrics;
  
  try {
    // Dynamic import to avoid breaking if prom-client not installed
    const promClient = await import('prom-client').catch(() => null);
    if (promClient && promClient.Counter) {
      rateLimitMetrics = {
        blockedRequests: new promClient.Counter({
          name: 'rate_limit_blocked_requests_total',
          help: 'Total number of requests blocked by rate limiting',
          labelNames: ['endpoint', 'type', 'reason'],
        }),
        allowedRequests: new promClient.Counter({
          name: 'rate_limit_allowed_requests_total',
          help: 'Total number of requests allowed by rate limiting',
          labelNames: ['endpoint', 'type'],
        }),
      };
    } else {
      rateLimitMetrics = false; // Mark as unavailable
    }
  } catch (e) {
    rateLimitMetrics = false; // Mark as unavailable
  }
  
  return rateLimitMetrics;
};

/**
 * Get Redis store for express-rate-limit
 * Falls back to in-memory if Redis unavailable
 */
const getStore = (prefix = 'rate-limit:', windowMs = 10 * 60 * 1000) => {
  if (!isRedisReady()) {
    return undefined; // Use default in-memory store
  }

  const client = getRedisClient();
  if (!client) {
    return undefined;
  }

  // Custom Redis store adapter
  return {
    async increment(key) {
      const fullKey = `${prefix}${key}`;
      // Calculate window seconds from windowMs
      const windowSeconds = Math.ceil(windowMs / 1000);

      try {
        const multi = client.multi();
        multi.incr(fullKey);
        multi.expire(fullKey, windowSeconds);
        const results = await multi.exec();

        if (!results || results.length === 0) {
          throw new Error('Redis increment failed');
        }

        const totalHits = results[0][1] || 1;
        const resetTime = new Date(Date.now() + windowSeconds * 1000);

        return {
          totalHits,
          resetTime,
        };
      } catch (error) {
        console.error('[RATE_LIMIT] Redis increment error:', error.message);
        throw error;
      }
    },
    async decrement(key) {
      const fullKey = `${prefix}${key}`;
      try {
        await client.decr(fullKey);
      } catch (error) {
        console.error('[RATE_LIMIT] Redis decrement error:', error.message);
      }
    },
    async resetKey(key) {
      const fullKey = `${prefix}${key}`;
      try {
        await client.del(fullKey);
      } catch (error) {
        console.error('[RATE_LIMIT] Redis reset error:', error.message);
      }
    },
    shutdown() {
      // Redis client managed globally
    },
  };
};

/**
 * Calculate exponential backoff cooldown time
 * @param {number} attempts - Number of failed attempts
 * @returns {number} Cooldown time in milliseconds
 */
const calculateBackoff = (attempts) => {
  if (attempts <= 1) return 0;
  if (attempts === 2) return 30 * 1000; // 30 seconds
  if (attempts === 3) return 2 * 60 * 1000; // 2 minutes
  return 10 * 60 * 1000; // 10 minutes for 4+ attempts
};

/**
 * Check exponential backoff for a key
 * @param {string} key - Rate limit key
 * @returns {Promise<{blocked: boolean, waitTime?: number, attempts?: number}>}
 */
const checkBackoff = async (key) => {
  if (!isRedisReady()) return { blocked: false };

  const client = getRedisClient();
  if (!client) return { blocked: false };

  try {
    const backoffKey = `backoff:${key}`;
    const attemptsStr = await client.get(backoffKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

    if (attempts === 0) return { blocked: false, attempts: 0 };

    const waitTime = calculateBackoff(attempts);
    const lastAttemptKey = `backoff:last:${key}`;
    const lastAttemptStr = await client.get(lastAttemptKey);
    const lastAttempt = lastAttemptStr ? parseInt(lastAttemptStr, 10) : 0;
    const timeSinceLastAttempt = Date.now() - lastAttempt;

    if (timeSinceLastAttempt < waitTime) {
      return {
        blocked: true,
        waitTime: waitTime - timeSinceLastAttempt,
        attempts,
      };
    }

    // Backoff period expired, reset
    await client.del(backoffKey);
    await client.del(lastAttemptKey);
    return { blocked: false, attempts: 0 };
  } catch (error) {
    console.error('[RATE_LIMIT] Backoff check error:', error.message);
    return { blocked: false };
  }
};

/**
 * Increment backoff counter
 * @param {string} key - Rate limit key
 */
const incrementBackoff = async (key) => {
  if (!isRedisReady()) return;

  const client = getRedisClient();
  if (!client) return;

  try {
    const backoffKey = `backoff:${key}`;
    const lastAttemptKey = `backoff:last:${key}`;
    const windowSeconds = 60 * 60; // 1 hour

    const multi = client.multi();
    multi.incr(backoffKey);
    multi.expire(backoffKey, windowSeconds);
    multi.setex(lastAttemptKey, windowSeconds, Date.now().toString());
    await multi.exec();
  } catch (error) {
    console.error('[RATE_LIMIT] Backoff increment error:', error.message);
  }
};

/**
 * Check and enforce resend frequency limits
 * @param {string} emailHash - Hashed email address
 * @returns {Promise<{allowed: boolean, waitTime?: number, reason?: string}>}
 */
const checkResendLimit = async (emailHash) => {
  if (!isRedisReady()) {
    return { allowed: true };
  }

  const client = getRedisClient();
  if (!client) {
    return { allowed: true };
  }

  try {
    const resendKey = `otp:resend:${emailHash}`;
    const resendDataStr = await client.get(resendKey);

    if (!resendDataStr) {
      // First send allowed
      await client.setex(
        resendKey,
        15 * 60, // 15 minutes
        JSON.stringify({ count: 1, lastSent: Date.now() })
      );
      return { allowed: true };
    }

    const resendData = JSON.parse(resendDataStr);
    const { count, lastSent } = resendData;
    const currentTime = Date.now();
    const timeSinceLastSent = currentTime - lastSent;

    // Check minimum wait time (30 seconds)
    if (timeSinceLastSent < 30 * 1000) {
      return {
        allowed: false,
        waitTime: 30 * 1000 - timeSinceLastSent,
        reason: 'Please wait 30 seconds before requesting another OTP.',
      };
    }

    // Check max resends (3 in 15 minutes)
    if (count >= 3) {
      const windowEnd = lastSent + 15 * 60 * 1000;
      if (currentTime < windowEnd) {
        return {
          allowed: false,
          waitTime: windowEnd - currentTime,
          reason: 'Maximum OTP resends reached. Please try again later.',
        };
      }
      // Window expired, reset count
      await client.setex(
        resendKey,
        15 * 60,
        JSON.stringify({ count: 1, lastSent: currentTime })
      );
      return { allowed: true };
    }

    // Increment count
    await client.setex(
      resendKey,
      15 * 60,
      JSON.stringify({ count: count + 1, lastSent: currentTime })
    );
    return { allowed: true };
  } catch (error) {
    console.error('[RATE_LIMIT] Resend limit check error:', error.message);
    return { allowed: true }; // Fail open
  }
};

/**
 * Log and alert on blocked attempts
 * @param {Object} req - Express request object
 * @param {string} type - Rate limit type (ip, email, backoff, resend)
 * @param {string} identifier - IP or email hash
 */
const logAndAlert = async (req, type, identifier) => {
  const alertThreshold = parseInt(process.env.RATE_LIMIT_ALERT_THRESHOLD, 10);
  const client = getRedisClient();

  if (!client || !isRedisReady()) {
    // Basic logging if Redis unavailable
    logRequest(req, 'warn', 'Rate limit exceeded', { type, identifier });
    return;
  }

  try {
    const alertKey = `alert:${type}:${identifier}`;
    const count = await client.incr(alertKey);
    
    if (count === 1) {
      await client.expire(alertKey, 60 * 60); // 1 hour window
    }

    // Log blocked attempt
    logRequest(req, 'warn', 'Rate limit exceeded', {
      type,
      identifier: type === 'email' ? '[HASHED]' : identifier,
      attemptCount: count,
    });

    // Alert if threshold exceeded
    if (count >= alertThreshold) {
      logRequest(req, 'error', 'Rate limit alert threshold exceeded', {
        type,
        identifier: type === 'email' ? '[HASHED]' : identifier,
        count,
        threshold: alertThreshold,
      });

      // TODO: Send alert to ops team (email, Slack, etc.)
      // Example: await sendAlertToOps({ type, identifier, count });
    }

    // Update Prometheus metrics
    const metrics = await initMetrics();
    if (metrics) {
      metrics.blockedRequests.inc({
        endpoint: req.path,
        type,
        reason: 'rate_limit_exceeded',
      });
    }
  } catch (error) {
    console.error('[RATE_LIMIT] Log and alert error:', error.message);
  }
};

/**
 * Create dual-layer rate limiter (per-IP + per-email)
 * @param {Object} options - Rate limiter options
 * @returns {Array} Array of middleware functions [ipLimiter, emailLimiter]
 */
export const createDualLayerLimiter = (options = {}) => {
  const {
    windowMinutes = parseInt(process.env.OTP_RATE_WINDOW_MINUTES, 10),
    maxRequests = parseInt(process.env.OTP_RATE_MAX_REQUESTS, 10),
    enableBackoff = true,
    enableResendLimit = false,
    endpoint = 'unknown',
  } = options;

  const windowMs = windowMinutes * 60 * 1000;
  const store = getStore('rate-limit:', windowMs);

  // Per-IP limiter
  const ipLimiter = rateLimit({
    store,
    windowMs,
    max: maxRequests * 2, // Allow more per IP since we also check per-email
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    keyGenerator: (req) => `ip:${req.ip}`,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: async (req, res) => {
      await logAndAlert(req, 'ip', req.ip);
      
      const metrics = await initMetrics();
      if (metrics) {
        metrics.blockedRequests.inc({
          endpoint,
          type: 'ip',
          reason: 'ip_limit_exceeded',
        });
      }

      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
      });
    },
  });

  // Per-email limiter with hashing
  const emailLimiter = async (req, res, next) => {
    try {
      const email = extractEmailFromRequest(req);
      
      if (!email) {
        // No email in request, skip email-based limiting
        return next();
      }

      const emailHash = hashEmail(email);
      if (!emailHash) {
        return next();
      }

      // Check exponential backoff
      if (enableBackoff) {
        const backoffCheck = await checkBackoff(`email:${emailHash}`);
        if (backoffCheck.blocked) {
          await logAndAlert(req, 'backoff', emailHash);
          
          const metrics = await initMetrics();
          if (metrics) {
            metrics.blockedRequests.inc({
              endpoint,
              type: 'email',
              reason: 'backoff_active',
            });
          }

          const waitSeconds = Math.ceil(backoffCheck.waitTime / 1000);
          return res.status(429).json({
            success: false,
            message: `Too many attempts. Please wait ${waitSeconds} seconds before trying again.`,
            retryAfter: waitSeconds,
          });
        }
      }

      // Check resend frequency limit (for resend endpoints)
      if (enableResendLimit) {
        const resendCheck = await checkResendLimit(emailHash);
        if (!resendCheck.allowed) {
          await logAndAlert(req, 'resend', emailHash);
          
          const metrics = await initMetrics();
          if (metrics) {
            metrics.blockedRequests.inc({
              endpoint,
              type: 'email',
              reason: 'resend_limit_exceeded',
            });
          }

          const waitSeconds = Math.ceil(resendCheck.waitTime / 1000);
          return res.status(429).json({
            success: false,
            message: resendCheck.reason || 'Too many OTP resend requests.',
            retryAfter: waitSeconds,
          });
        }
      }

      // Use express-rate-limit for email-based limiting
      const emailStore = getStore('rate-limit:email:', windowMs);
      const emailRateLimiter = rateLimit({
        store: emailStore,
        windowMs,
        max: maxRequests,
        message: {
          success: false,
          message: 'Too many OTP attempts for this email, please try again later.',
        },
        keyGenerator: () => emailHash,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        handler: async (req, res) => {
          // Increment backoff on rate limit hit
          if (enableBackoff) {
            await incrementBackoff(`email:${emailHash}`);
          }

          await logAndAlert(req, 'email', emailHash);
          
          const metrics = await initMetrics();
          if (metrics) {
            metrics.blockedRequests.inc({
              endpoint,
              type: 'email',
              reason: 'email_limit_exceeded',
            });
          }

          res.status(429).json({
            success: false,
            message: 'Too many OTP attempts for this email, please try again later.',
          });
        },
      });

      // Apply email rate limiter
      return emailRateLimiter(req, res, next);
    } catch (error) {
      console.error('[RATE_LIMIT] Email limiter error:', error.message);
      // Fail open on error
      return next();
    }
  };

  // Return both limiters as middleware array
  return [ipLimiter, emailLimiter];
};

/**
 * Create OTP rate limiter with all advanced features
 * @param {Object} options - Configuration options
 * @returns {Array} Middleware array [ipLimiter, emailLimiter]
 */
export const createAdvancedOtpLimiter = (options = {}) => {
  return createDualLayerLimiter({
    ...options,
    enableBackoff: true,
    enableResendLimit: options.enableResendLimit !== false,
  });
};

/**
 * Create OTP resend limiter (with resend frequency limits)
 * @param {Object} options - Configuration options
 * @returns {Array} Middleware array [ipLimiter, emailLimiter]
 */
export const createOtpResendLimiter = (options = {}) => {
  return createDualLayerLimiter({
    ...options,
    enableBackoff: true,
    enableResendLimit: true, // Always enable for resend endpoints
  });
};

/**
 * Get Prometheus metrics registry (if available)
 * @returns {Promise<Object|null>} Prometheus metrics or null
 */
export const getRateLimitMetrics = async () => {
  return await initMetrics();
};

