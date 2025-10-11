# Production Security Checklist

Essential security configurations for production deployment.

---

## 1. Security Headers

### Cloudflare Configuration

Configure these headers in **Cloudflare Dashboard** → **Transform Rules** → **Modify Response Header**:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
```

### Content Security Policy (CSP)

**Important**: Test thoroughly before deploying to production!

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-src 'self' https://challenges.cloudflare.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

**Notes**:
- `'unsafe-inline'` and `'unsafe-eval'` needed for React/Vite
- Adjust `connect-src` for your Supabase project URL
- `frame-src` allows Turnstile widget
- Test in staging before production!

### Header Verification

Test headers with:
```bash
curl -I https://obcface.com
```

Or use online tools:
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

---

## 2. Cookie Security

### Session Cookies

Set in authentication responses:

```typescript
// Secure session cookie
Set-Cookie: session=xxx; 
  Secure; 
  HttpOnly; 
  SameSite=Lax; 
  Path=/; 
  Max-Age=86400;
```

**Attributes**:
- `Secure`: HTTPS only (required for production)
- `HttpOnly`: Prevents JavaScript access (XSS protection)
- `SameSite=Lax`: CSRF protection, allows navigation
- `Path=/`: Cookie scope
- `Max-Age=86400`: 24 hours (adjust as needed)

### Authentication Tokens

For critical operations (password change, account deletion):

```typescript
Set-Cookie: auth_token=xxx; 
  Secure; 
  HttpOnly; 
  SameSite=Strict; 
  Path=/; 
  Max-Age=3600;
```

**SameSite=Strict**: Stricter CSRF protection, but may break some flows

### Third-Party Cookies (OAuth)

For OAuth flows:

```typescript
Set-Cookie: oauth_state=xxx; 
  Secure; 
  SameSite=None; 
  Path=/auth; 
  Max-Age=600;
```

**SameSite=None**: Required for cross-site requests (OAuth redirects)
**Note**: Must include `Secure` when using `SameSite=None`

### Cookie Best Practices

1. **Never store sensitive data in cookies** (except encrypted session IDs)
2. **Rotate session IDs** after login/privilege elevation
3. **Invalidate sessions** on logout
4. **Use short lifetimes** for sensitive operations
5. **Validate cookie integrity** server-side

---

## 3. Healthcheck Endpoint

### Endpoint

`GET /api/healthcheck` or invoke edge function `healthcheck`

### Response (Healthy)

```json
{
  "ok": true,
  "status": "healthy",
  "version": "1.0.0",
  "buildId": "abc123",
  "timestamp": "2025-01-11T12:00:00.000Z",
  "uptime": 86400,
  "environment": "production",
  "services": {
    "database": "connected",
    "api": "operational"
  }
}
```

### Response (Unhealthy)

```json
{
  "ok": false,
  "status": "unhealthy",
  "error": "Database connection failed",
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### Monitoring Setup

**Cloudflare Health Checks**:
1. Go to **Traffic** → **Health Checks**
2. Add new health check:
   - URL: `https://obcface.com/healthcheck`
   - Interval: 60 seconds
   - Method: GET
   - Expected status: 200

**UptimeRobot** (Alternative):
1. Create account at [uptimerobot.com](https://uptimerobot.com/)
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://obcface.com/healthcheck`
   - Interval: 5 minutes
   - Expected keyword: `"ok":true`

**Alerting**:
- Email/SMS on failure
- Slack webhook integration
- PagerDuty for critical services

---

## 4. Rollback Procedures

### Quick Rollback (Lovable)

1. Go to **Project** → **Versions**
2. Find last known good version (green checkmark)
3. Click **Restore**
4. Confirm rollback

**Time**: ~2 minutes

### Git Rollback (GitHub)

```bash
# Find last good commit
git log --oneline

# Revert to specific commit
git revert <commit-hash>

# Or reset (destructive)
git reset --hard <commit-hash>
git push --force origin main
```

**Time**: ~5 minutes (with CI/CD)

### Database Rollback

If migration caused issues:

```bash
# Via Supabase Dashboard
# Go to Database → Migrations
# Click "Revert" on problematic migration

# Or via CLI
supabase db reset
supabase db push
```

**⚠️ Warning**: Test thoroughly in staging first!

### Rollback Checklist

Before rollback:
- [ ] Identify root cause
- [ ] Document issue (create incident report)
- [ ] Notify team/users
- [ ] Create backup (if not auto-backed)

During rollback:
- [ ] Monitor error rates
- [ ] Check user reports
- [ ] Verify core functionality

After rollback:
- [ ] Confirm system stable
- [ ] Update status page
- [ ] Post-mortem meeting
- [ ] Plan fix for next release

### Emergency Contacts

- **On-Call Engineer**: [Phone/Slack]
- **Team Lead**: [Phone/Email]
- **Lovable Support**: [Discord/Email]

---

## 5. Rate Limiting Configuration

### Cloudflare Rate Limiting

Configure in **Security** → **WAF** → **Rate Limiting Rules**:

**Voting Endpoint**:
```
Rule: Block voting spam
When: Path matches /api/vote
Requests: 10 per 60 seconds per IP
Action: Challenge with Turnstile
```

**Login Endpoint**:
```
Rule: Block login attempts
When: Path matches /api/login OR /api/auth/*
Requests: 5 per 900 seconds per IP
Action: Block for 15 minutes
```

**Registration**:
```
Rule: Block mass registration
When: Path matches /api/register
Requests: 3 per 3600 seconds per IP
Action: Block for 1 hour
```

### Application-Level Rate Limiting

See `docs/OPERATIONAL_PLAYBOOK.md` for Redis-based rate limiting implementation.

---

## 6. DDoS Protection

### Cloudflare Settings

**Under Attack Mode** (Emergency):
- Security → Settings → Security Level → "I'm Under Attack"
- Enables JavaScript challenge for all visitors
- Use only during active attacks

**Bot Fight Mode**:
- Security → Bots → Configure
- Enable "Bot Fight Mode"
- Blocks known bad bots automatically

**Challenge Passage**:
- Security → Settings → Challenge Passage
- Set to 30 minutes (balance security vs UX)

---

## 7. SSL/TLS Configuration

### Cloudflare SSL/TLS

**Mode**: Full (Strict)
- End-to-end encryption
- Validates origin certificate

**Edge Certificates**:
- Auto-renewing Let's Encrypt
- Always use HTTPS: Enabled
- Minimum TLS version: 1.2
- Opportunistic encryption: Enabled

**HSTS**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Submit to HSTS preload list: [hstspreload.org](https://hstspreload.org/)

---

## 8. Backup & Disaster Recovery

### Automated Backups

**Supabase** (if using external project):
- Daily automated backups (retention: 7 days)
- Manual backups before migrations
- Point-in-time recovery (PITR) for pro plans

**Lovable Cloud**:
- Automatic version snapshots
- Restore from version history

### Backup Schedule

```yaml
# Suggested backup strategy
Daily: Automated (7 day retention)
Weekly: Manual snapshot (30 day retention)
Monthly: Archive backup (1 year retention)
Pre-deployment: Always
```

### Disaster Recovery Plan

**RTO** (Recovery Time Objective): 1 hour
**RPO** (Recovery Point Objective): 24 hours

**Steps**:
1. Assess impact (< 5 min)
2. Activate incident response (< 10 min)
3. Restore from backup (< 30 min)
4. Verify functionality (< 15 min)
5. Post-mortem (24 hours after)

---

## 9. Monitoring & Alerting

### Key Metrics

**Performance**:
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Request throughput

**Business**:
- Active users
- Votes submitted
- Registration rate
- Conversion funnel

**Security**:
- Failed login attempts
- Rate limit hits
- Suspicious activity logs
- Blocked IPs

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error rate | >1% | >5% |
| Response time (p95) | >1s | >3s |
| Failed logins | >10/min | >50/min |
| 429 rate | >50/min | >200/min |

### Tools

- **Sentry**: Frontend errors
- **Supabase**: Backend logs
- **Cloudflare Analytics**: Traffic & security
- **UptimeRobot**: Uptime monitoring

---

## 10. Compliance & Privacy

### GDPR (if applicable)

- [ ] Privacy policy published
- [ ] Cookie consent implemented
- [ ] Data retention policy defined
- [ ] Right to deletion implemented
- [ ] Data export available

### Data Retention

- **User data**: Indefinite (until deletion request)
- **Logs**: 30 days
- **Backups**: 7 days (automated), 30 days (manual)
- **Analytics**: 90 days

---

## Security Checklist Summary

Before production deployment:

- [ ] Security headers configured (Cloudflare)
- [ ] Cookies set with Secure, HttpOnly, SameSite
- [ ] Healthcheck endpoint deployed
- [ ] Rollback procedure documented
- [ ] Rate limiting active
- [ ] DDoS protection enabled
- [ ] SSL/TLS: Full (Strict)
- [ ] Automated backups verified
- [ ] Monitoring & alerts configured
- [ ] Incident response plan ready

---

**Remember**: Security is an ongoing process. Review and update these configurations regularly!

**Last Updated**: 2025-01-11
