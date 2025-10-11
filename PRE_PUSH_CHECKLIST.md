# Pre-Push Checklist

Run these checks before pushing to ensure code quality and stability.

## Quick Checks (< 2 min)

```bash
# Type check
npm run type-check || npx tsc --noEmit

# Lint check
npm run lint || npx eslint src/

# Build check
npm run build
```

## Unit Tests (< 1 min)

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode during development
npm run test:watch
```

## E2E Smoke Tests (< 3 min)

```bash
# Build and run E2E tests
npm run build
npm run preview &
npx wait-on http://localhost:4173
npm run test:e2e

# Or use the combined command (requires concurrently)
npm run e2e:preview
```

## Manual Smoke Tests

### Routing & Redirects
- [ ] `/ph` redirects to `/en-ph` (or saved locale)
- [ ] `/contest` redirects to `/{lang}-{cc}/contest`
- [ ] `/EN-PH/contest` normalizes to `/en-ph/contest`
- [ ] `/xx-zz/contest` shows fallback or redirects to default

### URL Filters
- [ ] Changing filters updates URL (`?gender=female&age=18-25`)
- [ ] Browser back/forward preserves filter state
- [ ] Direct URL with filters loads correctly
- [ ] "Clear filters" removes URL params

### SEO
- [ ] Canonical URL includes locale prefix
- [ ] Hreflang tags present for all locales
- [ ] x-default hreflang points to default locale
- [ ] No duplicate canonicals

### Performance
- [ ] Pages load in < 3s (mobile)
- [ ] Large lists use virtualization (check DOM count)
- [ ] No console errors or warnings
- [ ] Network tab shows batch rating requests (not N individual calls)

### Security
- [ ] Turnstile widget appears on vote/login
- [ ] Invalid token returns 403
- [ ] Rate limiting triggers 429 with Retry-After

## Coverage Goals

Target coverage thresholds:
- Lines: 60%+
- Functions: 60%+
- Branches: 60%+
- Statements: 60%+

Check with:
```bash
npm run test -- --coverage
```

## Build Size Check

Ensure bundle sizes are reasonable:

```bash
npm run build
ls -lh dist/assets/*.js

# Target: Main bundle < 500KB, vendor bundle < 1MB
```

## Pre-Release Checklist

Before deploying to production:

- [ ] All tests pass (unit + E2E)
- [ ] Coverage meets thresholds
- [ ] Build completes without warnings
- [ ] Lighthouse score > 90 (Performance)
- [ ] No console errors in production build
- [ ] SEO tags validated with tools
- [ ] Mobile responsiveness tested
- [ ] Rate limiting tested
- [ ] Error boundaries working

## CI/CD Status

Verify GitHub Actions pass:
- ✅ Lint & Type Check
- ✅ Unit Tests
- ✅ E2E Tests
- ✅ Build

## Useful Commands

```bash
# Install all test dependencies
npm install -D vitest @vitest/ui @vitest/coverage-v8 @playwright/test \
  @testing-library/react @testing-library/jest-dom jsdom \
  eslint-plugin-security wait-on concurrently

# Add package.json scripts
# (Note: package.json is read-only, add these manually)
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "preview": "vite preview --port 4173",
    "e2e:preview": "concurrently -k 'npm run preview' 'wait-on http://localhost:4173 && npm run test:e2e'",
    "type-check": "tsc --noEmit"
  }
}
```

## Debugging Failed Tests

### Unit Tests
```bash
# Run specific test file
npm run test src/utils/__tests__/urlFilters.test.ts

# Debug mode
npm run test -- --inspect

# UI mode for visual debugging
npm run test:ui
```

### E2E Tests
```bash
# Headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npx playwright test tests/smoke.spec.ts --debug

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Quick Fix Commands

```bash
# Fix linting issues
npx eslint src/ --fix

# Format code
npx prettier --write "src/**/*.{ts,tsx}"

# Clear caches
rm -rf node_modules/.vite
rm -rf dist
npm run build
```
