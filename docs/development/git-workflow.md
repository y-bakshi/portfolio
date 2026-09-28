# Git Workflow

Repository: [y-bakshi/portfolio](https://github.com/y-bakshi/portfolio). `main` is the default branch. Worktrees and dependencies should remain reproducible through committed manifests and lockfiles.

## Proposed Contribution Workflow

1. Create a focused branch such as `feat/editorial-home`, `fix/assistant-focus`, or `docs/api-contract`.
2. Make one coherent change, update relevant documentation, and run applicable checks.
3. Review `git diff` and staged paths for generated output and secrets.
4. Open a pull request describing behavior, evidence, and verification. Include desktop/mobile screenshots for visual changes and linked issues when available.
5. Merge after review/checks; production deployment remains a separate gated action until launch.

Use concise imperative commit subjects. The initial repository convention is `Initialize Astro portfolio frontend with Vue`; conventional-commit prefixes are optional rather than an enforced rule.

## Excluded Context

Ignore agent instructions (`AGENTS.md`, `CLAUDE.md`, related overrides), `.agents/`, `.codex/`, and private root briefs. Public technical documentation under `docs/` is intended for version control. Never add ignored files using `git add -f` as a routine workflow.

Branch protections, required checks, and PR automation are proposed, not currently configured. Preserve unrelated local changes; avoid rewriting shared history or force-pushing without an explicit reason and authorization.
