<p align="center">
  <img src="https://img.shields.io/npm/v/xdbc?style=flat-square" alt="npm version" />
  <img src="https://img.shields.io/npm/l/xdbc?style=flat-square" alt="license" />
  <img src="https://img.shields.io/npm/dt/xdbc?style=flat-square" alt="downloads" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/decorators-stage%203-green?style=flat-square" alt="decorators" />
  <img src="https://img.shields.io/badge/optimized%20for-VS%20Code-007acc?style=flat-square&logo=visualstudiocode" alt="VS Code" />
</p>

# XDBC — e**X**plicit **D**esign **b**y **C**ontract for TypeScript

> A decorator-based Design by Contract framework that enforces preconditions, postconditions, and invariants through TypeScript metadata — delivering precise, self-documenting, and verifiable component contracts.

---

## At a Glance

| Approach | With XDBC | Without XDBC |
|---|---|---|
| **Parameter validation** | <pre>@DBC.ParamvalueProvider<br>method(@REGEX.PRE(/^\.*XDBC.\*$/i) input: string[]) {<br>  ...<br>}</pre> | <pre>method(input: string[]) {<br>  input.forEach((el, i) => {<br>    console.assert(/^.\*XDBC.\*$/i.test(el), "error");<br>  });<br>  ...<br>}</pre> |
| **Field invariant** | <pre>@REGEX.INVARIANT(/^.\*XDBC.\*$/i)<br>public field = "XDBC";</pre> | <pre>get field(): string { return this._field; }<br>set field(v: string) {<br>  console.assert(/^.\*XDBC.\*$/i.test(v), "error");<br>  this._field = v;<br>}</pre> |
| **Return validation** | <pre>@REGEX.POST(/^XDBC$/i)<br>method(input: unknown): string {<br>  ...<br>  return result;<br>}</pre> | <pre>method(input: unknown): string {<br>  ...<br>  if (!/^XDBC$/i.test(result)) {<br>    throw new Error("error");<br>  }<br>  return result;<br>}</pre> |

Contract violations produce structured, actionable diagnostics:

```
[ XDBC Infringement [ From "method" in "MyClass": [ Parameter-value "+1d,+5d,-x10y"
of the 1st parameter did not fulfill one of it's contracts: Violating-Arrayelement at
index 2. Value has to comply to regular expression "/^(?i:(NOW)|([+-]\d+[dmy]))$/i"]]]
```

---

## Table of Contents

- [What is Design by Contract?](#what-is-design-by-contract)
- [Why XDBC?](#why-xdbc)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Contracts Reference](#contracts-reference)
- [Core Concepts](#core-concepts)
- [Advanced Features](#advanced-features)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## What is Design by Contract?

[Design by Contract (DbC)](https://en.wikipedia.org/wiki/Design_by_contract) is a software engineering methodology that defines formal, precise, and verifiable interface specifications for software components. Each component's contract comprises:

| Element | Purpose |
|---|---|
| **Preconditions** | Conditions that must hold true *before* a method executes |
| **Postconditions** | Guarantees that must hold true *after* a method returns |
| **Invariants** | Properties that must remain true *throughout* an object's lifetime |

### DbC vs. Assertions

| Aspect | XDBC Decorators | Manual Assertions |
|---|---|---|
| Formality | Formal, declarative, co-located with signatures | Informal, scattered through method bodies |
| Integration | TypeScript metadata and decorators | Built-in `console.assert` / `throw` |
| Expressiveness | Composable, parameterized contract objects | Simple boolean checks |
| Readability | Contracts are visible at the API surface | Validation logic obscures business logic |
| Maintainability | Contracts are localized and reusable | Duplicated checks are hard to track |
| Production control | Selectively enable/disable by contract type | Typically all-or-nothing |

---

## Why XDBC?

- **Declarative** — contracts live as decorators alongside type signatures, not buried in method bodies
- **Composable** — combine contracts with `AE`, `OR`, and `IF` for expressive validation
- **Configurable** — toggle preconditions, postconditions, and invariants independently
- **Diagnostic** — structured error messages pinpoint the exact violation, parameter, and context
- **Extensible** — 16 built-in contracts, with support for custom contracts and Zod schema integration
- **Zero runtime overhead** — disable contract checking in production with a single flag

---

## Installation

```sh
npm install xdbc
```

**Requirements:** TypeScript 5.x with `experimentalDecorators` and `emitDecoratorMetadata` enabled in `tsconfig.json`.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Quick Start

```typescript
import { DBC, REGEX, TYPE, EQ } from "xdbc";

class UserService {

  // Invariant: email must always match pattern
  @REGEX.INVARIANT(/^[^@]+@[^@]+\.[^@]+$/)
  public email = "user@example.com";

  // Precondition: name must be a string; Postcondition: return must match pattern
  @REGEX.POST(/^Hello, .+$/)
  @DBC.ParamvalueProvider
  public greet(@TYPE.PRE("string") name: string): string {
    return `Hello, ${name}`;
  }

  // Precondition: age must be >= 0
  @DBC.ParamvalueProvider
  public setAge(@GREATER_OR_EQUAL.PRE(0) age: number) {
    // ...
  }
}
```

---

## Contracts Reference

XDBC ships with **16 contracts** organized into core validators and derived specializations:

### Core Contracts

| Contract | Description | Constructor |
|---|---|---|
| **`REGEX`** | Value must match a regular expression | `new REGEX(expression: RegExp)` |
| **`TYPE`** | Value must be of a specified type (supports pipe-separated: `"string\|number"`) | `new TYPE(type: string)` |
| **`EQ`** | Value must equal (or not equal) a reference value | `new EQ(equivalent: any, invert?: boolean)` |
| **`COMPARISON`** | Numeric comparison against a reference value | `new COMPARISON(equivalent, equalityPermitted, invert)` |
| **`INSTANCE`** | Value must be an instance of a specified class | `new INSTANCE(reference: any \| any[])` |
| **`AE`** | Every element in an array must satisfy a set of contracts | `new AE(conditions, index?, idxEnd?)` |
| **`OR`** | At least one of a set of contracts must be satisfied | `new OR(conditions: DBC[])` |
| **`IF`** | Conditional contract: if A holds, then B must also hold | `IF.PRE(condition, inCase, path?, invert?)` |
| **`JSON_OP`** | Object must contain specific properties of specific types | `new JSON_OP(properties: {name, type}[], checkElements?)` |
| **`JSON_Parse`** | String must be valid JSON; optionally forwards parsed result | `new JSON_Parse(receptor?: (json) => void)` |
| **`DEFINED`** | Value must not be `null` or `undefined` | — |
| **`UNDEFINED`** | Value must be `undefined` | — |
| **`ARRAY`** | Value must be an array | — |
| **`HasAttribute`** | HTMLElement must possess a named attribute | `HasAttribute.PRE(attrName, invert?)` |
| **`ZOD`** | Value must validate against a Zod schema | `new ZOD(schema: z.ZodType)` |

### Derived Contracts

| Contract | Derives From | Semantics |
|---|---|---|
| **`GREATER`** | `COMPARISON` | `value > reference` |
| **`GREATER_OR_EQUAL`** | `COMPARISON` | `value >= reference` |
| **`LESS`** | `COMPARISON` | `value < reference` |
| **`LESS_OR_EQUAL`** | `COMPARISON` | `value <= reference` |
| **`DIFFERENT`** | `EQ` | `value !== reference` |
| **`PLAIN_OBJECT`** | `ARRAY` | Value must be a non-null, non-array object |

### Built-in Regular Expressions

`REGEX.stdExp` provides ready-to-use patterns:

| Key | Validates |
|---|---|
| `htmlAttributeName` | HTML attribute names |
| `eMail` | Email addresses |
| `property` | Property identifiers |
| `url` | URLs |
| `keyPath` | Key paths |
| `date` | Date strings |
| `dateFormat` | Date format patterns |
| `cssSelector` | CSS selectors |
| `boolean` | Boolean string literals |
| `colorCodeHEX` | Hex color codes |
| `simpleHotkey` | Keyboard shortcuts |
| `bcp47` | BCP 47 language tags |

---

## Core Concepts

### Decorator Types

Every contract exposes three decorator factories:

| Decorator | Applies To | Validates |
|---|---|---|
| `Contract.PRE(...)` | Method parameters | Input values before method execution |
| `Contract.POST(...)` | Methods | Return value after method execution |
| `Contract.INVARIANT(...)` | Fields / Properties | Value on every assignment (including initialization) |

### The `ParamvalueProvider` Decorator

TypeScript parameter decorators do not natively receive parameter values. Any method using `PRE` parameter contracts **must** be decorated with `@DBC.ParamvalueProvider`:

```typescript
@DBC.ParamvalueProvider
public process(
  @TYPE.PRE("string") name: string,
  @REGEX.PRE(/^\d{4}$/) code: string
) { ... }
```

### Path Resolution

All `PRE`, `POST`, and `INVARIANT` decorators accept an optional **`path`** parameter — a dotted path that specifies a nested property of the value to validate instead of the value itself:

```typescript
// Validate that element.tagName === "SELECT"
@DBC.ParamvalueProvider
public handleElement(@EQ.PRE("SELECT", false, "tagName") el: HTMLElement) { }

// Validate that value.length === 1
@EQ.INVARIANT(1, false, "length")
public singleChar = "X";
```

Path resolution supports:
- **Dot notation**: `"user.address.city"`
- **Array indices**: `"items[0]"`
- **Method calls**: `"getName()"`
- **HTML attributes**: `"@data-id"`

### Custom Hints

Add context to error messages with the optional **`hint`** parameter:

```typescript
@DBC.ParamvalueProvider
public setAge(
  @GREATER_OR_EQUAL.PRE(0, undefined, "Age must be non-negative") age: number
) { }
```

---

## Advanced Features

### Composing Contracts with `AE`

Validate array elements against one or more contracts, optionally targeting a specific index range:

```typescript
// All elements must be non-empty strings matching a date pattern
@AE.PRE([new TYPE("string"), new REGEX(/^\d{4}-\d{2}-\d{2}$/)])
public processDates(dates: string[]) { }

// Only elements at indices 1 through 3
@AE.PRE([new REGEX(/^[A-Z]+$/)], 1, 3)
public processRange(items: string[]) { }

// Single element at index 0
@AE.PRE([new TYPE("number")], 0)
public processFirst(values: unknown[]) { }
```

### Logical Composition with `OR`

At least one contract must pass:

```typescript
@DBC.ParamvalueProvider
public setStatus(@OR.PRE([new EQ("active"), new EQ("inactive"), new EQ("pending")]) status: string) { }
```

### Conditional Contracts with `IF`

Apply a contract only when a precondition holds:

```typescript
// If the value is a string, it must also match digits-only
@IF.PRE(new TYPE("string"), new REGEX(/^\d+$/))
public processInput(value: unknown) { }
```

### Zod Schema Integration

Leverage Zod schemas for complex structural validation:

```typescript
import { z } from "zod";

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive()
});

@DBC.ParamvalueProvider
public createUser( @ZOD.PRE(UserSchema) data: unknown) { }
```

### Type-Safe Static Checks

Several contracts offer static `tsCheck` methods for imperative validation outside of decorators:

```typescript
// Throws if value is not a string
const name = TYPE.tsCheck<string>(input, "string", "Expected a string");

// Throws if value doesn't match regex
const code = REGEX.tsCheck<string>(input, /^\d{4}$/, "Invalid code format");

// Throws if not an instance of Date
const date = INSTANCE.tsCheck<Date>(input, Date, "Expected a Date");

// Throws if none of the conditions pass
const result = OR.tsCheck<string>(input, [new EQ("a"), new EQ("b")]);
```

---

## Configuration

### DBC Instance Settings

A default DBC instance is automatically registered at `WaXCode.DBC` when the module is imported. You can access and configure it:

```typescript
import { DBC } from "xdbc";

// Access the default DBC instance
const dbc = (globalThis as any).WaXCode.DBC as DBC;

// Toggle contract checking
dbc.executionSettings.checkPreconditions = true;
dbc.executionSettings.checkPostconditions = true;
dbc.executionSettings.checkInvariants = true;

// Configure infringement handling
dbc.infringementSettings.throwException = true;   // throw DBC.Infringement on violation
dbc.infringementSettings.logToConsole = false;     // log to console instead
```

### Multiple DBC Instances

Create isolated DBC instances with separate configurations using `DBC.register()`:

```typescript
// Register a vendor-specific instance at a custom path
const vendorDbc = new DBC(
  { throwException: false, logToConsole: true },
);
DBC.register(vendorDbc, "MyVendor.DBC");

// Route a contract to the custom instance via its path
@REGEX.INVARIANT(/^[A-Z]+$/, undefined, undefined, "MyVendor.DBC")
public code = "ABC";
```

> **Note:** `new DBC()` does not automatically mount onto `globalThis`. Call `DBC.register(instance, path)` to make an instance available for decorator resolution.

### Test Isolation

Use `DBC.isolated()` to run tests with a temporary DBC instance that doesn't affect other tests:

```typescript
DBC.isolated((tempDbc) => {
  // tempDbc is registered at "WaXCode.DBC" for the duration of this callback
  tempDbc.executionSettings.checkPreconditions = false;

  // ... run tests with contracts disabled ...
});
// Original DBC instance is automatically restored here
```

### Disabling Contracts in Production

```typescript
const dbc = (globalThis as any).WaXCode.DBC as DBC;
dbc.executionSettings.checkPreconditions = false;
dbc.executionSettings.checkPostconditions = false;
dbc.executionSettings.checkInvariants = false;
```

---

## API Documentation

Full generated API documentation is available at **[callaris.github.io/XDBC](https://callaris.github.io/XDBC/)**.

See [`Demo.ts`](src/Demo.ts) for annotated usage examples.

---

## Contributing

Participation is highly valued and warmly welcomed. The ultimate goal is to create a tool that proves genuinely useful and empowers a wide range of developers to build more robust and reliable applications.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

---

## License

[MIT](LICENSE) © Callari, Salvatore

---

<sub>"Design by Contract" is a registered trademark of Eiffel Software. XDBC is an independent project and is not affiliated with or endorsed by Eiffel Software.</sub>
