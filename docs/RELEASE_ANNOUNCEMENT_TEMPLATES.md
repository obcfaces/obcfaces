# Release Announcement Template

Professional release announcement templates for GitHub Releases and team communication.

---

## GitHub Release Template

Copy this template when creating a GitHub release:

```markdown
# 🚀 Release v[VERSION] - [RELEASE_NAME]

**Release Date**: [DATE]  
**Build ID**: [BUILD_ID]  
**Deployment**: Production ✅

---

## 🎯 Highlights

<!-- Key features and improvements -->
- ✨ **New Feature**: [Description]
- 🐛 **Bug Fix**: [Description]
- ⚡ **Performance**: [Description]
- 🔒 **Security**: [Description]

---

## 📊 Metrics

<!-- Post-deployment metrics -->
- **Performance**: LCP [X.X]s, INP [XXX]ms
- **Availability**: [XX.XX]% uptime
- **Error Rate**: [X.XX]%
- **Tests**: [XXX] unit + [XX] E2E (all passing ✅)

---

## 🔧 Technical Changes

### Frontend
- Updated routing with locale normalization
- Implemented batch rating statistics loading
- Added virtualization for large lists (>50 items)
- Enhanced SEO with dynamic hreflang tags

### Backend
- Configured Turnstile CAPTCHA protection
- Implemented rate limiting on critical endpoints
- Added healthcheck endpoint for monitoring
- Enhanced security headers (HSTS, CSP, etc.)

### Infrastructure
- Set up CI/CD with GitHub Actions
- Configured weekly production smoke tests
- Implemented automated PR comments with test results
- Added Playwright browser caching for faster builds

---

## 📚 Documentation

- [Release Checklist](./RELEASE_CHECKLIST.md) - Pre-release verification
- [Operational Playbook](./docs/OPERATIONAL_PLAYBOOK.md) - Day-to-day operations
- [Production Security](./docs/PRODUCTION_SECURITY.md) - Security configuration
- [Testing Guide](./TESTING_GUIDE.md) - Running tests locally

---

## 🔄 Rollback Information

**Last Known Good**:
- Version: [PREVIOUS_VERSION]
- Commit: [PREVIOUS_COMMIT_HASH]
- Lovable Version ID: [PREVIOUS_VERSION_ID]

**Rollback Instructions**: See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md#4-rollback-plan)

---

## ✅ Deployment Verification

- [x] Healthcheck: `https://obcface.com/healthcheck` → 200 OK
- [x] Security headers verified
- [x] SEO tags (canonical, hreflang) present
- [x] Production smoke tests passed
- [x] Performance metrics within SLA

---

## 🙏 Contributors

Thanks to everyone who contributed to this release!

- [@username](https://github.com/username) - Feature X
- [@username](https://github.com/username) - Bug fix Y

---

## 📝 Full Changelog

**See**: [v[PREVIOUS_VERSION]...v[VERSION]](https://github.com/[ORG]/[REPO]/compare/v[PREVIOUS_VERSION]...v[VERSION])

---

**Questions?** Check our [documentation](./docs/OPERATIONAL_PLAYBOOK.md) or reach out on Slack.
```

---

## Slack Announcement Template

Copy this template for Slack announcements:

```markdown
🚀 **Production Release: v[VERSION]** 🚀

**Deployed**: [TIME] UTC
**Status**: ✅ Successful
**Build**: [BUILD_ID]

---

### 🎯 What's New

✨ **Features**
• [Feature 1 description]
• [Feature 2 description]

⚡ **Performance**
• LCP: [X.X]s (target: <2.5s) ✅
• INP: [XXX]ms (target: <200ms) ✅
• Bundle size optimized

🔒 **Security**
• Enhanced rate limiting
• Turnstile CAPTCHA on critical endpoints
• Security headers configured

🐛 **Bug Fixes**
• [Fix 1]
• [Fix 2]

---

### 📊 Post-Deploy Metrics (First Hour)

✅ Healthcheck: 200 OK
✅ Error rate: [X.XX]%
✅ Response time (p95): [XXX]ms
✅ Smoke tests: All passing

---

### 📚 Links

• [Release Notes](https://github.com/[ORG]/[REPO]/releases/tag/v[VERSION])
• [Changelog](https://github.com/[ORG]/[REPO]/compare/v[PREV]...v[VERSION])
• [Documentation](./docs/OPERATIONAL_PLAYBOOK.md)

---

### 🔄 Rollback Info

**Previous stable**: v[PREV_VERSION] ([COMMIT_HASH])
**Rollback**: See [release checklist](./RELEASE_CHECKLIST.md#rollback)

---

🙌 **Great work, team!** Questions? Drop them here 👇
```

---

## Short Status Update Template

For quick status updates in Slack/Discord:

```markdown
✅ **v[VERSION] deployed to production**

🎯 Highlights: [key feature/fix]
📊 All metrics green
⏱️ Deployed at: [TIME] UTC

Full notes: [GitHub Release Link]
```

---

## Incident/Rollback Announcement

If rollback is needed:

```markdown
⚠️ **Production Rollback: v[VERSION] → v[PREV_VERSION]**

**Time**: [TIME] UTC
**Reason**: [Brief description of issue]
**Status**: ✅ Rolled back successfully

---

### 📋 What Happened

[Detailed but concise explanation of the issue]

### 🔧 Action Taken

• Rolled back to v[PREV_VERSION]
• [Any other actions taken]

### 📊 Current Status

✅ Application stable
✅ All services operational
✅ Error rate back to normal: [X.XX]%

---

### 📝 Next Steps

1. Root cause analysis scheduled for [DATE/TIME]
2. Fix planned for next release
3. Additional monitoring added

---

**Postmortem**: [Link to doc/issue]
**Questions**: Reply in thread or DM [ON_CALL_PERSON]
```

---

## Email Template (for stakeholders)

```
Subject: Production Release - v[VERSION] Deployed Successfully

Hi team,

We've successfully deployed v[VERSION] to production.

KEY HIGHLIGHTS:
• [Feature/improvement 1]
• [Feature/improvement 2]
• [Performance/security enhancement]

DEPLOYMENT DETAILS:
• Release time: [TIME] UTC
• Deployment duration: [X] minutes
• Zero downtime: ✅
• All tests passing: ✅

POST-DEPLOYMENT STATUS:
• Performance: LCP [X.X]s, INP [XXX]ms
• Error rate: [X.XX]% (within SLA)
• User feedback: [Positive/monitoring]

DOCUMENTATION:
Full release notes: [GitHub Release URL]
Changelog: [Changelog URL]

ROLLBACK PLAN:
Previous stable version: v[PREV_VERSION]
Rollback procedure: [Link to docs]

Feel free to reach out with any questions!

Best regards,
[YOUR_NAME]
Engineering Team
```

---

## Usage Guide

### Creating a Release

1. **Gather Information**:
   ```bash
   # Get version from package.json or git tag
   VERSION=$(git describe --tags --abbrev=0)
   
   # Get build ID (from CI)
   BUILD_ID=$(git rev-parse --short HEAD)
   
   # Get previous version
   PREV_VERSION=$(git describe --tags --abbrev=0 HEAD^)
   ```

2. **Fill Template**:
   - Replace `[VERSION]` with actual version (e.g., 1.2.3)
   - Replace `[RELEASE_NAME]` with descriptive name (e.g., "Performance Boost")
   - Replace `[DATE]` with deployment date
   - Replace `[BUILD_ID]` with commit hash
   - Add actual metrics from post-deployment checks

3. **Post to Channels**:
   - Create GitHub Release with full template
   - Post Slack announcement to #engineering and #general
   - Send email to stakeholders (if major release)
   - Update changelog file

### Metrics to Include

**Always include**:
- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- Error rate percentage
- Test results (unit + E2E counts)

**Nice to have**:
- Bundle size comparison
- API response time (p95)
- User feedback/early reports
- Coverage percentage

---

## Example: Actual Release

```markdown
# 🚀 Release v1.2.0 - Performance & Security Boost

**Release Date**: 2025-01-11  
**Build ID**: abc123f  
**Deployment**: Production ✅

---

## 🎯 Highlights

- ✨ **Multi-locale Support**: Added routing for 15+ locales with SEO optimization
- ⚡ **Performance**: Batch rating loads (1 request vs N), virtualization for large lists
- 🔒 **Security**: Turnstile CAPTCHA, rate limiting, enhanced headers
- 🐛 **Bug Fix**: Fixed locale normalization edge cases

---

## 📊 Metrics

- **Performance**: LCP 1.8s, INP 140ms (both within target ✅)
- **Availability**: 99.98% uptime
- **Error Rate**: 0.12%
- **Tests**: 127 unit + 18 E2E (all passing ✅)

---

## 🔧 Technical Changes

### Frontend
- Implemented locale-aware routing with automatic redirects
- Added batch API for rating statistics (reduced requests by 95%)
- Virtualized lists for 50+ items (improved scroll performance)
- Enhanced SEO with canonical URLs and hreflang tags

### Backend
- Added Turnstile verification on vote/login/register endpoints
- Configured rate limiting (10 votes/hr, 5 login attempts/15min)
- Deployed healthcheck endpoint for monitoring
- Enhanced security headers (HSTS, CSP, X-Frame-Options)

### Infrastructure
- Set up GitHub Actions CI/CD with caching
- Configured weekly production smoke tests
- Added automated PR comments with test results
- Implemented pre-push git hooks for quality gates

---

## 📚 Documentation

- [Release Checklist](./RELEASE_CHECKLIST.md)
- [Operational Playbook](./docs/OPERATIONAL_PLAYBOOK.md)
- [Production Security](./docs/PRODUCTION_SECURITY.md)
- [Testing Guide](./TESTING_GUIDE.md)

---

## 🔄 Rollback Information

**Last Known Good**: v1.1.2 (commit: def456g, Lovable ID: xyz789)

**Rollback Instructions**: See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md#rollback)

---

## ✅ Deployment Verification

- [x] Healthcheck: 200 OK with build info
- [x] Security headers verified (HSTS, CSP, etc.)
- [x] SEO tags present on all locale pages
- [x] Production smoke tests: 18/18 passed
- [x] Performance: LCP 1.8s, INP 140ms

---

**Full Changelog**: [v1.1.2...v1.2.0](https://github.com/org/repo/compare/v1.1.2...v1.2.0)
```

---

**Remember**: Adapt templates to your team's style and communication preferences!

**Last Updated**: 2025-01-11
