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
- 23 bundled color themes, plus a custom theme in the config file (see [Themes](#themes))
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

To work from source, install dependencies and start the app against a directory that already has `.vercel/project.json`:

```bash
git clone https://github.com/nivalis-studio/lazyvercel.git
cd lazyvercel
bun install
bun run dev -- /path/to/linked/project
```

`bun run dev` watches `src/index.tsx`. The path after `--` is the positional `[cwd]` from [CLI options](#cli-options). If this repository is itself linked, `bun run dev` with no path is enough.

## Authentication setup

- Generate a token in the Vercel dashboard (scope: read access to deployments/projects).
- Paste it into the in-app form; validation happens before anything is written to disk.
- The config file stores three things: `bearerToken`, the selected `theme`, and `customTheme` (see [Themes](#themes)).
- To rotate credentials, delete `~/.config/lazyvercel/config.json` or relaunch and paste a new token.

## Usage

The CLI detects the current project from `.vercel/project.json` in the working directory. When multiple projects exist within the same team, `Ctrl+P` opens the command palette and `Ctrl+G` opens the project switcher. Theme switching lives in the command palette.

### CLI options

```text
lazyvercel [cwd]
```

| Option | Description |
| --- | --- |
| `[cwd]` | Directory to run in. Defaults to the current directory. |
| `--cwd <dir>` | Run as if launched in `<dir>`. Wins over `[cwd]` when both are set. |
| `--debug [namespaces]` | Enable debug logs. Sets `DEBUG`; the default namespace is `lazyvercel*`. |
| `-v, --version` | Display the version number and exit. |
| `-h, --help` | Display help and exit. |

```bash
lazyvercel
lazyvercel .
lazyvercel --cwd ../my-vercel-project
lazyvercel --debug
lazyvercel --debug lazyvercel:deployments,lazyvercel:stream
```

`--debug` with no namespaces sets `DEBUG=lazyvercel*`, which turns on every `lazyvercel` logger (`lazyvercel:deployments`, `lazyvercel:projects`, `lazyvercel:stream`). Pass a pattern to narrow it. Inside the app, `Ctrl+E` opens the last error panel.

### Keyboard shortcuts

This list matches the in-app help (`?`).

**Global**

- `?` – Toggle this help
- `Ctrl+P` – Open command palette
- `Ctrl+G` – Switch project
- `Ctrl+E` – Show last error
- `Ctrl+R` – Refresh projects
- `Ctrl+J` – Focus console
- `Ctrl+K` – Toggle console
- `Shift+Q / Ctrl+C` – Quit

**Dashboard**

- `← / →` or `h / l` – Switch pane focus
- `r` – Refresh deployments (works from either pane, while no modal is open)

**Branch & deployments lists**

- `↑ / ↓` or `j / k` – Move selection
- `ENTER / SPACE` – Select branch / open deployment
- `TAB / Shift+TAB` – Cycle branch filter
- `o` – Open branch dashboard / deployment URL
- `q / ESC / BACKSPACE` – Quit

**Deployment details / logs**

- `o` – Open deployment in browser
- `q / ESC / BACKSPACE` – Back to list

Mouse hover focuses panes and rows; scrolling works in every list.

## Themes

Twenty-three presets ship with the app. Switch them from the command palette (`Ctrl+P`). The id stored in `~/.config/lazyvercel/config.json` is one of:

`aura`, `ayu`, `catppuccin`, `cobalt2`, `dracula`, `everforest`, `github`, `gruvbox`, `kanagawa`, `material`, `matrix`, `monokai`, `nightowl`, `nord`, `oneDark`, `opencode`, `palenight`, `rosepine`, `solarized`, `synthwave84`, `tokyonight`, `vesper`, `zenburn`

For a custom theme, set `"theme": "custom"` and put the palette in `customTheme`. The object has the same shape as the files in `src/theme/` (copy one of those as a starting point). `defs` maps names to colors. `theme` must include every key below. Each value is a `#hex` color, a name from `defs`, or `{ "dark": "...", "light": "..." }` (the app reads the `dark` entry).

`primary`, `secondary`, `accent`, `error`, `warning`, `success`, `info`, `text`, `textMuted`, `background`, `backgroundPanel`, `backgroundElement`, `border`, `borderActive`, `borderSubtle`, `diffAdded`, `diffRemoved`, `diffContext`, `diffHunkHeader`, `diffHighlightAdded`, `diffHighlightRemoved`, `diffAddedBg`, `diffRemovedBg`, `diffContextBg`, `diffLineNumber`, `diffAddedLineNumberBg`, `diffRemovedLineNumberBg`, `markdownText`, `markdownHeading`, `markdownLink`, `markdownLinkText`, `markdownCode`, `markdownBlockQuote`, `markdownEmph`, `markdownStrong`, `markdownHorizontalRule`, `markdownListItem`, `markdownListEnumeration`, `markdownImage`, `markdownImageText`, `markdownCodeBlock`, `syntaxComment`, `syntaxKeyword`, `syntaxFunction`, `syntaxVariable`, `syntaxString`, `syntaxNumber`, `syntaxType`, `syntaxOperator`, `syntaxPunctuation`

## Development

```bash
bun install              # install dependencies
bun run dev              # start OpenTUI renderer with live reload
bun run build            # build distributable to dist/index.js
bun run lint             # biome check
bun run lint:fix         # biome check and write fixes
bun run test             # run the test suite
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
- **Debugging a failure** – Rerun with `--debug` (or `--debug lazyvercel:deployments`). Logs are written to stderr. `Ctrl+E` opens the last error caught in the UI.

## Contributing

Bug reports and pull requests are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for the recommended workflow, coding standards, and release checklist.

## TODO

The following ideas are on our radar for future releases. Contributions or feedback on any of them are welcome:

- **Richer filtering** – quick filters (building/failed/succeeded), search by commit/author/message, saved filters
- **Multi-project workflows** – support `--project` / `--team` flags and remember the last selected project per repo
- **Onboarding polish** – open token page from Setup and show clearer messages for token scope/team mismatches
- **Resilience** – retries/backoff for 429/5xx, and short TTL caching for projects/deployments to speed startup
- **Deployment actions** – redeploy, cancel builds, or promote previews directly from the TUI when scopes allow
- **Environment insights** – surface env vars, targets, and config diffs per deployment for easier debugging
- **Audit timeline** – show rollbacks, config changes, and deployment history grouped by branch/environment
- **Collaboration hooks** – generate shareable status snippets or push updates to Slack/Discord

## License

MIT
