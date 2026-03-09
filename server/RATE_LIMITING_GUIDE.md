# Advanced Rate Limiting Implementation Guide

This document describes the production-grade rate limiting system implemented for the CineScope - Discover movies beyond the screen authentication and OTP endpoints.

## Features Implemented

### ✅ 1. Redis Store (Production, Multi-Instance)
- **Location**: `server/src/middleware/rateLimiter.js` & `server/src/middleware/advancedRateLimiter.js`
- **Benefits**: 
  - Atomic counters across multiple server instances
  - Persistent rate limit state
  - Works seamlessly with your existing Redis setup
- **Fallback**: Automatically falls back to in-memory store if Redis unavailable

### ✅ 2. Hashed Email Keys (Privacy)
- **Location**: `server/src/utils/emailHash.js`
- **Implementation**: SHA-256 hashing with configurable salt
- **Configuration**: Set `RATE_SALT` in `.env` (change in production!)
- **Benefits**: 
  - Email addresses are never stored in plaintext in Redis
  - Privacy-preserving rate limiting
  - Prevents email enumeration attacks

### ✅ 3. Dual-Layer Rate Limiting (Per-IP + Per-Email)
- **Location**: `server/src/middleware/advancedRateLimiter.js`
- **Implementation**: 
  - **Layer 1**: Per-IP limiting (prevents mass targeting from single IP)
  - **Layer 2**: Per-email limiting (prevents repeated attempts for single email)
- **Benefits**: 
  - Stops attackers using multiple IPs to spam different emails
  - Stops attackers repeatedly trying the same email
  - Comprehensive protection

### ✅ 4. Exponential Backoff / Cooldown
- **Location**: `server/src/middleware/advancedRateLimiter.js`
- **Implementation**:
  - 1st attempt: No cooldown
  - 2nd attempt: 30 seconds cooldown
  - 3rd attempt: 2 minutes cooldown
  - 4+ attempts: 10 minutes cooldown
- **Benefits**: 
  - Progressive penalties discourage brute-force attacks
  - Automatic reset after cooldown period expires

### ✅ 5. Separate Resend Frequency Limits
- **Location**: `server/src/middleware/advancedRateLimiter.js`
- **Rules**:
  - First OTP send: Allowed immediately
  - Resend minimum wait: 30 seconds between resends
  - Maximum resends: 3 resends per 15-minute window
- **Applied to**: `/resend-otp` endpoint
- **Benefits**: Prevents OTP system abuse while allowing legitimate resends

### ✅ 6. Logging & Alerting
- **Location**: `server/src/middleware/advancedRateLimiter.js`
- **Features**:
  - Structured logging via `server/src/utils/logger.js`
  - Alert threshold: Configurable via `RATE_LIMIT_ALERT_THRESHOLD` (default: 10)
  - Logs include: endpoint, type (ip/email/backoff/resend), attempt count
- **Alert Trigger**: When blocked attempts exceed threshold, logs error-level alert
- **TODO**: Integrate with ops team notification (email/Slack/webhook)

### ✅ 7. Prometheus Metrics (Optional)
- **Location**: `server/src/middleware/advancedRateLimiter.js` & `server/src/server.js`
- **Metrics Endpoint**: `GET /metrics`
- **Metrics Exported**:
  - `rate_limit_blocked_requests_total` - Counter of blocked requests
  - `rate_limit_allowed_requests_total` - Counter of allowed requests
- **Labels**: `endpoint`, `type` (ip/email), `reason` (rate_limit_exceeded/backoff_active/etc.)
- **Requires**: `prom-client` package (already added to `package.json`)

## Configuration

### Environment Variables

Add these to your `server/.env`:

```env
# Rate Limiting Configuration
API_RATE_WINDOW_MINUTES=15
API_RATE_MAX_REQUESTS=100

AUTH_RATE_WINDOW_MINUTES=15
AUTH_RATE_MAX_REQUESTS=5

OTP_RATE_WINDOW_MINUTES=10
OTP_RATE_MAX_REQUESTS=5

# Advanced Features
RATE_SALT=your-strong-random-salt-change-in-production-min-32-chars
RATE_LIMIT_ALERT_THRESHOLD=10
RATE_WINDOW_SECONDS=600
```

### Production Recommendations

1. **Change `RATE_SALT`**: Use a strong random string (min 32 characters)
2. **Adjust Limits**: Tune limits based on your traffic patterns
3. **Monitor Metrics**: Set up Prometheus/Grafana dashboards
4. **Configure Alerts**: Integrate alerting with your ops team
5. **Redis**: Ensure Redis is highly available in production

## Usage

### Protected Endpoints

The following endpoints are protected with advanced rate limiting:

- `POST /api/user/forgot-password` - Dual-layer + backoff
- `POST /api/user/reset-password` - Dual-layer + backoff
- `POST /api/user/resend-otp` - Dual-layer + backoff + resend limits
- `POST /api/user/verify-otp` - Dual-layer + backoff
- `POST /api/user/change-verification-email` - Dual-layer + backoff
- `POST /api/auth/register` - Auth limiter (existing)
- `POST /api/auth/login` - Auth limiter (existing)

### Rate Limit Response Format

When rate limit is exceeded:

```json
{
  "success": false,
  "message": "Too many OTP attempts for this email, please try again later.",
  "retryAfter": 300  // Optional: seconds to wait (for backoff/resend limits)
}
```

HTTP Status: `429 Too Many Requests`

## Monitoring

### Prometheus Metrics

Access metrics at: `GET /metrics`

Example query:
```promql
rate(rate_limit_blocked_requests_total[5m])
```

### Logs

Rate limit events are logged with:
- Level: `warn` for blocked attempts
- Level: `error` for alert threshold exceeded
- Structured JSON format for easy parsing

### Redis Keys

Rate limit keys stored in Redis:
- `rate-limit:ip:{ip}` - IP-based limits
- `rate-limit:email:{emailHash}` - Email-based limits
- `backoff:email:{emailHash}` - Backoff counters
- `backoff:last:email:{emailHash}` - Last attempt timestamp
- `otp:resend:{emailHash}` - Resend frequency tracking
- `alert:{type}:{identifier}` - Alert counters

## Testing

### Test Rate Limits

```bash
# Test OTP endpoint (should block after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/user/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
done
```

### Verify Redis Storage

```bash
# Connect to Redis and check keys
redis-cli
> KEYS rate-limit:*
> GET rate-limit:email:{hash}
```

## Troubleshooting

### Redis Not Available
- System automatically falls back to in-memory store
- Rate limits will be per-instance (not shared across instances)
- Check Redis connection in logs

### Prometheus Metrics Not Showing
- Ensure `prom-client` is installed: `npm install`
- Check `/metrics` endpoint returns data
- Verify Prometheus can scrape the endpoint

### Rate Limits Too Strict/Loose
- Adjust `OTP_RATE_WINDOW_MINUTES` and `OTP_RATE_MAX_REQUESTS`
- Monitor blocked requests in logs/metrics
- Tune based on legitimate user patterns

## Security Considerations

1. **Salt Security**: Never commit `RATE_SALT` to version control
2. **Redis Security**: Use Redis AUTH and TLS in production
3. **IP Spoofing**: Consider using `X-Forwarded-For` headers behind proxy
4. **Email Enumeration**: Rate limits don't reveal if email exists (consistent responses)
5. **DDoS Protection**: Rate limiting helps but consider additional DDoS protection

## Future Enhancements

- [ ] Integrate alerting with Slack/email/webhook
- [ ] Add rate limit bypass for trusted IPs
- [ ] Implement CAPTCHA after N failed attempts
- [ ] Add rate limit analytics dashboard
- [ ] Support for per-tenant rate limits

