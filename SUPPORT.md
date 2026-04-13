# Support

## Getting Help

If you need help using XDBC, there are several resources available:

### Documentation

- **[API Reference](https://callaris.github.io/XDBC/)** — Full generated API documentation
- **[README](README.md)** — Quick start guide, contracts reference, and configuration
- **[Demo.ts](src/Demo.ts)** — Annotated usage examples

### Community

- **[GitHub Discussions](https://github.com/CallariS/XDBC/discussions)** — Ask questions, share ideas, and connect with other users
- **[GitHub Issues](https://github.com/CallariS/XDBC/issues)** — Report bugs or request features

### Direct Contact

- **Email**: [XDBC@WaXCode.net](mailto:XDBC@WaXCode.net)

---

## Frequently Asked Questions

### How do I install XDBC?

```sh
npm install xdbc
```

Ensure your `tsconfig.json` has `experimentalDecorators` and `emitDecoratorMetadata` enabled.

### Why do I need `@DBC.ParamvalueProvider`?

TypeScript parameter decorators cannot access the actual parameter values at runtime. The `@DBC.ParamvalueProvider` method decorator intercepts the method call and captures parameter values so that `PRE` contracts can validate them.

### Can I disable contract checking in production?

Yes. Access the DBC instance and toggle execution settings:

```typescript
const dbc = (globalThis as any).WaXCode.DBC;
dbc.executionSettings.checkPreconditions = false;
dbc.executionSettings.checkPostconditions = false;
dbc.executionSettings.checkInvariants = false;
```

### Does XDBC work in Node.js?

Yes. XDBC uses `globalThis` for host resolution and works in both browser and Node.js environments.

### How do I report a security vulnerability?

Do not open a public issue. Email **[Security@WaXCode.net](mailto:Security@WaXCode.net)** directly. See [SECURITY.md](SECURITY.md) for the full policy.

---

## Sponsoring

If XDBC is useful in your work, consider supporting its development:

- **[GitHub Sponsors](https://github.com/sponsors/CallariS)**
- **[Patreon](https://patreon.com/salvatorecallari)**
- **[PayPal](https://paypal.me/CallariS)**
