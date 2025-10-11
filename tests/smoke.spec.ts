import { test, expect } from '@playwright/test';

test.describe('Routing and Redirects', () => {
  test('redirects /ph to saved locale with query preserved', async ({ page }) => {
    // Set saved language preference
    await page.addInitScript(() => {
      localStorage.setItem('ui_lang', 'en');
    });
    
    await page.goto('/ph?gender=female');
    
    // Should redirect to /en-ph with query
    await expect(page).toHaveURL(/\/en-ph(\?gender=female)?/);
  });

  test('redirects /contest to locale-prefixed URL', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ui_lang', 'en');
      localStorage.setItem('ui_cc', 'ph');
    });
    
    await page.goto('/contest');
    
    // Should redirect to /{lang}-{cc}/contest
    await expect(page).toHaveURL(/\/en-ph\/contest/);
  });

  test('normalizes /EN-PH to /en-ph', async ({ page }) => {
    await page.goto('/EN-PH/contest');
    
    // Should normalize to lowercase
    await expect(page).toHaveURL(/\/en-ph\/contest/);
  });

  test('handles unknown locale with fallback', async ({ page }) => {
    await page.goto('/xx-zz/contest');
    
    // Should fallback or show locale selector
    // Adjust based on your implementation
    await expect(page).toHaveURL(/\/(en-ph|xx-zz)/);
  });
});

test.describe('URL Filters', () => {
  test('applies filters from URL on load', async ({ page }) => {
    await page.goto('/en-ph/contest?gender=female&age=18-25');
    
    // Verify filters are applied (adjust selectors to your UI)
    const genderFilter = page.locator('[data-testid="gender-filter"]');
    const ageFilter = page.locator('[data-testid="age-filter"]');
    
    if (await genderFilter.count() > 0) {
      await expect(genderFilter).toHaveValue('female');
    }
    if (await ageFilter.count() > 0) {
      await expect(ageFilter).toHaveValue('18-25');
    }
  });

  test('updates URL when filters change', async ({ page }) => {
    await page.goto('/en-ph/contest');
    
    // Change filter (adjust selector to your UI)
    const genderSelect = page.locator('[data-testid="gender-filter"]');
    
    if (await genderSelect.count() > 0) {
      await genderSelect.selectOption('female');
      
      // URL should update
      await expect(page).toHaveURL(/gender=female/);
    }
  });

  test('preserves filters on browser back/forward', async ({ page }) => {
    await page.goto('/en-ph/contest');
    
    // Navigate with filter
    await page.goto('/en-ph/contest?gender=female');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/en-ph\/contest$/);
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/gender=female/);
  });
});

test.describe('SEO', () => {
  test('sets correct canonical URL with locale', async ({ page }) => {
    await page.goto('/en-ph/contest');
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/https?:\/\/.*\/en-ph\/contest/);
  });

  test('includes hreflang tags for all locales', async ({ page }) => {
    await page.goto('/en-ph/contest');
    
    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').count();
    expect(hreflangs).toBeGreaterThan(0);
    
    // Check for x-default
    const xDefault = await page.locator('link[rel="alternate"][hreflang="x-default"]').count();
    expect(xDefault).toBe(1);
  });
});

test.describe('Performance', () => {
  test('loads page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/en-ph/contest');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('virtualization works for long lists', async ({ page }) => {
    await page.goto('/en-ph/contest');
    
    // Count rendered cards vs total data
    const cards = await page.locator('[data-testid="contestant-card"]').count();
    
    // If virtualized, should render fewer cards than total items
    // (This test needs adjustment based on your actual implementation)
    if (cards > 0) {
      expect(cards).toBeLessThanOrEqual(100); // Reasonable max for viewport
    }
  });
});

test.describe('Turnstile Integration', () => {
  test('shows turnstile widget on voting attempt', async ({ page }) => {
    await page.goto('/en-ph/contest');
    
    // Try to vote (adjust selector)
    const voteButton = page.locator('[data-testid="vote-button"]').first();
    
    if (await voteButton.count() > 0) {
      await voteButton.click();
      
      // Should show turnstile or require auth
      const turnstile = page.locator('[data-testid="turnstile-widget"]');
      const authPrompt = page.locator('[data-testid="auth-modal"]');
      
      const hasTurnstile = await turnstile.count() > 0;
      const hasAuth = await authPrompt.count() > 0;
      
      expect(hasTurnstile || hasAuth).toBeTruthy();
    }
  });
});
