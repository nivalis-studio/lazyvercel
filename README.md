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
- `o` – Open the branch in the Vercel dashboard
- `q / esc / backspace` – Exit to the terminal

**Deployments list**
- `TAB / Shift+TAB` – Cycle the active branch filter
- `ENTER` – Drill into deployment details
- `o` – Open selected deployment in the browser
- `r` – Force refresh

**Deployment details / logs**
- `o` – Open deployment URL
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

1. Ensure `bun run lint` and `bun run ts` pass.
2. Run `bun run build`; verify `dist/index.js` executes via `bun dist/index.js`.
3. Bump the version (`npm version patch|minor|major`).
4. Publish with `bun publish` (or `npm publish`).
5. Create a GitHub release describing the changes.

## Troubleshooting

- **Missing `.vercel/project.json`** – Run `vercel link` in your project directory so the CLI knows which project/org to query.
- **Invalid token errors** – Delete `~/.config/lazyvercel/config.json` and relaunch; the setup flow will prompt for a new token.
- **Blank screen on launch** – Ensure your terminal supports truecolor and that Bun is updated to the version in `package.json`.
- **Logs never load** – Confirm the project allows access to deployment events and that the token’s scope includes deployments.

## Contributing

Bug reports and pull requests are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for the recommended workflow, coding standards, and release checklist.

## License

MIT
