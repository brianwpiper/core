# Dependency Audit Guide

This document provides a comprehensive framework for auditing dependencies for **outdated packages**, **security vulnerabilities**, and **unnecessary bloat**.

---

## Quick Reference

| Concern | Tool | Command |
|---------|------|---------|
| Outdated (Node.js) | npm | `npm outdated` |
| Outdated (Python) | pip-review | `pip-review --local` |
| Outdated (Go) | go-mod-outdated | `go list -u -m all` |
| Vulnerabilities (Node.js) | npm audit | `npm audit` |
| Vulnerabilities (Python) | safety | `safety check` |
| Vulnerabilities (General) | Snyk | `snyk test` |
| Bundle Size (Node.js) | bundlephobia | Online or `npx bundlephobia-cli` |
| Unused Deps (Node.js) | depcheck | `npx depcheck` |

---

## 1. Security Vulnerability Scanning

### Node.js Projects

```bash
# Built-in npm audit
npm audit

# Fix automatically where possible
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force

# Generate JSON report
npm audit --json > audit-report.json
```

**Recommended Tools:**
- **Snyk** - `npm install -g snyk && snyk test`
- **OWASP Dependency-Check** - Comprehensive CVE scanning
- **Socket.dev** - Supply chain attack detection

### Python Projects

```bash
# Using safety (PyUp.io database)
pip install safety
safety check -r requirements.txt

# Using pip-audit (official Python advisory database)
pip install pip-audit
pip-audit

# Using bandit for code security
pip install bandit
bandit -r .
```

### Go Projects

```bash
# Built-in vulnerability check
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
```

### Rust Projects

```bash
# Using cargo-audit
cargo install cargo-audit
cargo audit
```

### CI/CD Integration

Add to GitHub Actions:

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Node.js
      - name: npm audit
        run: npm audit --audit-level=moderate

      # Or use GitHub's built-in Dependabot
```

---

## 2. Outdated Package Detection

### Node.js

```bash
# Check for outdated packages
npm outdated

# Interactive update tool
npx npm-check-updates -i

# Update all to latest (caution: may break)
npx npm-check-updates -u && npm install
```

**Best Practices:**
- Pin exact versions in production: `"lodash": "4.17.21"` not `"^4.17.21"`
- Use lock files (`package-lock.json`, `yarn.lock`)
- Update dependencies in a separate PR for easier rollback

### Python

```bash
# Using pip-review
pip install pip-review
pip-review --local

# Interactive update
pip-review --local --interactive

# Using pip-tools for dependency management
pip install pip-tools
pip-compile --upgrade requirements.in
```

### Go

```bash
# List available updates
go list -u -m all

# Update all dependencies
go get -u ./...
go mod tidy
```

### Automation with Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      minor-and-patch:
        update-types:
          - "minor"
          - "patch"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

---

## 3. Bloat Reduction

### Identifying Unused Dependencies

**Node.js:**
```bash
# Find unused dependencies
npx depcheck

# Analyze what's using space
npx npm-size

# Check specific package size
npx bundlephobia-cli lodash
```

**Python:**
```bash
# Find unused imports/dependencies
pip install vulture
vulture . --min-confidence 80
```

### Bundle Size Analysis

**Node.js Frontend Projects:**
```bash
# Webpack bundle analyzer
npm install --save-dev webpack-bundle-analyzer

# For Next.js
ANALYZE=true npm run build

# Online tool
# Visit: https://bundlephobia.com/
```

### Common Bloat Sources

| Issue | Solution |
|-------|----------|
| `moment.js` (329kb) | Use `date-fns` (13kb) or `dayjs` (2kb) |
| `lodash` full (71kb) | Import specific: `lodash/get` or use `lodash-es` |
| `axios` (29kb) | Use native `fetch` or `ky` (3kb) |
| Multiple icon libraries | Pick one, tree-shake |
| `@babel/polyfill` | Use `core-js` with targets |

### Tree Shaking Checklist

- [ ] Use ES modules (`import/export`) not CommonJS (`require`)
- [ ] Set `"sideEffects": false` in package.json where applicable
- [ ] Use production builds (`NODE_ENV=production`)
- [ ] Avoid importing entire libraries: `import { get } from 'lodash'`

---

## 4. Dependency Hygiene Checklist

### Before Adding a Dependency

- [ ] **Is it necessary?** Can native APIs or existing deps solve this?
- [ ] **Is it maintained?** Check last commit, open issues, downloads
- [ ] **Is it secure?** Check Snyk/npm audit advisories
- [ ] **Is it small?** Check bundle size on bundlephobia
- [ ] **Is it tree-shakeable?** Supports ES modules?

### Regular Maintenance

| Frequency | Task |
|-----------|------|
| Weekly | Run `npm audit` / `safety check` |
| Monthly | Check for outdated packages |
| Quarterly | Deep dependency review, remove unused |
| Per PR | Automated security scanning in CI |

### Recommended package.json Scripts

```json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "outdated": "npm outdated",
    "deps:check": "npx depcheck",
    "deps:size": "npx npm-size",
    "deps:update": "npx npm-check-updates -i"
  }
}
```

---

## 5. Red Flags to Watch For

### Security

- Dependencies with known CVEs that haven't been patched
- Packages with very few downloads (potential typosquatting)
- Packages that request excessive permissions
- Dependencies that haven't been updated in > 2 years

### Bloat

- Importing entire libraries for single functions
- Multiple packages solving the same problem
- Development dependencies in production bundles
- Polyfills for features your target supports natively

### Maintenance

- Deprecated packages still in use
- Packages with no license or restrictive licenses
- Direct dependencies that should be dev dependencies

---

## 6. Example Audit Report Template

```markdown
## Dependency Audit Report - [Date]

### Summary
- Total dependencies: X
- Direct: X | Transitive: X
- Security issues: X critical, X high, X moderate
- Outdated packages: X

### Critical Security Issues
| Package | Vulnerability | Severity | Fix Version |
|---------|--------------|----------|-------------|
| example | CVE-XXXX-XXXX | Critical | 2.0.0 |

### Recommended Removals (Unused/Bloat)
| Package | Reason | Size Saved |
|---------|--------|------------|
| moment | Replace with dayjs | ~320kb |

### Recommended Updates
| Package | Current | Latest | Breaking? |
|---------|---------|--------|-----------|
| lodash | 4.17.15 | 4.17.21 | No |

### Action Items
1. [ ] Fix critical vulnerabilities immediately
2. [ ] Schedule major version updates
3. [ ] Remove unused dependencies
```

---

## Quick Start Commands

Run this one-liner to get a quick dependency health check:

```bash
# Node.js quick audit
npm audit && npm outdated && npx depcheck

# Python quick audit
pip-audit && safety check && pip-review --local
```

---

*This guide should be reviewed and updated quarterly to reflect new tools and best practices.*
