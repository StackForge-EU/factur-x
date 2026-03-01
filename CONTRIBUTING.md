# Contributing to Factur-X

Thank you for your interest in contributing. This project is released under **EUPL-1.2**.

---

## Development Setup

```bash
npm install
npm run build
npm test
```

Validate types and run lint/format:

```bash
npm run validate   # tsc --noEmit
npm run lint       # ESLint
npm run format     # Prettier
```

---

## Code Style

- **TypeScript** with strict mode
- **JSDoc** for all public APIs: `@param`, `@returns`, `@throws`, `@example` where relevant
- **EN 16931 BT references** in JSDoc for invoice fields (e.g. `@see EN 16931 BT-1`)
- **Prettier** with double quotes; run `npm run format` before committing

---

## Architecture

For technical details, see:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/PROFILES_AND_FLAVORS.md](docs/PROFILES_AND_FLAVORS.md)
- [docs/INPUT_OBJECT_SPECIFICATION.md](docs/INPUT_OBJECT_SPECIFICATION.md)

---

## Tests

- **Run tests:** `npm test` (vitest)
- **Type check:** `npm run validate` (tsc)
- Ensure all tests pass before submitting a PR

---

## Branching & Pull Requests

- Use descriptive branch names (e.g. `feat/embed-pdf`, `fix/xsd-validation`)
- Keep PRs focused; link to issues when applicable
- Ensure `npm test` and `npm run lint` pass

---

## License

By contributing, you agree that your contributions will be licensed under **EUPL-1.2**.
