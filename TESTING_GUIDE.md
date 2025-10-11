# Testing Guide

## Overview

This project uses **Vitest** for unit/integration tests and **Playwright** for end-to-end smoke tests.

## Unit Tests (Vitest)

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

Tests are co-located with the code they test in `__tests__` directories:

- `src/utils/__tests__/` - Utility function tests
- `src/hooks/__tests__/` - React hook tests
- `src/components/__tests__/` - Component tests

### Writing Tests

```typescript
import { describe, test, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  test('does something', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

## E2E Tests (Playwright)

### Running Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/smoke.spec.ts
```

### Test Coverage

Smoke tests cover:
- ✅ Routing and redirects (/cc, /contest, locale normalization)
- ✅ URL filter synchronization
- ✅ SEO (canonical, hreflang)
- ✅ Performance (load time, virtualization)
- ✅ Turnstile integration

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('feature works correctly', async ({ page }) => {
  await page.goto('/en-ph/contest');
  await expect(page).toHaveURL(/\/en-ph\/contest/);
});
```

## Test Data IDs

Use `data-testid` attributes for reliable element selection:

```tsx
<button data-testid="vote-button">Vote</button>
```

```typescript
const button = page.locator('[data-testid="vote-button"]');
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage for utilities and hooks
- **Integration Tests**: Critical user flows
- **E2E Tests**: Smoke tests for major features

## CI/CD Integration

Tests run automatically in CI:
- Unit tests on every push
- E2E tests on PRs and main branch
- Coverage reports uploaded to coverage service

## Best Practices

1. **Keep tests fast** - Mock external dependencies
2. **Test behavior, not implementation** - Focus on user-facing functionality
3. **Use meaningful test names** - Describe what is being tested
4. **Avoid test interdependence** - Each test should be independent
5. **Clean up after tests** - Reset state, clear mocks

## Debugging

```bash
# Run tests in debug mode
npm run test -- --inspect

# Run Playwright in headed mode
npx playwright test --headed

# Generate Playwright trace
npx playwright test --trace on
```

## Common Issues

### Vitest

- **Module not found**: Check path aliases in `vitest.config.ts`
- **DOM not available**: Ensure `environment: 'jsdom'` in config

### Playwright

- **Timeout errors**: Increase timeout or wait for specific conditions
- **Flaky tests**: Add explicit waits, check for race conditions
- **Screenshots**: Check `test-results/` directory for failure screenshots
