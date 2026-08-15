# Track 02: Git & GitHub Craft

> *"A developer's Git history reflects their architectural clarity and discipline."*

This track focuses on version control workflows, linear commit histories, pull request standards, and repository security.

---

## Track Curriculum & Progress

| Module / Topic | File | Status | Difficulty |
| :--- | :--- | :---: | :---: |
| **Git Workflow & Branching Strategies** | [`git-workflow-and-branching.md`](./git-workflow-and-branching.md) | Complete | Intermediate |
| **Conventional Commits & Clean History** | [`conventional-commits-and-history.md`](./conventional-commits-and-history.md) | Complete | Intermediate |
| **PR Etiquette & GitHub CLI (`gh`)** | [`pr-etiquette-and-code-reviews.md`](./pr-etiquette-and-code-reviews.md) | Complete | Intermediate |
| **Git Security, GPG & Commit Signing** | [`git-security-and-gpg.md`](./git-security-and-gpg.md) | Complete | Advanced |
| **Advanced Git Operations (Reflog, Bisect, Cherry-pick)** | `advanced-git-surgery.md` | `[TODO: Open for Contribution]` | Advanced |
| **Monorepo Versioning & Git Submodules** | `monorepo-git-strategies.md` | `[TODO: Open for Contribution]` | Advanced |

---

## Core Standards for Version Control

1. **Zero Secret Leakage**: Secrets committed to Git history are permanently compromised. Enforce pre-commit scanning.
2. **Atomic Commits**: Each commit encapsulates a single logical change with passing tests.
3. **Conventional Commits**: Explicitly typed prefixes (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
4. **Linear Rebasing**: Rebase feature branches on `main` before merging to maintain clean bisectability.
5. **Safe Force Pushing**: Use `--force-with-lease` when updating remote feature branches.

---

## Open Contribution Tasks

- [ ] Troubleshooting and automation guide for `git bisect` automated debugging.
- [ ] Visual walkthrough for resolving complex multi-file merge conflicts.
- [ ] Guide for managing multiple concurrent branches with `git worktree`.
