# Production CI/CD Pipelines with GitHub Actions

> **Difficulty**: Intermediate  
> **Target Outcome**: Implement automated testing, linting, type-checking, and artifact verification in continuous integration.

---

## Production CI Workflow Configuration

Create `.github/workflows/ci.yml`:

```yaml
name: Continuous Integration

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    name: Lint, Typecheck & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js & Cache npm
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Linter & Formatter
        run: npm run lint

      - name: Run Typecheck
        run: npm run typecheck

      - name: Run Unit & Integration Tests
        run: npm test -- --coverage

      - name: Upload Coverage Artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: code-coverage
          path: coverage/
```

---

## CI Pipeline Optimization Strategies

- **Concurrent Run Cancellation**: Utilize `concurrency` to terminate redundant workflows when newer commits are pushed.
- **Dependency Caching**: Cache package manager stores (`npm`, `cargo`, `go-build`, `pip`).
- **Matrix Strategies**: Execute parallel test suites across supported runtime versions and operating systems.

---

## Contributor Challenges
- [ ] Automated Docker image build and push to GitHub Container Registry (GHCR).
- [ ] Automated staging environment preview deployments.
