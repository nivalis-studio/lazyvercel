# lazyvercel

A fast Terminal User Interface (TUI) for exploring Vercel deployments from any linked project directory. Built with Bun, React 19, and OpenTUI, it delivers a mouse-friendly yet fully keyboard-driven workflow.

## Quick Start

1. From a directory that already contains `.vercel/project.json`, run `bunx lazyvercel`.
2. The first launch opens the setup flow. Paste a Vercel token created at [vercel.com/account/tokens](https://vercel.com/account/tokens).
3. Tokens are saved to `~/.config/lazyvercel/config.json` and reused until revoked.
4. Once authenticated, the dashboard automatically loads the project deployments for the team id inside `.vercel/project.json`.

```bash
bunx lazyvercel         # run inside a linked repo
lazyvercel              # if installed globally
```

## Features

- Branch-aware deployments browser with instant filtering
- Detailed deployment drawer including build metadata and live logs
- Project and theme switchers surfaced through a command palette
- Color themes powered by OpenTUI + Catppuccin presets (custom themes supported)
- Keyboard shortcuts throughout; mouse hover and scroll support for discoverability

## Prerequisites

- Bun `>= 1.3.0` (used for development, bundling, and runtime)
- A Vercel project that has been linked locally (`vercel link`) so that `.vercel/project.json` exists
- A personal Vercel access token with read access to the target project/organization

## Installation

Run lazily via `bunx` without installing anything globally:

```bash
bunx lazyvercel
```

Or install it once and reuse:

```bash
bun install -g lazyvercel
lazyvercel
```

To work from source:

```bash
git clone https://github.com/nivalis-studio/lazyvercel.git
cd lazyvercel
bun install
```

## Authentication setup

- Generate a token in the Vercel dashboard (scope: read access to deployments/projects).
- Paste it into the in-app form; validation happens before anything is written to disk.
- The config file stores three things: `bearerToken`, selected theme, and an optional custom theme.
- To rotate credentials, delete `~/.config/lazyvercel/config.json` or relaunch and paste a new token.

## Usage


The CLI detects the current project from `.vercel/project.json`. When multiple projects exist within the same team, use the command palette (`Ctrl+P`) to switch context without leaving the app. Theme switching lives in the same palette.

### Keyboard shortcuts

**Global**
- `Ctrl+P` – Open command palette (project/theme switchers)
- `Ctrl+K` – Toggle the OpenTUI console
- `Shift+Q` or `Ctrl+C` – Quit
- `?` – Toggle the help overlay

**Branch list**
- `↑ / ↓` or `j / k` – Move selection
- `TAB / Shift+TAB` – Cycle the active branch filter
- `o` – Open the branch in the Vercel dashboard
- `q / esc / backspace` – Exit to the terminal

**Deployments list**
- `TAB / Shift+TAB` – Cycle the active branch filter
- `ENTER` – Drill into deployment details
- `o` – Open the highlighted deployment in the browser
- `r` – Force refresh

**Deployment details / logs**
- `o` – Open deployment URL (works in both panes)
- `q / esc / backspace` – Return to the list

Mouse hover focuses panes and rows; scrolling works in every list.

## Development

```bash
bun install              # install dependencies
bun run dev              # start OpenTUI renderer with live reload
bun run build            # build distributable to dist/index.js
bun run lint             # biome linting
bun run ts               # type-check with tsc --noEmit
```

The repo uses Lefthook for git hooks (`bun run prepare`) and Biome for formatting/linting. The bundled binary lives at `dist/index.js` and is the file shipped to npm.

## Releasing

Releases are tag-driven: pushing a `vX.Y.Z` tag that matches the `package.json` version runs `.github/workflows/publish.yml`, which checks, builds, smoke-tests and publishes the package. See [CONTRIBUTING.md](./CONTRIBUTING.md#releasing-maintainers) for the maintainer checklist.

## Troubleshooting

- **Missing `.vercel/project.json`** – Run `vercel link` in your project directory so the CLI knows which project/org to query.
- **Invalid token errors** – Delete `~/.config/lazyvercel/config.json` and relaunch; the setup flow will prompt for a new token.
- **Blank screen on launch** – Ensure your terminal supports truecolor and that Bun is updated to the version in `package.json`.
- **Logs never load** – Confirm the project allows access to deployment events and that the token’s scope includes deployments.

## Contributing

Bug reports and pull requests are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for the recommended workflow, coding standards, and release checklist.

## TODO

The following ideas are on our radar for future releases. Contributions or feedback on any of them are welcome:

- **Watch mode** – follow a deployment’s logs until it finishes (READY/ERROR), then stop automatically
- **Better status surface** – footer/status line with project, branch filter, last refresh time, and key shortcuts
- **Richer filtering** – quick filters (building/failed/succeeded), search by commit/author/message, saved filters
- **Multi-project workflows** – support `--project` / `--team` flags and remember the last selected project per repo
- **Onboarding polish** – open token page from Setup and show clearer messages for token scope/team mismatches
- **Resilience** – retries/backoff for 429/5xx, and short TTL caching for projects/deployments to speed startup
- **Deployment actions** – redeploy, cancel builds, or promote previews directly from the TUI when scopes allow
- **Environment insights** – surface env vars, targets, and config diffs per deployment for easier debugging
- **Audit timeline** – show rollbacks, config changes, and deployment history grouped by branch/environment
- **Collaboration hooks** – generate shareable status snippets or push updates to Slack/Discord
- **Non-TUI mode** – `--help` / `--version` / basic text output for CI and issue reports
- **Debugging tooling** – structured debug logs behind `DEBUG=lazyvercel` and an in-UI “last error” panel
- **Docs alignment** – ensure README matches the supported runtime and recommended `npx` usage

## License

MIT
