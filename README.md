<div align="center">

# 🌟 OBC Faces

**Multi-Locale Beauty Contest Platform**

*Real-time voting • Admin management • Performance optimized*

[![CI](https://github.com/your-repo/obc-faces/actions/workflows/ci.yml/badge.svg)](https://github.com/your-repo/obc-faces/actions/workflows/ci.yml)
[![Production Smoke](https://github.com/your-repo/obc-faces/actions/workflows/prod-smoke.yml/badge.svg)](https://github.com/your-repo/obc-faces/actions/workflows/prod-smoke.yml)
[![codecov](https://codecov.io/gh/your-repo/obc-faces/branch/main/graph/badge.svg)](https://codecov.io/gh/your-repo/obc-faces)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5+-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Playwright](https://img.shields.io/badge/E2E-Playwright-2ead33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Unit-Vitest-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev/)

[🚀 Live Demo](https://obcface.com) • [📚 Documentation](./docs/OPERATIONAL_PLAYBOOK.md) • [🧪 Testing Guide](./TESTING_GUIDE.md)

</div>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **pnpm** 9+ (`npm install -g pnpm`)

### Local Development

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Start development server
pnpm dev

# 5. Open http://localhost:5173
```

### Production Preview

```bash
# Build and preview production build
pnpm build
pnpm preview

# Open http://localhost:4173
```

---

## 🧪 Testing

### Run All Checks (Recommended before push)

```bash
pnpm check:all
# Runs: build + test + e2e
```

### Unit Tests

```bash
# Run tests
pnpm test

# Watch mode (development)
pnpm test:watch

# With coverage
pnpm test -- --coverage

# UI mode (visual)
pnpm test:ui
```

### E2E Tests

```bash
# Build + preview + E2E (local)
pnpm e2e:preview

# Run E2E only
pnpm test:e2e

# Headed mode (see browser)
pnpm test:e2e:headed

# UI mode (debug)
npx playwright test --ui
```

### Production Smoke Tests

```bash
# Test against production
BASE_URL=https://obcface.com pnpm test:e2e
```

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Security**: Cloudflare Turnstile (CAPTCHA)
- **Deployment**: Lovable Cloud / Vercel
- **CDN/WAF**: Cloudflare

### Key Features

- ✅ Multi-locale support (en-ph, ru-kz, es-mx, etc.)
- ✅ Weekly beauty contest with voting
- ✅ Real-time statistics and leaderboards
- ✅ Admin panel for participant management
- ✅ Rate limiting and bot protection
- ✅ Image optimization and lazy loading
- ✅ Virtualization for large lists (>50 items)
- ✅ SEO optimization (canonical, hreflang)

### Project Structure

```
src/
├── components/         # Shared UI components
│   ├── ui/            # shadcn/ui components
│   └── performance/   # VirtualizedList, LazyImage
├── features/          # Feature-based modules
│   ├── admin/         # Admin panel
│   ├── auth/          # Authentication
│   ├── contest/       # Contest pages
│   ├── messages/      # Messaging
│   └── profile/       # User profiles
├── hooks/             # Custom React hooks
├── services/          # API services
├── utils/             # Utility functions
├── translations/      # i18n translations
└── data/              # Static data & config
```

---

## 🌐 Locales & Routing

### Locale Pattern

- Format: `/{lang}-{cc}` (e.g., `/en-ph`, `/ru-kz`)
- Language: ISO 639-1 (en, ru, es)
- Country: ISO 3166-1 (ph, kz, mx)
- Config: `src/data/locale-config.ts`

### Routing Rules

```
/ph           → /{savedLang}-ph (redirect with saved locale)
/contest      → /{savedLang}-{savedCc}/contest
/EN-PH        → /en-ph (case normalization)
/xx-zz        → /en-ph (invalid locale fallback)
```

All redirects preserve query parameters.

### SEO

- Canonical URLs include locale prefix
- Hreflang tags auto-generated for all locales
- x-default points to `/en-ph`

---

## 🛡️ Security

### Turnstile (CAPTCHA)

**Test Keys** (for development/CI):

```bash
# Visible challenge (always passes)
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**Production Keys**: Set via Lovable Cloud Secrets or Supabase Edge Function secrets.

See `docs/TURNSTILE_INTEGRATION.md` for full guide.

### Rate Limiting

Protected endpoints:
- `/api/vote` - 10 votes/hour per IP/user
- `/api/login` - 5 attempts/15min per IP
- `/api/register` - 3 attempts/hour per IP

Responses:
- `429 Too Many Requests` with `Retry-After` header
- `403 Forbidden` for invalid Turnstile token

---

## 🚀 Deployment

### Via Lovable (Recommended)

1. Open [Lovable Project](https://lovable.dev/projects/07ca1c3a-7799-47d5-8471-2891fa67d61a)
2. Click **Share** → **Publish**
3. Select environment (staging/production)
4. Confirm deployment

### Via GitHub (CI/CD)

Push to `main` branch triggers automatic deployment:

1. Lint & type check
2. Unit tests with coverage
3. Build
4. E2E tests (staging)
5. Deploy to production

### Custom Domain

Navigate to **Project > Settings > Domains** in Lovable.

Read more: [Custom Domain Setup](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

## 📚 Documentation

### For Developers

- [Testing Guide](TESTING_GUIDE.md) - Unit & E2E tests
- [Operational Playbook](docs/OPERATIONAL_PLAYBOOK.md) - Architecture & operations
- [Turnstile Integration](docs/TURNSTILE_INTEGRATION.md) - CAPTCHA setup
- [Pre-Push Checklist](PRE_PUSH_CHECKLIST.md) - Quick checks
- [Release Checklist](RELEASE_CHECKLIST.md) - Production deployment

### For Operations

- [Smoke Tests Checklist](SMOKE_TESTS_CHECKLIST.md) - Manual testing
- [CI/CD Pipeline](.github/workflows/ci.yml) - Automated checks

---

## 🧰 Useful Commands

### Development

```bash
pnpm dev              # Start dev server (http://localhost:5173)
pnpm build            # Build for production
pnpm preview          # Preview production build (http://localhost:4173)
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
pnpm check:all        # Run all checks (build + test + e2e)
pnpm ci:local         # Simulate CI locally
```

### Database (if using Supabase CLI)

```bash
supabase db diff      # Generate migration from changes
supabase db push      # Apply migrations
supabase db reset     # Reset local database
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Locale
DEFAULT_LOCALE=en-ph

# API
VITE_API_BASE_URL=http://localhost:5173

# Turnstile (use test keys for development)
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Testing
BASE_URL=http://localhost:4173
```

**Production**: Use Lovable Cloud Secrets or Supabase Edge Function secrets for sensitive keys.

---

## 🤝 Contributing

### Pre-Push Checks

Git hooks automatically run:
- Type check
- Linting
- Build
- Unit tests

To bypass (not recommended):
```bash
git push --no-verify
```

### Pull Request Process

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push: `git push origin feature/my-feature`
4. Create PR on GitHub
5. Wait for CI checks to pass
6. Request review
7. Merge after approval

CI automatically:
- Runs all tests
- Generates coverage reports
- Creates Playwright reports
- Comments results on PR

---

## 📊 Performance

### Optimizations

- **Batch Loading**: Single request for rating stats (not N requests)
- **Virtualization**: Lists >50 items use virtual scrolling
- **Lazy Loading**: Images load on demand
- **Code Splitting**: Route-based splitting
- **React Optimizations**: `memo`, `useCallback`, `useMemo`

### Targets

- LCP (Largest Contentful Paint): <2.5s
- INP (Interaction to Next Paint): <200ms
- CLS (Cumulative Layout Shift): <0.1
- Bundle size: Main <500KB, Vendor <1MB

---

## 📄 License

This project is proprietary and confidential.

---

## 🙏 Support

### Resources

- [Lovable Documentation](https://docs.lovable.dev/)
- [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

### Project Links

- **Lovable Project**: https://lovable.dev/projects/07ca1c3a-7799-47d5-8471-2891fa67d61a
- **Production**: https://obcface.com
- **Staging**: ${STAGING_URL} (if applicable)

---

**Built with ❤️ using [Lovable](https://lovable.dev)**
