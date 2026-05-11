import { DBC } from "../DBC";
import { COMPARISON } from "./COMPARISON";
import { DEFINED } from "./DEFINED";
import { EQ } from "./EQ";
import { REGEX } from "./REGEX";
import { TYPE } from "./TYPE";
import { UNDEFINED } from "./UNDEFINED";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A check function that receives the current field value and the raw attribute string. */
export type DOMContractCheck = (
	value: string,
	attrValue: string,
) => boolean | string;

type BoundEntry = {
	element: HTMLInputElement | HTMLTextAreaElement;
	inputListener: () => void;
	blurListener: (() => void) | null;
	compositionStartListener: () => void;
	compositionEndListener: () => void;
};

// ─── Contract registry ────────────────────────────────────────────────────────

/**
 * Maps a `data-xdbc-<key>` attribute suffix to a check function.
 * Populated by {@link registerDOMContract } and the built-in defaults below.
 */
const registry = new Map<string, DOMContractCheck>();

/**
 * Registers a check function for a `data-xdbc-<key>` attribute.
 * Call this before {@link scanDOM } to make a contract available declaratively.
 *
 * @param key       The attribute suffix (e.g. `"type"` → `data-xdbc-type`).
 * @param checkFn   Receives the live field value and the raw attribute string.
 *                  Return `true` when the value is valid, or a `string` message when it is not.
 *
 * @example
 * ```ts
 * import { registerDOMContract } from "xdbc/DBC/DOM";
 * import { MY_CONTRACT } from "./MY_CONTRACT";
 *
 * registerDOMContract("my-contract", (value, attr) =>
 *     MY_CONTRACT.checkAlgorithm(value, attr),
 * );
 * ```
 */
export function registerDOMContract(
	key: string,
	checkFn: DOMContractCheck,
): void {
	registry.set(key, checkFn);
}

// ─── Built-in registrations ───────────────────────────────────────────────────

// data-xdbc-regex="^\d*$"
registerDOMContract("regex", (value, attr) => {
	let rx: RegExp;
	try {
		rx = new RegExp(attr);
	} catch {
		return `[XDBC] Invalid RegExp pattern: "${attr}"`;
	}
	return REGEX.checkAlgorithm(value, rx);
});

// data-xdbc-regex-input="^\d*$"  (always validated on every keystroke, regardless of data-xdbc-validate-on)
registerDOMContract("regex-input", (value, attr) => {
	let rx: RegExp;
	try {
		rx = new RegExp(attr);
	} catch {
		return `[XDBC] Invalid RegExp pattern: "${attr}"`;
	}
	return REGEX.checkAlgorithm(value, rx);
});

// data-xdbc-type="string|number"
registerDOMContract("type", (value, attr) => TYPE.checkAlgorithm(value, attr));
registerDOMContract("type-input", (value, attr) => TYPE.checkAlgorithm(value, attr));

// data-xdbc-eq="hello"
registerDOMContract("eq", (value, attr) =>
	EQ.checkAlgorithm(value, attr as unknown as object, false),
);
registerDOMContract("eq-input", (value, attr) =>
	EQ.checkAlgorithm(value, attr as unknown as object, false),
);

// data-xdbc-different="forbidden"
registerDOMContract("different", (value, attr) =>
	EQ.checkAlgorithm(value, attr as unknown as object, true),
);
registerDOMContract("different-input", (value, attr) =>
	EQ.checkAlgorithm(value, attr as unknown as object, true),
);

// data-xdbc-defined  (attribute presence is enough; value ignored)
registerDOMContract("defined", (value) => DEFINED.checkAlgorithm(value));
registerDOMContract("defined-input", (value) => DEFINED.checkAlgorithm(value));

// data-xdbc-undefined
registerDOMContract("undefined", (value) => UNDEFINED.checkAlgorithm(value));
registerDOMContract("undefined-input", (value) => UNDEFINED.checkAlgorithm(value));

// data-xdbc-greater="5"
registerDOMContract("greater", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), false, false),
);
registerDOMContract("greater-input", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), false, false),
);

// data-xdbc-greater-or-equal="5"
registerDOMContract("greater-or-equal", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), true, false),
);
registerDOMContract("greater-or-equal-input", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), true, false),
);

// data-xdbc-less="100"
registerDOMContract("less", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), false, true),
);
registerDOMContract("less-input", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), false, true),
);

// data-xdbc-less-or-equal="100"
registerDOMContract("less-or-equal", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), true, true),
);
registerDOMContract("less-or-equal-input", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), true, true),
);

// data-xdbc-or="regex:^\d+$;;type:string;;eq:42"
// Fragments are separated by ";;". Each fragment is "<contract-key>:<attr-value>",
// where the split is on the FIRST ":" only, so colons in the value (e.g. regex) are safe.
// The OR passes as long as at least one fragment passes.
registerDOMContract("or", (value, attr) => {
	const fragments = attr.split(";;");
	const messages: string[] = [];
	for (const fragment of fragments) {
		const colonIdx = fragment.indexOf(":");
		const key =
			colonIdx === -1 ? fragment.trim() : fragment.slice(0, colonIdx).trim();
		const fragAttr = colonIdx === -1 ? "" : fragment.slice(colonIdx + 1);
		const checkFn = registry.get(key);
		if (!checkFn) {
			console.warn(`[XDBC] data-xdbc-or: unknown contract key "${key}"`);
			continue;
		}
		const result = checkFn(value, fragAttr);
		if (result === true) return true; // short-circuit on first pass
		if (typeof result === "string") messages.push(result);
	}
	return messages.length > 0
		? `Value did not satisfy any of: ${messages.join(" | ")}`
		: true;
});

// data-xdbc-or-input (same fragment syntax as data-xdbc-or, always fires on every keystroke)
registerDOMContract("or-input", (value, attr) => {
	const fragments = attr.split(";;");
	const messages: string[] = [];
	for (const fragment of fragments) {
		const colonIdx = fragment.indexOf(":");
		const key =
			colonIdx === -1 ? fragment.trim() : fragment.slice(0, colonIdx).trim();
		const fragAttr = colonIdx === -1 ? "" : fragment.slice(colonIdx + 1);
		const checkFn = registry.get(key);
		if (!checkFn) {
			console.warn(`[XDBC] data-xdbc-or-input: unknown contract key "${key}"`);
			continue;
		}
		const result = checkFn(value, fragAttr);
		if (result === true) return true;
		if (typeof result === "string") messages.push(result);
	}
	return messages.length > 0
		? `Value did not satisfy any of: ${messages.join(" | ")}`
		: true;
});

// ─── scanDOM ──────────────────────────────────────────────────────────────────

/**
 * Scans the given **root** for `<input>` and `<textarea>` elements that carry at least one
 * `data-xdbc-*` attribute, and binds XDBC contracts to their DOM events (blur by
 * default; configurable per element via `data-xdbc-validate-on`).
 *
 * ### Supported attributes
 *
 * | Attribute                  | Example value              | Contract        |
 * |----------------------------|----------------------------|-----------------|
 * | `data-xdbc`                | *(DBC path, optional)*      | custom DBC instance path (default: `WaXCode.DBC`) |
 * | `data-xdbc-validate-on`         | `input` \| `blur`           | when to validate default contracts (default: `blur`) |
 * | `data-xdbc-regex`               | `^[a-z]+\.[a-z]{2,}$`      | {@link REGEX} — validated per `data-xdbc-validate-on` |
 * | `data-xdbc-regex-input`         | `^[a-zA-Z0-9.\-]*$`        | {@link REGEX} — always on every keystroke |
 * | `data-xdbc-type`                | `string\|number`            | {@link TYPE}    |
 * | `data-xdbc-type-input`          | `string\|number`            | {@link TYPE} — always on every keystroke |
 * | `data-xdbc-eq`                  | `hello`                     | {@link EQ}      |
 * | `data-xdbc-eq-input`            | `hello`                     | {@link EQ} — always on every keystroke |
 * | `data-xdbc-different`           | `forbidden`                 | {@link EQ} (inverted) |
 * | `data-xdbc-different-input`     | `forbidden`                 | {@link EQ} (inverted) — always on every keystroke |
 * | `data-xdbc-defined`             | *(no value needed)*         | {@link DEFINED} |
 * | `data-xdbc-defined-input`       | *(no value needed)*         | {@link DEFINED} — always on every keystroke |
 * | `data-xdbc-undefined`           | *(no value needed)*         | {@link UNDEFINED} |
 * | `data-xdbc-undefined-input`     | *(no value needed)*         | {@link UNDEFINED} — always on every keystroke |
 * | `data-xdbc-greater`             | `5`                         | {@link COMPARISON} |
 * | `data-xdbc-greater-input`       | `5`                         | {@link COMPARISON} — always on every keystroke |
 * | `data-xdbc-greater-or-equal`    | `5`                         | {@link COMPARISON} |
 * | `data-xdbc-greater-or-equal-input` | `5`                      | {@link COMPARISON} — always on every keystroke |
 * | `data-xdbc-less`                | `100`                       | {@link COMPARISON} |
 * | `data-xdbc-less-input`          | `100`                       | {@link COMPARISON} — always on every keystroke |
 * | `data-xdbc-less-or-equal`       | `100`                       | {@link COMPARISON} |
 * | `data-xdbc-less-or-equal-input` | `100`                       | {@link COMPARISON} — always on every keystroke |
 * | `data-xdbc-or`                  | `regex:^\d+$;;type:string`  | {@link OR} (fragment syntax) |
 * | `data-xdbc-or-input`            | `regex:^\d+$;;eq:N/A`       | {@link OR} — always on every keystroke |
 *
 * Use {@link registerDOMContract } to add further contracts at any time.
 *
 * ### OR fragment syntax
 *
 * Fragments are separated by `;;`. Each fragment is `<contract-key>:<value>`, where the
 * split is on the **first** `:` only, so colons inside values (e.g. regex) are safe.
 * The OR passes as long as **at least one** fragment passes.
 *
 * ```html
 * <!-- digits OR exactly "N/A" -->
 * <input data-xdbc data-xdbc-or="regex:^\d+$;;eq:N/A" />
 * ```
 *
 * ### Behaviour on infringement
 *
 * 1. The element's value is **reverted** to the last accepted state (blocking the invalid input).
 * 2. The configured DBC instance's infringement settings are honoured — `logToConsole`,
 *    `onInfringement`, and `throwException` all fire in the usual order. Any throw is caught
 *    internally so it cannot propagate out of the DOM event handler.
 *
 * ### IME / composition awareness
 *
 * Validation is suspended during IME composition (e.g. CJK input) and runs once after
 * `compositionend`, so partially composed characters are never incorrectly rejected.
 *
 * @param root  Element or Document to scan (default: `document`).
 * @returns     A cleanup function that removes all bound event listeners.
 *
 * ### Validate-on
 *
 * By default all contracts are validated when focus **leaves** the field (`blur`). This lets
 * users type freely and only enforces the contract on completion. Set
 * `data-xdbc-validate-on="input"` on an element to revert invalid input on every keystroke.
 *
 * ### Progressive + whole-value validation
 *
 * Use `data-xdbc-regex-input` alongside `data-xdbc-regex` to apply two different patterns:
 * one that allows partial input during typing, and one that enforces the full format on blur.
 * `data-xdbc-regex-input` always fires on every `input` event, regardless of
 * `data-xdbc-validate-on`.
 *
 * ```html
 * <!-- Only validate full domain format when leaving the field (default blur behaviour) -->
 * <!-- While typing, only allow characters that could appear in a domain name -->
 * <input type="text" data-xdbc
 *        data-xdbc-regex="^[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$"
 *        data-xdbc-regex-input="^[a-zA-Z0-9.\-]*$" />
 *
 * <!-- Block non-digit keystrokes in real time (explicit input-time validation) -->
 * <input type="text" data-xdbc data-xdbc-validate-on="input" data-xdbc-regex="^\d*$" />
 * ```
 *
 * @example
 * ```html
 * <input type="text" data-xdbc data-xdbc-regex="^[a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$" />
 * <input type="text" data-xdbc="MyApp.DBC" data-xdbc-type="string" data-xdbc-greater="0" />
 * <input type="text" data-xdbc data-xdbc-or="regex:^\d+$;;eq:N/A" />
 * <textarea data-xdbc data-xdbc-regex="^[\w\s]*$"></textarea>
 * ```
 * ```ts
 * import { scanDOM, registerDOMContract } from "xdbc/DBC/DOM";
 *
 * const cleanup = scanDOM();
 * // later:
 * cleanup();
 * ```
 */
export function scanDOM(root: Element | Document = document): () => void {
	const bound: BoundEntry[] = [];

	const elements = Array.from(
		root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
			"input, textarea",
		),
	);

	for (const el of elements) {
		const dbcPath = el.dataset.xdbc || "WaXCode.DBC";

		// Collect contracts: keys ending in "-input" always fire on the input event;
		// all others respect data-xdbc-validate-on (default: blur).
		const checksDefault: Array<{ checkFn: DOMContractCheck; attrValue: string }> =
			[];
		const checksInput: Array<{ checkFn: DOMContractCheck; attrValue: string }> =
			[];

		for (const [key, checkFn] of registry) {
			// dataset converts "xdbc-greater-or-equal" → "xdbcGreaterOrEqual" via camelCase.
			// Build the camelCase key from the registry key.
			const datasetKey = `xdbc${key
				.split("-")
				.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
				.join("")}`;
			if (datasetKey in el.dataset) {
				const entry = { checkFn, attrValue: el.dataset[datasetKey] ?? "" };
				if (key.endsWith("-input")) {
					checksInput.push(entry);
				} else {
					checksDefault.push(entry);
				}
			}
		}

		if (checksDefault.length === 0 && checksInput.length === 0) continue;

		const validateOn =
			(el.dataset.xdbcValidateOn ?? "blur") === "input" ? "input" : "blur";

		// lastInputValid: revert target when a -input check fails on a keystroke.
		//   Updated whenever checksInput passes.
		// lastBlurValid:  revert target when a blur/default check fails.
		//   Updated only when all checks (checksInput + checksDefault) pass together.
		let lastInputValid = el.value;
		let lastBlurValid = el.value;
		let composing = false;

		// Runs checks against the current el.value.
		// revertTo: the value to restore on failure (pass null to skip revert/report).
		// Returns true when all checks pass.
		const runChecks = (
			checksToRun: Array<{ checkFn: DOMContractCheck; attrValue: string }>,
			revertTo: string | null,
		): boolean => {
			const value = el.value;
			for (const { checkFn, attrValue } of checksToRun) {
				const result = checkFn(value, attrValue);
				if (typeof result === "string") {
					if (revertTo !== null) {
						el.value = revertTo;
						try {
							DBC.getRegistered(dbcPath).reportParameterInfringement(
								result,
								el,
								undefined,
								el.name || el.id || "input",
								0,
								value,
							);
						} catch {
							// swallowed — throwException must not propagate out of a DOM event handler
						}
					}
					return false;
				}
			}
			return true;
		};

		// checksInput always runs with revert + report.
		// checksDefault:
		//   • When includeDefault is true (blur event or validateOn==="input"):
		//     runs with full revert + report; on pass commits both lastInputValid and lastBlurValid.
		//   • When includeDefault is false (input event, blur mode):
		//     silently probed (no revert, no report) to track the last "fully valid" state
		//     so the blur listener can always revert to a sensible value.
		const doValidate = (includeDefault: boolean) => {
			if (!runChecks(checksInput, lastInputValid)) return;
			// checksInput passed → this is a safe keystroke revert target going forward
			lastInputValid = el.value;

			if (checksDefault.length === 0) {
				lastBlurValid = el.value;
				return;
			}

			if (includeDefault) {
				if (runChecks(checksDefault, lastBlurValid)) {
					lastBlurValid = el.value;
				}
			} else {
				// Silent probe: let partial input through but track last fully-valid state
				if (runChecks(checksDefault, null)) {
					lastBlurValid = el.value;
				}
			}
		};

		const inputListener = () => {
			if (composing) return;
			doValidate(validateOn === "input");
		};

		const blurListener =
			checksDefault.length > 0 && validateOn === "blur"
				? () => {
					doValidate(true);
				}
				: null;

		const compositionStartListener = () => {
			composing = true;
		};

		const compositionEndListener = () => {
			composing = false;
			doValidate(validateOn === "input");
		};

		el.addEventListener("input", inputListener);
		if (blurListener) el.addEventListener("blur", blurListener);
		el.addEventListener("compositionstart", compositionStartListener);
		el.addEventListener("compositionend", compositionEndListener);

		bound.push({
			element: el,
			inputListener,
			blurListener,
			compositionStartListener,
			compositionEndListener,
		});
	}

	return () => {
		for (const {
			element,
			inputListener,
			blurListener,
			compositionStartListener,
			compositionEndListener,
		} of bound) {
			element.removeEventListener("input", inputListener);
			if (blurListener) element.removeEventListener("blur", blurListener);
			element.removeEventListener("compositionstart", compositionStartListener);
			element.removeEventListener("compositionend", compositionEndListener);
		}
	};
}
