# AGENTS.md

## Scope

This repository is `registre`, the Ghost theme of interlettre (interlettre.info), forked from TryGhost/Zap. Keep changes focused on theme source, assets, translations, CI and repo-level metadata.

## Commands

Use pnpm for this repo, pinned by package.json.

```bash
pnpm install --frozen-lockfile
pnpm test   # GScan
pnpm zip    # dist/registre.zip
```

Run the test command before committing when templates, assets, translations, dependencies or CI change.

## Conventions

- Site name is always written in lowercase: "interlettre".
- Light theme only: do not add a dark mode or `prefers-color-scheme: dark` styles.
- Palette variables live at the top of `assets/css/screen.css`; keep text contrast at least 4.5:1 (body and secondary text currently AAA) and control borders at least 3:1.
- Minimum UI text size is 13px (0.8125rem); body text is 19px in letters.
- Template strings use `{{t "English key"}}`; add every new key to both `locales/en.json` and `locales/fr.json`.
- No server-side custom helpers exist in Ghost themes: logic that Ghost helpers cannot express goes in `assets/js/registre.js`, as progressive enhancement.
- Fonts are self-hosted in `assets/fonts/` (SIL OFL); do not load fonts from third-party hosts.

## Dependencies

- Renovate (`renovate.json`) handles GitHub Actions, devDependencies and the pnpm version. Keep `automerge` off: merging into `main` deploys the theme to the live site with the Ghost Admin API key.
- GitHub Actions are pinned by commit SHA with a `# vX.Y.Z` comment.
- `pnpm-workspace.yaml` sets `minimumReleaseAge` to 7 days (10080 minutes); keep it aligned with `minimumReleaseAge` in `renovate.json`.

## Local testing

- Do not symlink this folder into a Ghost install located under the system temp directory (`/tmp`): when Ghost validates a theme there, GScan deletes ignored files (`.git`, `node_modules`, `AGENTS.md`, `CLAUDE.md`) through the symlink. Copy the folder instead, or keep Ghost outside `/tmp`.

## Boundaries

- Do not commit node_modules/, local Ghost content, generated zip files (dist/) or secrets.
