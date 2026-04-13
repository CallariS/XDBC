# Contributing to XDBC

Thank you for your interest in contributing to XDBC. Contributions of all kinds are welcome — bug reports, feature requests, code improvements, documentation enhancements, and test coverage expansion.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Reporting Issues](#reporting-issues)
- [Contributing Code](#contributing-code)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Documentation](#documentation)
- [License Agreement](#license-agreement)
- [Code of Conduct](#code-of-conduct)
- [Contact](#contact)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```sh
   git clone https://github.com/<your-username>/XDBC.git
   cd XDBC
   ```
3. **Install dependencies**:
   ```sh
   npm install
   ```
4. **Run the test suite** to verify the setup:
   ```sh
   npm test
   ```

---

## Reporting Issues

If you encounter a bug or have a feature request, please [open an issue](https://github.com/CallariS/XDBC/issues/new) on GitHub.

When reporting a bug, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Environment details (Node.js version, TypeScript version, OS)
- A minimal code sample or test case, if possible

For feature requests, describe the use case and how the proposed change benefits users.

---

## Contributing Code

### Branch Strategy

- Create a feature branch from `master`:
  ```sh
  git checkout -b feature/my-improvement
  ```
- Use descriptive branch names: `feature/`, `fix/`, `docs/`, `test/`

### Commit Guidelines

- Write clear, concise commit messages in imperative mood:
  - **Good**: `Add RANGE contract for numeric boundaries`
  - **Avoid**: `Added stuff`, `WIP`, `fix`
- Each commit should represent a single logical change
- Reference related issues where applicable: `Fix #12 — handle null in OR.check()`

### Pull Request Process

1. Ensure your branch is up to date with `master`
2. Run the full test suite and linter before submitting
3. Open a pull request with:
   - A description of what the change does and why
   - Links to related issues
   - Any breaking changes clearly noted
4. Address review feedback promptly
5. A maintainer will merge once the PR is approved

---

## Development Workflow

| Command | Purpose |
|---|---|
| `npm test` | Run the test suite (Jest) |
| `npm run build` | Build the project (Webpack) |
| `npm run lint` | Lint the codebase (Biome) |
| `npm run format` | Auto-format source files (Biome) |
| `npm run docs` | Generate API documentation (TypeDoc) |

---

## Code Style

- **TypeScript** is the primary language. All source code resides in `src/`.
- **Biome** is used for both linting and formatting. Run `npm run lint` and `npm run format` before submitting.
- Follow existing patterns:
  - Each contract class lives in its own file under `src/DBC/`
  - Derived contracts go in subdirectories (e.g., `src/DBC/COMPARISON/`)
  - Every contract exposes `PRE`, `POST`, and `INVARIANT` static decorator factories
- Avoid introducing new dependencies unless absolutely necessary
- Prefer strict types over `any` where feasible

---

## Testing

- Tests are located in `__tests__/DBC/` and use **Jest** with `ts-jest`
- Every new contract or behavioral change should include corresponding tests
- Test file naming convention: `<ContractName>.test.ts`
- Run the suite with:
  ```sh
  npm test
  ```
- Aim for tests that cover:
  - `check()` method behavior (passing and failing cases)
  - Decorator execution (`PRE`, `POST`, `INVARIANT`) where applicable
  - Edge cases (null, undefined, empty arrays, wrong types)

---

## Documentation

- API documentation is generated with [TypeDoc](https://typedoc.org/) (`npm run docs`)
- Use JSDoc-style comments on all public classes, methods, and parameters
- Update the README if your change adds new contracts, features, or configuration options
- Keep `Demo.ts` up to date with representative usage examples

---

## License Agreement

By contributing to XDBC, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## Code of Conduct

All contributors must adhere to the [Code of Conduct](CODE_OF_CONDUCT.md). Respectful, professional interaction is expected in all project spaces.

---

## Contact

For questions about contributing, reach out at [XDBC@WaXCode.net](mailto:XDBC@WaXCode.net).