# Contributing

Thanks for your interest in improving the **Diario Oficial de la Federación**
reader! This document explains how to set up your environment and the
conventions we follow. By participating you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- 🐛 **Report bugs** via the [issue tracker](https://github.com/antoniotorres/dof/issues).
- 💡 **Suggest features** with a feature-request issue.
- 📝 **Improve docs** — typos and clarifications are welcome.
- 🔧 **Send pull requests** for fixes and features.

For anything large, please open an issue first so we can align on the approach
before you invest time.

## Development setup

This project uses **pnpm** and the Node version pinned in [`.nvmrc`](.nvmrc).

```bash
nvm use                       # Node 24
corepack enable               # makes the pinned pnpm available
pnpm install                  # install dependencies
cp .env.example .env.local    # configure env (optional for most work)
pnpm dev                      # start the dev server on :3000
```

See the [README](README.md#environment-variables) for the full list of
environment variables. Most UI work does not require AWS credentials — the app
runs fine with an empty note listing.

## Branching & workflow

1. Fork the repo (external contributors) or create a topic branch.
2. Branch off `main`, e.g. `feat/search-filters` or `fix/sitemap-encoding`.
3. Make your change in small, focused commits.
4. Push and open a pull request against `main`.

Keep `main` releasable at all times.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). The
type prefix drives changelog grouping and keeps history scannable.

```
<type>(optional scope): <short, imperative summary>
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`,
`ci`, `build`, `style`.

Examples:

```
feat(search): add highlighting of matched terms
fix(sitemap): encode note ids in URLs
chore(deps): bump next to 16.2.9
```

## Coding standards

- **TypeScript** everywhere; prefer explicit, well-named types.
- **Server-only code** (anything touching AWS or secrets) must import
  `server-only` and live in `lib/`. Never leak credentials to the client.
- Match the style of the surrounding code.

Before pushing, make sure all checks pass locally:

```bash
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm build        # production build must succeed
pnpm format:fix   # Prettier (run before committing)
```

The same checks run in CI on every pull request.

## Pull request checklist

- [ ] The branch is up to date with `main`.
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass.
- [ ] Code is formatted (`pnpm format:fix`).
- [ ] Commits follow Conventional Commits.
- [ ] The PR description explains the **what** and the **why**, and links any
      related issue (e.g. `Closes #123`).
- [ ] No secrets, credentials, or `.env` files are committed.
- [ ] UI changes include before/after screenshots where helpful.

## Reporting security issues

Please **do not** file security vulnerabilities as public issues. Follow the
process in [SECURITY.md](SECURITY.md) instead.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE) that covers this project.
