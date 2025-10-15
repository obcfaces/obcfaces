# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability or potential security issue in OBC Faces, please report it responsibly:

### How to Report

- **Email**: security@obcfaces.com
- **Subject**: [SECURITY] Brief description of the issue
- **Include**:
  - Detailed description of the vulnerability
  - Steps to reproduce the issue
  - Potential impact assessment
  - Any suggested fixes or mitigations (if available)

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Assessment**: Our team will assess the vulnerability and determine its severity
3. **Updates**: We will keep you informed of our progress
4. **Resolution**: We aim to resolve critical issues within 7 days
5. **Disclosure**: We will coordinate disclosure timing with you

### Security Best Practices

This project implements:

#### Database & Backend
- ✅ Row-Level Security (RLS) on all Supabase tables with `SECURITY DEFINER` functions
- ✅ Secure authentication with JWT tokens (OAuth + Email)
- ✅ Automated weekly transitions via `pg_cron` (no hardcoded secrets)
- ✅ RPC functions for privileged operations (no direct HTTP calls)
- ✅ SQL injection protection via parameterized queries
- ✅ Storage policies for participant photos (public read, authenticated write)

#### Frontend & API
- ✅ HTTPS-only communication
- ✅ Rate limiting on sensitive endpoints (vote, login, registration)
- ✅ Cloudflare Turnstile (CAPTCHA) for bot protection
- ✅ Input validation and sanitization (client + server)
- ✅ XSS protection through React's built-in escaping
- ✅ CORS policies for API access

#### DevOps & CI/CD
- ✅ Environment variable protection (.env excluded from git)
- ✅ GitHub secret scanning (Gitleaks + TruffleHog)
- ✅ Dependency scanning (GitHub Dependabot)
- ✅ Required checks: lint, typecheck, test (unit + E2E)
- ✅ Branch protection on `main` (PR required, CI must pass)
- ✅ Pre-push hooks (Husky): type-check → lint → build → test

#### Secrets Management
- ✅ Production keys via Supabase Edge Function secrets (not in code)
- ✅ Test keys for CI/local development (Turnstile, etc.)
- ✅ `.env` excluded from repository (only `.env.example` committed)

#### Architecture
- ✅ Layered data access: UI → hooks → services → data → RPC/views
- ✅ User roles in separate table (`user_roles`, not on `profiles`)
- ✅ Admin checks via `has_role()` RLS function (prevents privilege escalation)

### Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

### Out of Scope

The following are explicitly out of scope for security reports:

- Issues in third-party dependencies (report to the upstream project)
- Social engineering attacks
- Physical security of user devices
- Denial of Service (DoS) attacks
- Issues affecting outdated browsers

## Thank You

We appreciate the security research community's efforts to improve the security of our platform. Responsible disclosure helps us keep our users safe.
