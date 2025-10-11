# OBC Faces — Operational Playbook

## Quick Reference

### Environments

- **Local Dev**: `pnpm dev` (http://localhost:5173)
- **Local Preview**: `pnpm preview` (http://localhost:4173)
- **Staging**: `${STAGING_URL}` (set via GitHub secrets)
- **Production**: https://obcface.com

### Key URLs
- Main app: `/{lang}-{cc}` (e.g., `/en-ph`, `/ru-kz`)
- Contest: `/{lang}-{cc}/contest`
- Admin panel: `/admin`
- Auth: `/auth`

---

## Testing

### Unit Tests (Vitest)
```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test -- --coverage

# Coverage thresholds: 60%+ (lines, functions, branches, statements)
```

**Artifacts**:
- Coverage reports: `./coverage/` (HTML, LCOV, JSON)
- Configured in: `vitest.config.ts`

### E2E Tests (Playwright)

```bash
# Local preview (builds + runs tests)
pnpm e2e:preview

# Against specific URL
BASE_URL=http://localhost:4173 pnpm test:e2e

# Against staging
BASE_URL=${STAGING_URL} pnpm test:e2e

# Headed mode (see browser)
pnpm test:e2e:headed

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui
```

**Artifacts**:
- HTML report: `./playwright-report/`
- Traces/videos: `./test-results/`
- Screenshots: `./test-results/` (on failure)

**Test Coverage**:
- ✅ Routing redirects (`/ph` → `/en-ph`)
- ✅ Locale normalization (`/EN-PH` → `/en-ph`)
- ✅ URL filter synchronization
- ✅ SEO (canonical, hreflang)
- ✅ Turnstile integration
- ✅ Performance (load time, virtualization)

---

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Lovable Cloud / Vercel
- **CDN/WAF**: Cloudflare

### Key Features
- Multi-locale support (en-ph, ru-kz, es-mx, etc.)
- Weekly beauty contest with voting
- Admin panel for participant management
- Real-time statistics and leaderboards
- Image optimization and lazy loading
- Virtualization for large lists

---

## Rate Limiting & Security

### Turnstile (Cloudflare CAPTCHA)

**Test Keys** (for dev/CI):
```bash
# Visible (always passes)
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Invisible (always passes)
VITE_TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AB

# Force failure (for testing error handling)
VITE_TURNSTILE_SITE_KEY=3x00000000000000000000FF
TURNSTILE_SECRET_KEY=3x0000000000000000000000000000000FF
```

**Production Keys**: Set via Lovable Cloud Secrets or Supabase Edge Function secrets

**Protected Endpoints**:
- `/api/vote` - Voting
- `/api/login` - Authentication
- `/api/register` - User registration
- `/api/otp` - OTP verification

### Rate Limiting Strategy

**Implementation**:
- Sliding window algorithm (Redis-based)
- Keys: `rl:{endpoint}:{hash(ip)}:{userId}`
- IPv6: Use /56 prefix for CGNAT/NAT

**Limits**:
- Voting: 10 votes/hour per IP/user
- Registration: 3 attempts/hour per IP
- Login: 5 attempts/15min per IP
- OTP: 3 attempts/5min per phone

**Responses**:
- `429 Too Many Requests` with `Retry-After` header
- `403 Forbidden` for invalid Turnstile token

---

## Locales & Routing

### Locale Pattern
- Format: `/{lang}-{cc}` (e.g., `/en-ph`, `/ru-kz`)
- Components: language code (ISO 639-1) + country code (ISO 3166-1)
- Configuration: `src/data/locale-config.ts`

### Routing Rules

**Redirects**:
```
/ph → /{savedLang}-ph (from localStorage/cookie, default: en)
/contest → /{savedLang}-{savedCc}/contest
/EN-PH → /en-ph (case normalization)
/xx-zz → /en-ph (invalid locale fallback)
```

**Query Preservation**:
- All redirects preserve query parameters
- Example: `/ph?gender=female` → `/en-ph?gender=female`

**Guards**:
- `LocaleGuard`: Normalizes case, validates locale
- `normalizeLocale()`: Safe locale resolution
- `parseLocaleTuple()`: Parse to `{ lang, cc }`

### SEO Best Practices

**Canonical URLs**:
- Always include locale prefix
- No trailing slashes
- Example: `https://obcface.com/en-ph/contest`

**Hreflang Tags**:
- Auto-generated from `PRIORITY_LOCALES`
- Include `x-default` pointing to `/en-ph`
- Format: `en-PH`, `ru-KZ` (language-COUNTRY)

---

## URL Filters

### Filter Parameters
- `gender`: `male` | `female` | `all`
- `age`: `18-25` | `26-35` | `36-45` | `46+`
- `view`: `compact` | `full` | `table`
- `height`: `150-160 cm` | `160-170 cm` | etc.
- `weight`: `50-60 kg` | `60-70 kg` | etc.
- `marital`: `single` | `married` | `divorced` | `all`
- `children`: `yes` | `no` | `all`

### Utilities

```typescript
// src/utils/urlFilters.ts
patchSearchParams(sp, { gender: 'female', age: '' }); // Updates safely
getFilterParam(sp, 'gender', 'all'); // Get with default
parseAgeRange('18-25'); // → [18, 25]
parseHeightRange('150-160 cm'); // → [150, 160]
parseWeightRange('50-60 kg'); // → [50, 60]
```

### Behavior
- Changing filters updates URL (enables sharing)
- Browser back/forward restores filter state
- Direct URLs load with filters applied
- Empty/"all" values removed from URL

---

## Performance Optimizations

### Batch Loading
```typescript
// Instead of N individual requests
const stats = await getRatingStatsBulk([id1, id2, id3, ...]);

// Returns: RatingStat[]
interface RatingStat {
  participant_id: string;
  average_rating: number;
  total_votes: number;
}
```

**Benefits**:
- Reduces requests from N to 1
- Lower latency
- Better caching
- Reduced database load

### Virtualization
```tsx
// src/components/performance/VirtualizedList.tsx
<VirtualizedList
  itemCount={contestants.length}
  itemSize={340} // px per card
  overscan={6} // extra items to render
  renderItem={(i) => <ContestantCard contestant={contestants[i]} />}
/>
```

**When to Use**:
- Lists with >50 items
- Improves scroll performance
- Reduces DOM nodes (only visible + overscan rendered)

### Image Optimization
- Lazy loading via `LazyImage` component
- Modern formats (WebP, AVIF) where supported
- Responsive images with srcset
- Blur placeholder while loading

### React Optimizations
- `React.memo()` for expensive components
- `useCallback()` for stable handlers
- `useMemo()` for computed values
- Avoid inline objects/functions in JSX

---

## CI/CD Pipeline

### GitHub Actions Workflow

**PR Checks**:
1. Lint & Type Check
2. Unit Tests (with coverage)
3. Build
4. E2E Tests (against preview)

**Main Branch (after merge)**:
1. Unit Tests
2. Build
3. E2E Tests (staging)
4. Deploy to production

### Caching Strategy
- **pnpm**: `~/.pnpm-store`
- **Playwright browsers**: `~/.cache/ms-playwright`
- **Build artifacts**: Shared between jobs

### Artifacts
- Vitest coverage (30 days retention)
- Playwright reports (30 days retention)
- Playwright traces/videos (30 days, failures only)
- Build output (7 days retention)

### Environment Variables

**CI Secrets** (GitHub):
- `TURNSTILE_SITE_KEY_TEST`: Test site key
- `TURNSTILE_SECRET_TEST`: Test secret key
- `STAGING_URL`: Staging environment URL
- `CODECOV_TOKEN`: Code coverage reporting (optional)

---

## Database Schema

### Key Tables

**participants**:
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `first_name`, `display_name`
- `age`, `gender`, `country`, `city`
- `height_cm`, `weight_kg`
- `marital_status`, `has_children`
- `photo_1_url`, `photo_2_url`
- `status` (pending, approved, rejected, etc.)
- `week_number`, `year`

**ratings**:
- `id` (uuid, PK)
- `participant_id` (uuid, FK)
- `user_id` (uuid, FK)
- `score` (1-5)
- `created_at`

**rating_stats** (materialized view):
- `participant_id`
- `average_rating`
- `total_votes`
- Refreshed periodically

### RLS Policies
- Users can read public participants
- Users can create/read their own ratings
- Users can read aggregated stats
- Admin can manage all participants

---

## API Endpoints

### Edge Functions

**`/rating/stats-bulk`** (POST):
```typescript
// Request
{
  ids: string[] // participant IDs
}

// Response
{
  participant_id: string;
  average_rating: number;
  total_votes: number;
}[]

// Error codes
400: Invalid request (missing/invalid IDs)
500: Database error
```

**`/vote`** (POST):
```typescript
// Request
{
  participantId: string;
  score: number; // 1-5
  turnstileToken: string;
}

// Response
{ success: true }

// Error codes
400: Invalid input
403: Turnstile verification failed
429: Rate limit exceeded (Retry-After header)
500: Server error
```

---

## Security

### Cloudflare Settings

**WAF (Web Application Firewall)**:
- ✅ Enabled on all routes
- Managed rules: OWASP Core Ruleset
- Custom rules for `/api/*` endpoints

**SSL/TLS**:
- Mode: Full (strict)
- Min TLS version: 1.2
- HSTS: Enabled (max-age=31536000)

**Bot Fight Mode**:
- ✅ Enabled
- Challenge for suspicious traffic

**AI Crawl Control**:
- ✅ Block AI crawlers on all pages
- Allows legitimate SEO bots (Google, Bing)

### Best Practices
- Never commit secrets to git
- Use environment variables for API keys
- Rotate Turnstile keys periodically
- Monitor 403/429 rates for attacks
- Keep dependencies updated

---

## Monitoring & Observability

### Metrics to Track

**Performance**:
- LCP (Largest Contentful Paint): Target <2.5s
- INP (Interaction to Next Paint): Target <200ms
- CLS (Cumulative Layout Shift): Target <0.1
- TTI (Time to Interactive): Target <3.5s

**API**:
- Request rate (per endpoint)
- Error rate (4xx, 5xx)
- Response time (p50, p95, p99)
- Batch request ratio (should be ~100%)

**Security**:
- 403 rate (failed Turnstile)
- 429 rate (rate limits hit)
- Geographic distribution of blocks
- Unusual IP patterns

### Logging

**Frontend** (Sentry):
- JavaScript errors
- API failures
- Performance metrics

**Backend** (Supabase logs):
- Edge function errors
- Database query performance
- Auth failures

---

## Incident Response

### Quick Steps

**High Error Rate (5xx)**:
1. Check Supabase status page
2. Review recent deployments (rollback if needed)
3. Check database query logs
4. Scale edge functions if needed

**Rate Limit Flood (429)**:
1. Check Cloudflare Analytics for source IPs
2. Temporarily increase Turnstile challenge level
3. Add temporary WAF rules for offending IPs
4. Review rate limit thresholds

**Turnstile Outage**:
1. Check Cloudflare status
2. Consider temporary bypass (with strict rate limits)
3. Notify users via status banner

**Database Performance**:
1. Check slow query logs
2. Verify indexes on filtered columns
3. Refresh materialized views if stale
4. Consider read replicas for heavy traffic

### Rollback Procedure

**Lovable**:
1. Navigate to project versions
2. Select last known good version
3. Click "Restore"

**GitHub Actions**:
1. Identify last green deployment
2. Revert merge commit or cherry-pick fix
3. Push to main branch
4. Monitor deployment

---

## Common Tasks

### Add New Locale

1. Add to `src/data/locale-config.ts`:
```typescript
{
  locale: 'fr-fr',
  languageCode: 'fr',
  countryCode: 'FR',
  countryName: 'France',
  languageName: 'Français',
  flag: '🇫🇷',
}
```

2. Add translations in `src/translations/fr.ts`
3. Update `PRIORITY_LOCALES` if needed
4. Test routing and SEO

### Add New Filter

1. Add to `ContestFilters` type in `src/features/contest/types/index.ts`
2. Update `ContestFilters` component
3. Add parsing logic in `src/utils/urlFilters.ts`
4. Update `useContestantsWithFilters` hook
5. Add tests

### Deploy to Production

See `RELEASE_CHECKLIST.md` for full checklist.

Quick deploy:
```bash
pnpm build && pnpm test && pnpm e2e:preview
# If green, push to main
git push origin main
```

---

## Useful Commands

### Development
```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm type-check       # Type check without building
pnpm lint             # Run ESLint
```

### Testing
```bash
pnpm test             # Run unit tests
pnpm test:watch       # Run in watch mode
pnpm test:ui          # Open Vitest UI
pnpm test:coverage    # Generate coverage report
pnpm test:e2e         # Run E2E tests
pnpm test:e2e:headed  # Run E2E with browser visible
pnpm e2e:preview      # Build + preview + E2E
```

### Database
```bash
# Via Supabase CLI (if connected to external Supabase)
supabase db diff       # Generate migration from changes
supabase db push       # Apply migrations
supabase db reset      # Reset local database

# Via Lovable Cloud
# Use the built-in database UI
```

---

## Contacts & Resources

### Documentation
- This playbook: `docs/OPERATIONAL_PLAYBOOK.md`
- Testing guide: `TESTING_GUIDE.md`
- Turnstile integration: `docs/TURNSTILE_INTEGRATION.md`
- Release checklist: `RELEASE_CHECKLIST.md`
- Pre-push checklist: `PRE_PUSH_CHECKLIST.md`

### External Links
- [Lovable Docs](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Playwright Docs](https://playwright.dev/)
- [Vitest Docs](https://vitest.dev/)

### Support
- Lovable Discord: [Join](https://discord.com/channels/1119885301872070706/1280461670979993613)
- Project Team: [Internal team channel]
- On-call: [Rotation schedule]

---

**Last Updated**: 2025-01-11  
**Version**: 1.0  
**Maintainer**: Engineering Team
