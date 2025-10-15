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

- ✅ Row-Level Security (RLS) on all Supabase tables
- ✅ Secure authentication with JWT tokens
- ✅ HTTPS-only communication
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization
- ✅ SQL injection protection via parameterized queries
- ✅ XSS protection through React's built-in escaping
- ✅ CORS policies for API access
- ✅ Environment variable protection (.env not in git)
- ✅ Dependency scanning (GitHub Dependabot)
- ✅ Regular security audits

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
