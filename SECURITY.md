# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x (latest) | Yes |
| < 1.0.0 | No |

Only the latest published version on npm receives security patches. Users are encouraged to stay up to date.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

To report a security concern, please email **[Security@WaXCode.net](mailto:Security@WaXCode.net)** with the following details:

- Description of the vulnerability
- Steps to reproduce or a proof of concept
- Affected component(s) and version(s)
- Potential impact and severity assessment
- Suggested fix, if any

### Response Timeline

| Stage | Timeframe |
|---|---|
| Acknowledgment of report | Within 48 hours |
| Initial triage and severity assessment | Within 5 business days |
| Patch development and internal testing | Dependent on severity |
| Public disclosure (after fix is available) | Coordinated with reporter |

---

## Vulnerability Handling Process

1. **Triage** — The report is reviewed, reproduced, and assigned a severity level (Critical / High / Medium / Low).
2. **Fix** — A patch is developed and tested against the current release.
3. **Release** — A patched version is published to npm.
4. **Disclosure** — A security advisory is published on GitHub after the fix is available. The reporter will be credited (with consent).

---

## Scope

This policy covers the XDBC npm package (`xdbc`) and its source code. It does **not** cover:

- Third-party dependencies (report those to the respective maintainers)
- The generated documentation site
- User applications that consume XDBC

---

## Security Best Practices for Users

- Keep XDBC updated to the latest version
- Run `npm audit` regularly to check for transitive dependency vulnerabilities
- Do not disable contract checking in security-sensitive paths without understanding the implications
- Avoid passing untrusted input directly to `path` resolution without validation

---

## Responsible Disclosure

We are committed to responsible disclosure and will not pursue legal action against individuals who:

- Report vulnerabilities in good faith
- Allow reasonable time for a fix before public disclosure
- Do not exploit the vulnerability beyond what is necessary to demonstrate it

---

## Contact

Security reports: **[Security@WaXCode.net](mailto:Security@WaXCode.net)**
General inquiries: **[XDBC@WaXCode.net](mailto:XDBC@WaXCode.net)**