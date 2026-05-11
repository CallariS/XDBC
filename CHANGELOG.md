# Changelog

All notable changes to XDBC are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.220] — 2026-05-11

### Changed
- Removed the mandatory `data-xdbc` marker attribute — any `data-xdbc-*` attribute is now sufficient to enroll a DOM element in contract enforcement. `data-xdbc` is retained as an optional attribute to specify a custom DBC instance path.

---

## [1.0.219] — 2026-05-11

### Added
- DOM integration: **blur-first validation model** — all base contracts fire on blur by default, so partial values are never blocked during typing
- `data-xdbc-validate-on="input"` attribute to opt individual elements into keystroke-time validation
- **Keystroke (`-input`) twin** for every built-in DOM contract: `data-xdbc-regex-input`, `data-xdbc-type-input`, `data-xdbc-eq-input`, `data-xdbc-different-input`, `data-xdbc-defined-input`, `data-xdbc-undefined-input`, `data-xdbc-greater-input`, `data-xdbc-greater-or-equal-input`, `data-xdbc-less-input`, `data-xdbc-less-or-equal-input`, `data-xdbc-or-input` — each fires on every keystroke regardless of `data-xdbc-validate-on`
- Two-variable revert tracking (`lastInputValid` / `lastBlurValid`) prevents partial-value corruption when `-input` and base contracts coexist on the same element

---

## [1.0.208] — 2026-04-13

### Changed
- Minor fixes and improvements across `DBC`, `COMPARISON/GREATER`, `EQ`, `INSTANCE`, and `REGEX` contracts

### Security
- Removed unused `parcel` dependency and associated vulnerability surface
- Upgraded `jest-environment-jsdom` to v30 (resolves `form-data`, `@tootallnate/once` advisories)
- Removed stale `yarn.lock` that triggered duplicate Dependabot alerts
- Removed `node_modules` and build artifacts (`dist/`, `.parcel-cache/`) from version control

### Documentation
- Rewrote README to enterprise-level documentation with full contracts reference
- Updated CONTRIBUTING.md, SECURITY.md with structured guidelines
- Added CHANGELOG.md, SUPPORT.md

---

## [1.0.207] — 2025-05-15

### Added
- `DIFFERENT` contract — derived from `EQ` with inverted logic (inequality checks)

---

## [1.0.206] — 2025-05-14

### Changed
- Refactored `GREATER` into a generalized `COMPARISON` base class
- Derived `GREATER`, `GREATER_OR_EQUAL`, `LESS`, and `LESS_OR_EQUAL` from `COMPARISON`
- Minor fixes across contract implementations

---

## [1.0.0] — 2025-05-11

### Added
- Initial stable release
- Core `DBC` class with `ParamvalueProvider`, execution settings, and infringement handling
- Contract classes: `AE`, `EQ`, `REGEX`, `TYPE`, `INSTANCE`, `OR`, `IF`, `COMPARISON`, `JSON_OP`, `JSON_Parse`, `DEFINED`, `UNDEFINED`, `HasAttribute`, `ZOD`
- `PRE` (precondition), `POST` (postcondition), and `INVARIANT` decorator factories for all contracts
- Path resolution supporting dot notation, array indices, method calls, and HTML attributes
- Multiple DBC instance support with configurable infringement/warning settings
- Type-safe static `tsCheck` methods on `REGEX`, `TYPE`, `INSTANCE`, and `OR`
- Built-in regular expression library (`REGEX.stdExp`)
- API documentation via TypeDoc
- Test suite covering core contract `check()` behavior
