# Release Checklist

Use this checklist before deploying to production to ensure code quality, security, and performance standards.

---

## Pre-Release Checks

### 🔍 Code Quality

- [ ] **Type Check**: `pnpm type-check` or `npx tsc --noEmit` passes without errors
- [ ] **Linting**: `pnpm lint` passes without errors
- [ ] **Build**: `pnpm build` completes successfully without warnings
- [ ] **No console errors**: Check browser console in production build
- [ ] **No TODO/FIXME**: Review and address critical TODOs in code

### 🧪 Testing

- [ ] **Unit Tests**: `pnpm test` passes (all tests green)
  - [ ] Coverage ≥60% (lines, functions, branches, statements)
  - [ ] No skipped tests (`test.skip`, `describe.skip`)
  - [ ] No focused tests (`test.only`, `describe.only`)

- [ ] **E2E Tests**: `pnpm e2e:preview` passes
  - [ ] Routing redirects work correctly
    - [ ] `/ph` → `/en-ph` (with saved locale)
    - [ ] `/contest` → `/{lang}-{cc}/contest`
    - [ ] `/EN-PH` → `/en-ph` (case normalization)
    - [ ] `/xx-zz` → `/en-ph` (fallback)
  - [ ] URL filters synchronize correctly
  - [ ] SEO tags present (canonical, hreflang)
  - [ ] Turnstile widget appears on protected actions
  - [ ] Performance acceptable (<3s load time)

### 🔒 Security

- [ ] **No Secrets in Code**: All API keys use environment variables
- [ ] **Turnstile Keys**: Production keys configured (not test keys)
  - [ ] `VITE_TURNSTILE_SITE_KEY` set correctly
  - [ ] `TURNSTILE_SECRET_KEY` stored in Lovable/Supabase secrets
  - [ ] Test keys (`1x00000000000000000000AA`) removed from production env

- [ ] **Cloudflare Settings**:
  - [ ] WAF enabled on all routes
  - [ ] SSL/TLS set to "Full (strict)"
  - [ ] Bot Fight Mode enabled
  - [ ] AI Crawl Control set to "Block"
  - [ ] Rate limiting configured

- [ ] **RLS Policies**: All database tables have proper Row Level Security
- [ ] **Input Validation**: User inputs properly sanitized
- [ ] **CORS**: Configured correctly for production domain

### 🎨 UI/UX

- [ ] **Responsive Design**: Test on mobile, tablet, desktop
- [ ] **Dark Mode**: Works correctly (if applicable)
- [ ] **Accessibility**: No critical WCAG violations
- [ ] **Loading States**: Proper spinners/skeletons for async data
- [ ] **Error States**: Friendly error messages shown
- [ ] **Empty States**: Helpful messages when no data

### 🚀 Performance

- [ ] **Batch Requests**: Rating stats use `getRatingStatsBulk()` (1 request per page)
  - Check Network tab: Should see single bulk request, not N individual requests
  
- [ ] **Virtualization**: Active for lists >50 items
  - [ ] Past weeks contestants list
  - [ ] Admin participant table
  - DOM node count reasonable (check DevTools)

- [ ] **Image Optimization**:
  - [ ] Lazy loading enabled
  - [ ] Proper sizes/srcsets
  - [ ] Modern formats (WebP/AVIF) where supported

- [ ] **Bundle Size**:
  - [ ] Main bundle <500KB
  - [ ] Vendor bundle <1MB
  - [ ] Check with: `ls -lh dist/assets/*.js`

- [ ] **Lighthouse Score** (Mobile):
  - [ ] Performance >90
  - [ ] Accessibility >90
  - [ ] Best Practices >90
  - [ ] SEO >90

### 🌐 SEO

- [ ] **Canonical URLs**: Present and correct on all pages
  - [ ] Include locale prefix (e.g., `/en-ph/contest`)
  - [ ] No trailing slashes
  - [ ] HTTPS in production

- [ ] **Hreflang Tags**: Auto-generated for all locales
  - [ ] Test on 3+ different locale pages
  - [ ] `x-default` points to `/en-ph`
  - [ ] Format: `en-PH`, `ru-KZ` (language-COUNTRY)

- [ ] **Meta Tags**: Title, description appropriate
- [ ] **Open Graph**: Proper tags for social sharing
- [ ] **Structured Data**: JSON-LD where applicable
- [ ] **Robots.txt**: Configured correctly
- [ ] **Sitemap**: Generated and submitted

---

## Deployment Steps

### 1. Pre-Deploy

- [ ] **Backup Database**: Trigger manual backup (if applicable)
- [ ] **Feature Flags**: Disable incomplete features
- [ ] **Maintenance Mode**: Consider enabling for major updates
- [ ] **Team Notification**: Alert team of upcoming deployment

### 2. Deploy

Via Lovable:
- [ ] Click "Publish" button
- [ ] Select production environment
- [ ] Confirm deployment

Via GitHub (if using CI/CD):
- [ ] Push to `main` branch
- [ ] Monitor GitHub Actions workflow
- [ ] Wait for all checks to pass

### 3. Post-Deploy Verification

- [ ] **Health Check**: Visit production URL, verify app loads
- [ ] **Smoke Test**: Quick manual test of critical flows:
  - [ ] Homepage loads
  - [ ] Contest page loads with participants
  - [ ] Voting works (with Turnstile)
  - [ ] Login/registration works
  - [ ] Admin panel accessible (if admin)
  - [ ] Locale switching works

- [ ] **Monitor Logs**: Check for spike in errors
  - [ ] Sentry (frontend errors)
  - [ ] Supabase logs (backend errors)
  - [ ] Cloudflare Analytics (WAF blocks, 429s)

- [ ] **Performance**: Verify metrics within acceptable range
  - [ ] LCP <2.5s
  - [ ] INP <200ms
  - [ ] No major CLS issues

### 4. Rollback Plan

**If issues detected**:

1. **Assess Impact**: Critical vs. minor issue
2. **Quick Fix**: If simple, push hotfix
3. **Rollback**: If complex, revert to previous version
   - Lovable: Use version history to restore
   - GitHub: `git revert` and push
4. **Notify Users**: Status banner or announcement
5. **Post-Mortem**: Document issue and prevention

---

## Environment-Specific Checks

### Staging

- [ ] Test with production-like data volume
- [ ] Verify staging database migrations
- [ ] Test with staging Turnstile keys
- [ ] Run full E2E suite: `BASE_URL=${STAGING_URL} pnpm test:e2e`

### Production

- [ ] Production secrets configured
- [ ] Production database backed up
- [ ] CDN cache invalidated (if needed)
- [ ] DNS records correct
- [ ] SSL certificate valid

---

## Monitoring (First 24 Hours)

### Metrics to Watch

- [ ] **Error Rate**: Should stay <1%
  - [ ] 5xx errors
  - [ ] JavaScript exceptions
  - [ ] Failed API calls

- [ ] **Performance**:
  - [ ] LCP <2.5s (p75)
  - [ ] INP <200ms (p75)
  - [ ] API response time <500ms (p95)

- [ ] **Security**:
  - [ ] 403 rate (Turnstile failures)
  - [ ] 429 rate (rate limits)
  - [ ] Unusual geographic traffic

- [ ] **Business Metrics**:
  - [ ] Active users
  - [ ] Votes submitted
  - [ ] Registrations completed
  - [ ] Bounce rate

### Alert Thresholds

Set up alerts for:
- Error rate >5% for 5 minutes
- Response time >2s (p95) for 10 minutes
- 429 rate >100/minute (possible attack)
- Database query time >1s (p95)

---

## Quick Commands

### One-Liner Full Check
```bash
pnpm build && pnpm test && pnpm e2e:preview
```

### Staging E2E
```bash
BASE_URL=${STAGING_URL} pnpm test:e2e
```

### Coverage Check
```bash
pnpm test -- --coverage
# Look for: All metrics ≥60%
```

### Bundle Size
```bash
pnpm build && ls -lh dist/assets/*.js
# Main: <500KB, Vendor: <1MB
```

### Lighthouse (Chrome DevTools)
```bash
# 1. Build and preview
pnpm build && pnpm preview

# 2. Open Chrome DevTools
# 3. Lighthouse tab → Mobile → Generate report
# 4. Verify all scores >90
```

---

## Post-Release

- [ ] **Update Documentation**: If major changes
- [ ] **Changelog**: Document what changed
- [ ] **Team Update**: Share release notes
- [ ] **Monitor**: Watch metrics for 24-48 hours
- [ ] **User Feedback**: Check support channels

---

## Common Issues & Solutions

### Build Fails
- Clear cache: `rm -rf node_modules/.vite dist`
- Reinstall: `pnpm install --frozen-lockfile`
- Check for circular dependencies

### E2E Tests Fail
- Ensure preview server is running
- Check BASE_URL environment variable
- Verify test keys configured
- Review traces: `npx playwright show-trace trace.zip`

### Performance Regression
- Check bundle size vs. previous release
- Verify lazy loading still working
- Confirm batch requests (not N individual)
- Review new dependencies added

### SEO Issues
- Validate with [Google Rich Results Test](https://search.google.com/test/rich-results)
- Check [hreflang validator](https://www.sistrix.com/hreflang-validator/)
- Verify canonical with browser DevTools

---

## Checklist Template

Copy this for each release:

```markdown
## Release: v[VERSION] - [DATE]

### Pre-Release
- [ ] Code quality checks passed
- [ ] All tests green (unit + E2E)
- [ ] Security review completed
- [ ] Performance benchmarks acceptable
- [ ] SEO tags verified

### Deploy
- [ ] Database backup created
- [ ] Deployed to production
- [ ] Post-deploy smoke tests passed

### Monitoring
- [ ] Error rates normal
- [ ] Performance within SLAs
- [ ] No security alerts
- [ ] User feedback positive

### Notes
[Any special notes about this release]

### Rollback Plan
[Link to previous version or rollback commit]
```

---

**Remember**: It's better to delay a release than to ship broken code. When in doubt, test more, deploy less frequently.

**Last Updated**: 2025-01-11  
**Version**: 1.0
