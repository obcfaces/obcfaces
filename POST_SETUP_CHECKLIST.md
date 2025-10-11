# Post-Setup Checklist

Final steps to ensure production-grade stability and self-sustaining DevOps workflow.

---

## ✅ 1. Husky Git Hooks

### Install Husky

**⚠️ Important**: `package.json` is read-only. Add manually:

```json
{
  "scripts": {
    "prepare": "husky install",
    "check:all": "pnpm build && pnpm test && pnpm e2e:preview",
    "ci:local": "pnpm e2e:preview"
  }
}
```

### Initialize

```bash
# Install dependencies (triggers prepare script)
pnpm install

# Verify husky installation
ls .husky/

# Should see:
# - pre-commit
# - pre-push
# - _/husky.sh
```

### Verify Hooks

```bash
# Check pre-commit hook
cat .husky/pre-commit
# Should run: type-check

# Check pre-push hook
cat .husky/pre-push
# Should run: type-check + lint + build + test
```

### Test Hooks

```bash
# Test pre-commit
git add .
git commit -m "test: verify hooks"
# Should run type check

# Test pre-push
git push
# Should run all checks (build + test)

# Bypass if needed (not recommended)
git push --no-verify
```

**✅ Verified**: Git hooks prevent pushing broken code

---

## ✅ 2. CI/CD Permissions

### GitHub Actions Permissions

Verify `.github/workflows/ci.yml` has:

```yaml
permissions:
  contents: read
  pull-requests: write
```

This allows CI to:
- ✅ Comment on PRs with test results
- ✅ Upload artifacts (coverage, Playwright reports)
- ✅ Update PR status checks

### Test PR Comments

1. Create a test PR
2. Push changes
3. Wait for CI to complete
4. Check PR for automated comments:
   - ✅ Coverage summary
   - ✅ E2E test results
   - ✅ Links to Playwright reports

**Example Comment**:
```
## E2E Tests (chromium)

**Status**: ✅ Passed

- **Project**: chromium
- **Base URL**: http://localhost:4173
- **Run**: #123

View Details
```

**✅ Verified**: CI comments appear on PRs

---

## ✅ 3. README Documentation

### Required Sections

Verify `README.md` includes:

- [x] **Header**: Title, description, badges
- [x] **Quick Start**: Clone, install, run
- [x] **Architecture**: Tech stack, folder structure
- [x] **Testing**: Unit (Vitest) + E2E (Playwright)
- [x] **Deployment**: Via Lovable or GitHub
- [x] **Security**: Turnstile, rate limiting
- [x] **Documentation Links**:
  - `docs/OPERATIONAL_PLAYBOOK.md`
  - `RELEASE_CHECKLIST.md`
  - `TESTING_GUIDE.md`
  - `docs/TURNSTILE_INTEGRATION.md`

### Badges

Verify badges show:
- ✅ CI status
- ✅ Production smoke tests status
- ✅ Code coverage
- ✅ Tech stack (TypeScript, React, Vite, etc.)

### Update Links

Replace placeholders:
```markdown
# Before
[![CI](https://github.com/your-repo/obc-faces/...)]

# After (replace with actual repo)
[![CI](https://github.com/actual-org/actual-repo/...)]
```

**✅ Verified**: README is complete and links work

---

## ✅ 4. Weekly Production Smoke Tests

### Verify Workflow

Check `.github/workflows/prod-smoke.yml`:

- [x] Scheduled: Every Monday at 8:00 UTC
- [x] Runs E2E tests against production
- [x] Creates GitHub issue on failure
- [x] Posts to Slack (if webhook configured)
- [x] Uploads artifacts (reports, traces)

### Schedule

```yaml
on:
  schedule:
    # Every Monday at 8:00 UTC
    - cron: '0 8 * * 1'
  workflow_dispatch: # Manual trigger
```

### Test Manual Trigger

1. Go to **Actions** tab in GitHub
2. Select **Production Smoke Tests**
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow**
6. Wait for completion
7. Review report

### Configure Alerts (Optional)

**Slack Notifications**:

Add to GitHub repository secrets:
- `SLACK_WEBHOOK_URL`: Slack incoming webhook URL

Get webhook: [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)

**Email Notifications**:

Configure in GitHub: **Settings** → **Notifications** → **Actions**

**✅ Verified**: Weekly smoke tests scheduled and working

---

## ✅ 5. Environment Variables

### Development (.env.local)

Copy template:
```bash
cp .env.example .env.local
```

Configure:
```bash
DEFAULT_LOCALE=en-ph
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
BASE_URL=http://localhost:4173
```

### Production (Lovable Cloud / Supabase)

**Via Lovable Cloud**:
1. Project Settings → Secrets
2. Add production keys

**Via Supabase Edge Functions**:
1. Supabase Dashboard → Edge Functions → Secrets
2. Add `TURNSTILE_SECRET_KEY`

### CI/CD (GitHub Secrets)

Add to repository secrets:
- `TURNSTILE_SITE_KEY_TEST`: `1x00000000000000000000AA`
- `TURNSTILE_SECRET_TEST`: `1x0000000000000000000000000000000AA`
- `STAGING_URL`: Staging environment URL (optional)
- `SLACK_WEBHOOK_URL`: Slack webhook (optional)
- `CODECOV_TOKEN`: Code coverage token (optional)

**✅ Verified**: All environments configured

---

## ✅ 6. Documentation Structure

### Verify Files Exist

```
/
├── README.md                          ✅ Main documentation
├── RELEASE_CHECKLIST.md              ✅ Pre-release checklist
├── PRE_PUSH_CHECKLIST.md             ✅ Quick checks
├── TESTING_GUIDE.md                  ✅ Testing guide
├── SMOKE_TESTS_CHECKLIST.md          ✅ Manual smoke tests
├── .env.example                      ✅ Environment template
├── docs/
│   ├── OPERATIONAL_PLAYBOOK.md       ✅ Operations guide
│   ├── TURNSTILE_INTEGRATION.md      ✅ Security guide
│   └── PRODUCTION_SMOKE_TESTS.md     ✅ Prod testing guide
├── .github/
│   └── workflows/
│       ├── ci.yml                    ✅ Main CI pipeline
│       └── prod-smoke.yml            ✅ Weekly prod tests
└── .husky/
    ├── pre-commit                    ✅ Pre-commit hook
    └── pre-push                      ✅ Pre-push hook
```

### Quick Access Commands

Add to your shell rc file (~/.bashrc, ~/.zshrc):

```bash
# OBC Faces shortcuts
alias obc-docs="cat README.md"
alias obc-test="pnpm check:all"
alias obc-release="cat RELEASE_CHECKLIST.md"
alias obc-ops="cat docs/OPERATIONAL_PLAYBOOK.md"
```

**✅ Verified**: All documentation in place

---

## ✅ 7. Testing Infrastructure

### Verify Test Commands

```bash
# Unit tests
pnpm test                  # Run tests
pnpm test:watch            # Watch mode
pnpm test:coverage         # With coverage

# E2E tests
pnpm test:e2e              # Run E2E
pnpm test:e2e:headed       # Headed mode
pnpm e2e:preview           # Build + preview + E2E

# All checks
pnpm check:all             # Full suite
pnpm ci:local              # Simulate CI
```

### Coverage Thresholds

Verify `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60,
  }
}
```

### Playwright Config

Verify `playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', ... },
  { name: 'iphone-12', ... },
]
```

**✅ Verified**: Testing infrastructure complete

---

## ✅ 8. Security Configuration

### Cloudflare

Verify settings:
- [x] WAF enabled on all routes
- [x] SSL/TLS: Full (strict)
- [x] Bot Fight Mode: Enabled
- [x] AI Crawl Control: Block

### Turnstile

Production keys configured:
- [x] Site key in Lovable/Supabase
- [x] Secret key in Edge Function secrets
- [x] Test keys NOT in production

### Rate Limiting

Verify endpoints protected:
- [x] `/api/vote` - 10/hour per IP/user
- [x] `/api/login` - 5/15min per IP
- [x] `/api/register` - 3/hour per IP

**✅ Verified**: Security measures in place

---

## ✅ 9. Performance Benchmarks

### Run Lighthouse

```bash
# Build and preview
pnpm build && pnpm preview

# Open Chrome DevTools
# Lighthouse tab → Mobile → Generate report
```

**Targets**:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### Check Bundle Size

```bash
pnpm build
ls -lh dist/assets/*.js

# Targets:
# - Main bundle: <500KB
# - Vendor bundle: <1MB
```

### Verify Optimizations

- [x] Batch rating requests (not N individual)
- [x] Virtualization for lists >50 items
- [x] Lazy loading images
- [x] React.memo, useCallback, useMemo

**✅ Verified**: Performance optimized

---

## ✅ 10. Monitoring & Alerts

### Set Up Monitoring

**Sentry** (Frontend errors):
1. Create Sentry project
2. Add DSN to environment variables
3. Verify error tracking

**Supabase Logs** (Backend):
1. Enable logs in Supabase dashboard
2. Set up email alerts for errors

**Cloudflare Analytics**:
1. Review traffic patterns
2. Monitor WAF blocks
3. Track 429 rate limits

### Alert Thresholds

Configure alerts for:
- Error rate >5% for 5 minutes
- Response time >2s (p95) for 10 minutes
- 429 rate >100/minute
- Database query time >1s (p95)

**✅ Verified**: Monitoring configured

---

## 🎉 Final Verification

Run complete verification:

```bash
# 1. Clean install
rm -rf node_modules .husky/_
pnpm install

# 2. Verify hooks
ls .husky/pre-commit .husky/pre-push

# 3. Run all checks
pnpm check:all

# 4. Test production
BASE_URL=https://obcface.com pnpm test:e2e

# 5. Review reports
open playwright-report/index.html
open coverage/index.html
```

**All Green?** 🎉 You're production-ready!

---

## 📋 Post-Setup Summary

### What You've Built

✅ **Automated Testing**:
- Unit tests (Vitest) with 60%+ coverage
- E2E tests (Playwright) for critical flows
- Weekly production smoke tests

✅ **Quality Gates**:
- Git hooks prevent broken commits/pushes
- CI pipeline blocks broken PRs
- Automated PR comments with results

✅ **Documentation**:
- Comprehensive README
- Operational playbook
- Release checklists
- Testing guides

✅ **Security**:
- Turnstile CAPTCHA
- Rate limiting
- Cloudflare WAF
- Environment secrets

✅ **Performance**:
- Batch API requests
- List virtualization
- Image optimization
- Bundle size limits

✅ **Monitoring**:
- Error tracking (Sentry)
- Performance metrics
- Production smoke tests
- Alert thresholds

### Next Steps

1. **Team Onboarding**: Share README with team
2. **First Release**: Follow `RELEASE_CHECKLIST.md`
3. **Monitor**: Watch metrics for 24-48 hours
4. **Iterate**: Improve based on real-world usage

---

## 🆘 Troubleshooting

### Hooks Not Running

```bash
# Reinstall husky
rm -rf .husky/_
pnpm husky install

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### CI Comments Not Appearing

Check:
- Repository settings → Actions → Workflow permissions
- Should be: "Read and write permissions"

### Smoke Tests Failing

1. Check Playwright report in artifacts
2. Review traces for specific failures
3. Verify production environment
4. Check recent deployments

### Coverage Below Threshold

```bash
# Generate detailed coverage report
pnpm test -- --coverage

# Open in browser
open coverage/index.html

# Focus on uncovered areas
```

---

**Congratulations!** 🎊 Your DevOps setup is production-grade and self-sustaining.

**Questions?** Check [Operational Playbook](./docs/OPERATIONAL_PLAYBOOK.md) or create an issue.
