# Production Smoke Tests

Weekly automated smoke tests against production to catch routing, SEO, and caching issues.

## Schedule

Run weekly (or after major releases):
```bash
BASE_URL=https://obcface.com pnpm test:e2e
```

## Automated Setup

### GitHub Actions (Weekly Cron)

Add to `.github/workflows/prod-smoke.yml`:

```yaml
name: Production Smoke Tests

on:
  schedule:
    # Run every Monday at 2 AM UTC
    - cron: '0 2 * * 1'
  workflow_dispatch: # Allow manual trigger

jobs:
  prod-smoke:
    name: Production Smoke Tests
    runs-on: ubuntu-latest
    env:
      BASE_URL: https://obcface.com
      DEFAULT_LOCALE: en-ph
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium
      
      - name: Run smoke tests
        run: pnpm exec playwright test --project=chromium
      
      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: prod-smoke-report
          path: playwright-report/
          retention-days: 90
      
      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚨 Production smoke tests failed!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Smoke Tests Failed*\n\nView report: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Test Coverage

Production smoke tests verify:

### ✅ Routing & Redirects
- `/ph` → `/en-ph` (with saved locale)
- `/contest` → `/{lang}-{cc}/contest`
- `/EN-PH` → `/en-ph` (case normalization)
- `/xx-zz` → fallback to `/en-ph`
- Query parameters preserved in redirects

### ✅ SEO
- Canonical URLs correct (with locale prefix)
- Hreflang tags present for all locales
- x-default hreflang points to `/en-ph`
- No duplicate canonicals
- Meta tags (title, description) present

### ✅ Performance
- Page load <3s (mobile network)
- LCP <2.5s
- No console errors
- Virtualization active for large lists

### ✅ Security
- Turnstile widget appears on protected actions
- Rate limiting returns 429 when triggered
- HTTPS enforced
- Security headers present

### ✅ Functionality
- Contest page loads participants
- Voting flow works (with Turnstile)
- Filters update URL correctly
- Admin panel accessible (if logged in)

## Manual Smoke Test

Quick manual verification (5 minutes):

```bash
# 1. Run tests
BASE_URL=https://obcface.com pnpm test:e2e

# 2. Review report
open playwright-report/index.html

# 3. Check specific areas
# - Homepage loads
# - Contest page shows participants
# - Voting requires Turnstile
# - Locale switching works
# - Filters update URL
# - No console errors
```

## Monitoring Alerts

Set up alerts for:

### Critical (Immediate)
- 5xx error rate >1% for 5 minutes
- Site down (health check fails)
- Database connection failures
- Edge function timeouts

### Warning (Within 1 hour)
- 4xx error rate >5% for 10 minutes
- Slow response times (p95 >2s)
- High rate limiting (429s)
- Turnstile verification failures spike

### Info (Within 24 hours)
- SEO tag issues detected
- Canonical URL mismatches
- Missing hreflang tags
- Performance regression (LCP >3s)

## Incident Response

If production smoke tests fail:

1. **Check Status**:
   - Supabase status page
   - Cloudflare status
   - Recent deployments

2. **Review Logs**:
   - Sentry (frontend errors)
   - Supabase logs (backend errors)
   - Cloudflare Analytics (traffic patterns)

3. **Triage**:
   - Critical: Immediate fix or rollback
   - Non-critical: Schedule fix in next sprint

4. **Rollback** (if needed):
   - Lovable: Restore previous version
   - GitHub: Revert merge commit

5. **Post-Mortem**:
   - Document issue
   - Root cause analysis
   - Prevention measures

## Reporting

### Weekly Summary

Email report includes:
- Test pass/fail status
- Failed test details
- Performance metrics
- Action items (if any)

### Dashboards

Monitor production health:
- Grafana/DataDog for metrics
- Sentry for error tracking
- Cloudflare Analytics for traffic
- Google Search Console for SEO

## Best Practices

1. **Run regularly**: Weekly minimum, after major releases
2. **Monitor trends**: Track performance over time
3. **Alert on failures**: Don't let issues linger
4. **Keep tests up-to-date**: Update as features change
5. **Document issues**: Build knowledge base

## Useful Commands

```bash
# Run against production
BASE_URL=https://obcface.com pnpm test:e2e

# Run against staging
BASE_URL=${STAGING_URL} pnpm test:e2e

# Run specific test
BASE_URL=https://obcface.com npx playwright test tests/smoke.spec.ts

# Debug mode
BASE_URL=https://obcface.com npx playwright test --debug

# Generate trace
BASE_URL=https://obcface.com npx playwright test --trace on

# View last report
open playwright-report/index.html
```

---

**Remember**: Production smoke tests are your early warning system. Don't ignore failures!
