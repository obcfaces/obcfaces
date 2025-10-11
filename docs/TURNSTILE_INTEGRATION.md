# Turnstile Integration Guide

## Overview

This project uses Cloudflare Turnstile for bot protection on critical actions:
- User registration
- Login attempts
- Voting
- Form submissions

## Test Keys

Cloudflare provides test keys that **always pass** verification without requiring user interaction:

### Visible Challenge (always passes)
```
Site Key: 1x00000000000000000000AA
Secret: 1x0000000000000000000000000000000AA
```

### Invisible Challenge (always passes)
```
Site Key: 2x00000000000000000000AB
Secret: 2x0000000000000000000000000000000AB
```

### Force Failure (for testing error handling)
```
Site Key: 3x00000000000000000000FF
Secret: 3x0000000000000000000000000000000FF
```

## Environment Setup

### Development (.env.local)
```bash
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

### CI/CD (GitHub Secrets)
Add these to your GitHub repository secrets:
- `TURNSTILE_SITE_KEY_TEST`: `1x00000000000000000000AA`
- `TURNSTILE_SECRET_TEST`: `1x0000000000000000000000000000000AA`

### Production
Get real keys from [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile):

1. Go to Turnstile section
2. Add new site
3. Configure domain and widget mode
4. Copy Site Key and Secret Key
5. Add to production environment:
   - Lovable Cloud: Use Secrets Manager
   - Supabase: Add to Edge Function secrets

```bash
# Production (via Lovable/Supabase secrets)
VITE_TURNSTILE_SITE_KEY=your_real_site_key
TURNSTILE_SECRET_KEY=your_real_secret_key
```

## Client Integration

### VotingWithTurnstile Component
```tsx
import { TurnstileWidget } from '@/components/TurnstileWidget';

<TurnstileWidget
  action="vote"
  onVerify={(token) => {
    // Submit vote with token
    submitVote({ participantId, score, turnstileToken: token });
  }}
  onError={(error) => {
    toast.error('Verification failed. Please try again.');
  }}
/>
```

### Widget Configuration
```tsx
<TurnstileWidget
  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
  action="vote"
  theme="auto" // auto | light | dark
  size="normal" // normal | compact
  onVerify={handleVerify}
  onError={handleError}
  onExpire={handleExpire}
/>
```

## Backend Verification

### Edge Function (Supabase)
```typescript
// supabase/functions/verify-vote/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: ip,
      }),
    }
  );

  const data: TurnstileResponse = await response.json();
  return data.success;
}

serve(async (req) => {
  const { turnstileToken, participantId, score } = await req.json();
  const clientIp = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

  // Verify Turnstile token
  const isValid = await verifyTurnstile(turnstileToken, clientIp);
  
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Captcha verification failed' }),
      { status: 403 }
    );
  }

  // Process vote...
  // Rate limiting...
  // Database update...

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200 }
  );
});
```

## Testing

### Unit Tests (Mock Turnstile)
```typescript
// __tests__/voting.test.ts
import { vi } from 'vitest';

vi.mock('@/components/TurnstileWidget', () => ({
  TurnstileWidget: ({ onVerify }: any) => (
    <button onClick={() => onVerify('mock-token')}>
      Mock Verify
    </button>
  ),
}));

test('submits vote with turnstile token', async () => {
  render(<VotingWithTurnstile />);
  
  fireEvent.click(screen.getByText('Mock Verify'));
  
  await waitFor(() => {
    expect(mockSubmitVote).toHaveBeenCalledWith(
      expect.objectContaining({ turnstileToken: 'mock-token' })
    );
  });
});
```

### E2E Tests (Playwright)
```typescript
// tests/smoke.spec.ts
test('handles turnstile verification on vote', async ({ page }) => {
  await page.goto('/en-ph/contest');
  
  // Click vote button
  await page.click('[data-testid="vote-button"]');
  
  // In test environment, widget should auto-pass
  const turnstile = page.locator('[data-testid="turnstile-widget"]');
  await expect(turnstile).toBeVisible();
  
  // Wait for auto-verification (test keys auto-pass)
  await page.waitForResponse(
    (response) => response.url().includes('/api/vote') && response.status() === 200
  );
});

test('shows error for invalid turnstile token', async ({ page }) => {
  // Mock backend to return 403
  await page.route('**/api/vote', (route) =>
    route.fulfill({ status: 403, body: JSON.stringify({ error: 'captcha_failed' }) })
  );
  
  await page.goto('/en-ph/contest');
  await page.click('[data-testid="vote-button"]');
  
  // Should show error message
  await expect(page.locator('text=Verification failed')).toBeVisible();
});
```

## Error Handling

### Common Error Codes
- `missing-input-secret`: Secret key missing
- `invalid-input-secret`: Invalid secret key
- `missing-input-response`: Token missing
- `invalid-input-response`: Invalid token
- `timeout-or-duplicate`: Token already used or expired

### Client Error Handling
```tsx
const handleError = (error: string) => {
  console.error('Turnstile error:', error);
  
  switch (error) {
    case 'timeout-or-duplicate':
      toast.error('Verification expired. Please try again.');
      break;
    case 'invalid-input-response':
      toast.error('Invalid verification. Please refresh and try again.');
      break;
    default:
      toast.error('Verification failed. Please try again.');
  }
};
```

## Rate Limiting with Turnstile

Combine Turnstile with rate limiting for robust protection:

```typescript
// Edge function
async function handleVote(req: Request) {
  const clientIp = getClientIp(req);
  const { turnstileToken, participantId } = await req.json();

  // 1. Verify Turnstile
  const isValidTurnstile = await verifyTurnstile(turnstileToken, clientIp);
  if (!isValidTurnstile) {
    return new Response(
      JSON.stringify({ error: 'captcha_failed' }),
      { status: 403 }
    );
  }

  // 2. Check rate limit
  const { allowed, retryAfter } = await checkRateLimit(clientIp);
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'rate_limited', retryAfter }),
      { 
        status: 429,
        headers: { 'Retry-After': String(retryAfter) }
      }
    );
  }

  // 3. Process vote
  await submitVote({ participantId, ip: clientIp });
  
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200 }
  );
}
```

## Monitoring

Track Turnstile metrics:
- Verification success rate
- Failed verifications by error code
- Average verification time
- Bot detection rate

```typescript
// Log verification events
await logEvent('turnstile_verification', {
  success: isValid,
  errorCodes: response['error-codes'],
  ip: clientIp,
  action: 'vote',
  timestamp: Date.now(),
});
```

## Best Practices

1. **Never expose secret key in client code**
   - Use environment variables
   - Keep in backend/edge functions only

2. **Use test keys in CI/CD**
   - Prevents hitting verification limits
   - Faster test execution

3. **Handle token expiration**
   - Tokens expire after 5 minutes
   - Refresh widget on expiration

4. **Combine with rate limiting**
   - Turnstile prevents bots
   - Rate limiting prevents abuse

5. **Monitor verification failures**
   - Track error patterns
   - Alert on spike in failures

6. **Graceful degradation**
   - Show fallback if widget fails to load
   - Don't block legitimate users

## Resources

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Test Keys Documentation](https://developers.cloudflare.com/turnstile/reference/testing/)
- [Verification API](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
