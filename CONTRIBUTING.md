# Contributing to Aura

Thank you for your interest in contributing to **Aura**. The goal of this project is to build an open-source engineering handbook that establishes rigorous standards for developer productivity, software craftsmanship, and production-grade architectures.

---

## Ways to Contribute

- **Author New Guides**: Choose an open topic from any track syllabus marked with `[TODO: Open for Contribution]`.
- **Refine Existing Best Practices**: Update outdated CLI flags, improve configurations, or add clearer architectural diagrams.
- **Provide Toolchain Blueprints**: Add verified configurations, keyboard mappings, and debugging playbooks.
- **Fix Errors and Broken Links**: Ensure the knowledge base remains accurate and reliable.
- **Propose New Tracks and Topics**: Open an issue using the [New Guide Proposal](.github/ISSUE_TEMPLATE/01_new_guide.yml) template.

---

## Contribution Workflow

### Step 1: Fork and Clone

1. Fork the repository on GitHub: `https://github.com/MasterZ1311/Aura/fork`
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Aura.git
   cd Aura
   ```
3. Set upstream remote to sync with latest changes:
   ```bash
   git remote add upstream https://github.com/MasterZ1311/Aura.git
   git fetch upstream
   ```

### Step 2: Create a Feature Branch

Create a descriptive branch name adhering to our naming convention:
```bash
# Formats: feat/<track>-<topic>, docs/<topic>, fix/<topic>
git checkout -b feat/01-setup-zsh-starship
```

### Step 3: Author the Guide or Update

1. Locate the appropriate track directory in `docs/`.
2. When creating a new document, duplicate [`docs/templates/GUIDE_TEMPLATE.md`](./docs/templates/GUIDE_TEMPLATE.md).
3. Ensure your content adheres to all standards in [`RULES.md`](./RULES.md).
4. Verify markdown formatting and test all commands and configurations locally.

### Step 4: Commit Your Changes

Use the Conventional Commits specification:
```bash
git add .
git commit -m "feat(01-setup): add Starship prompt and Zsh configuration guide"
```

### Step 5: Push and Open a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feat/01-setup-zsh-starship
   ```
2. Navigate to the repository on GitHub and click **"Compare & pull request"**.
3. Complete the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) in full.
4. Submit the PR for maintainer review.

---

## Track Directory Overview

| Track | Directory | Focus Area |
| :--- | :--- | :--- |
| **Track 01** | [`docs/01-foundations-and-setup/`](./docs/01-foundations-and-setup/README.md) | IDEs, Terminals, Shells, Keybindings, Dotfiles, OS configs |
| **Track 02** | [`docs/02-git-and-github-craft/`](./docs/02-git-and-github-craft/README.md) | Git workflows, clean history, rebasing, PR etiquette, GPG |
| **Track 03** | [`docs/03-code-craft-and-architecture/`](./docs/03-code-craft-and-architecture/README.md) | Clean code, SOLID, design patterns, testing pyramid, TDD |
| **Track 04** | [`docs/04-fullstack-and-api-engineering/`](./docs/04-fullstack-and-api-engineering/README.md) | API architecture, frontend performance, DB indexing, caching, auth |
| **Track 05** | [`docs/05-devops-cicd-and-cloud/`](./docs/05-devops-cicd-and-cloud/README.md) | Docker, CI/CD pipelines, K8s, Terraform, zero-downtime |
| **Track 06** | [`docs/06-observability-security-reliability/`](./docs/06-observability-security-reliability/README.md) | OWASP security, logging, tracing, metrics, postmortems |
| **Track 07** | [`docs/07-dev-aura-and-soft-skills/`](./docs/07-dev-aura-and-soft-skills/README.md) | RFC writing, code review craftsmanship, engineering communication |

---

## Contributor Recognition

All merged contributors are credited in the repository's main `README.md`. Thank you for helping build an authoritative resource for software engineers worldwide.
