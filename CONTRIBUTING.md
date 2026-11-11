# Contributing to lazyvercel

Thanks for helping make lazyvercel better! This document describes the local development workflow, quality gates, and preferred conventions so your contribution can ship quickly.

## Prerequisites

- Bun `>= 1.3.0` (used for development, bundling, and publishing)
- Node.js 18+ if you rely on Node tooling
- A Vercel-linked project (`vercel link`) for testing against real deployments

## Repository setup

1. Fork the repo and clone your fork:
   ```bash
   git clone https://github.com/<you>/lazyvercel.git
   cd lazyvercel
   ```
2. Install dependencies and git hooks:
   ```bash
   bun install
   bun run prepare   # installs Lefthook
   ```
3. Ensure you have a valid Vercel token saved in `~/.config/lazyvercel/config.json` or run the app once to go through the built-in setup flow.

## Day-to-day development

| Task | Command |
| --- | --- |
| Start the TUI with hot reload | `bun run dev` |
| Build the distributable | `bun run build` |
| Type-check | `bun run ts` |
| Lint / format check | `bun run lint` |
| Autofix lint issues | `bun run lint:fix` |
| Run the CI checks | `bun run check` |
| Smoke-test that the UI loads | `bun run smoke` |

A few tips:
- Run `bun run dev` inside a directory that includes `.vercel/project.json` so the CLI can locate a project.
- When touching UI, consider recording a short terminal capture or adding screenshots/gifs in the PR description.
- Keep third-party API calls mocked or isolated when adding automated tests to avoid rate limits.

## Coding standards

- Follow the existing file structure: colocate UI pieces inside `src/_components`, logic inside `src/hooks` or `src/lib` as appropriate.
- Use TypeScript strictly—surface types through `types/` when shared.
- Prefer descriptive names over abbreviations; keep functions small and composable.
- The repo uses Biome; do not hand-format files—run `bun run lint:fix` if needed.

## Commit and PR guidelines

- Commits are linted with [Conventional Commits](https://www.conventionalcommits.org/) via Commitlint.
- Keep commits focused (one logical change per commit). Squash locally if you end up with noisy fix-up commits.
- Reference related issues in the PR description (`Closes #123`).
- Include screenshots or terminal recordings for UI changes.
- Mention any manual testing performed (`bun run dev`, verified on macOS, etc.).

## Testing checklist before opening a PR

- [ ] `bun run check` (typecheck, lint, tests, and build)
- [ ] `bun run smoke` (source entry, built bundle, and packed bin)

## Releasing (maintainers)

Releases are published to npm by `.github/workflows/publish.yml` when a `vX.Y.Z` tag is pushed.

1. Ensure `main` is green and up-to-date.
2. Bump the version and tag it: `npm version <patch|minor|major> -m "chore: release v%s"` (creates the `chore: release vX.Y.Z` commit and the `vX.Y.Z` tag).
3. Push the commit and the tag: `git push --follow-tags`.
4. Watch the "Publish Package" workflow. It fails if the tag doesn't equal `v` + the `package.json` version, then runs `bun run check` and `bun run smoke`, and publishes.
5. Draft GitHub release notes summarizing highlights.

## Documentation-only changes

- For README/CONTRIBUTING/issue-template tweaks, it’s still helpful to run `bun run lint` to enforce markdown formatting where configured.
- If you update keyboard shortcuts or UX flows, mirror the change in the README’s “Keyboard shortcuts” or “Usage” section.

## Need help?

Open a discussion or issue with the "question" label, or hop into the PR comments. We’re happy to help you land the change.
