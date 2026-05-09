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

// data-xdbc-type="string|number"
registerDOMContract("type", (value, attr) => TYPE.checkAlgorithm(value, attr));

// data-xdbc-eq="hello"
registerDOMContract("eq", (value, attr) =>
	EQ.checkAlgorithm(value, attr as unknown as object, false),
);

// data-xdbc-different="forbidden"
registerDOMContract("different", (value, attr) =>
	EQ.checkAlgorithm(value, attr as unknown as object, true),
);

// data-xdbc-defined  (attribute presence is enough; value ignored)
registerDOMContract("defined", (value) => DEFINED.checkAlgorithm(value));

// data-xdbc-undefined
registerDOMContract("undefined", (value) => UNDEFINED.checkAlgorithm(value));

// data-xdbc-greater="5"
registerDOMContract("greater", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), false, false),
);

// data-xdbc-greater-or-equal="5"
registerDOMContract("greater-or-equal", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), true, false),
);

// data-xdbc-less="100"
registerDOMContract("less", (value, attr) =>
	COMPARISON.checkAlgorithm(Number(value), Number(attr), false, true),
);

// data-xdbc-less-or-equal="100"
registerDOMContract("less-or-equal", (value, attr) =>
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

// ─── scanDOM ──────────────────────────────────────────────────────────────────

/**
 * Scans the given **root** for `<input>` and `<textarea>` elements marked with the
 * `data-xdbc` attribute, and binds XDBC contracts to their `input` events (covering
 * keyboard, paste, IME / mobile on-screen keyboard, voice input, and autofill).
 *
 * ### Supported attributes
 *
 * | Attribute                  | Example value              | Contract        |
 * |----------------------------|----------------------------|-----------------|
 * | `data-xdbc`                | *(path or empty)*          | marker / DBC path |
 * | `data-xdbc-regex`          | `^\d*$`                    | {@link REGEX}   |
 * | `data-xdbc-type`           | `string\|number`           | {@link TYPE}    |
 * | `data-xdbc-eq`             | `hello`                    | {@link EQ}      |
 * | `data-xdbc-different`      | `forbidden`                | {@link EQ} (inverted) |
 * | `data-xdbc-defined`        | *(no value needed)*        | {@link DEFINED} |
 * | `data-xdbc-undefined`      | *(no value needed)*        | {@link UNDEFINED} |
 * | `data-xdbc-greater`        | `5`                        | {@link COMPARISON} |
 * | `data-xdbc-greater-or-equal` | `5`                      | {@link COMPARISON} |
 * | `data-xdbc-less`           | `100`                      | {@link COMPARISON} |
 * | `data-xdbc-less-or-equal`  | `100`                      | {@link COMPARISON} |
 * | `data-xdbc-or`             | `regex:^\d+$;;type:string` | {@link OR} (fragment syntax) |
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
 * @example
 * ```html
 * <input type="text" data-xdbc data-xdbc-regex="^\d*$" />
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
			"[data-xdbc]",
		),
	);

	for (const el of elements) {
		const dbcPath = el.dataset.xdbc || "WaXCode.DBC";

		// Collect every registered contract that has a corresponding attribute on this element.
		const checks: Array<{ checkFn: DOMContractCheck; attrValue: string }> = [];
		for (const [key, checkFn] of registry) {
			// dataset converts "xdbc-greater-or-equal" → "xdbcGreaterOrEqual" via camelCase.
			// Build the camelCase key from the registry key.
			const datasetKey = `xdbc${key
				.split("-")
				.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
				.join("")}`;
			if (datasetKey in el.dataset) {
				checks.push({ checkFn, attrValue: el.dataset[datasetKey] ?? "" });
			}
		}

		if (checks.length === 0) continue;

		let lastValid = el.value;
		let composing = false;

		const inputListener = () => {
			if (composing) return;
			const value = el.value;
			for (const { checkFn, attrValue } of checks) {
				const result = checkFn(value, attrValue);
				if (typeof result === "string") {
					el.value = lastValid;
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
					return; // stop checking further contracts once one fails
				}
			}
			lastValid = value;
		};

		const compositionStartListener = () => {
			composing = true;
		};

		const compositionEndListener = () => {
			composing = false;
			inputListener();
		};

		el.addEventListener("input", inputListener);
		el.addEventListener("compositionstart", compositionStartListener);
		el.addEventListener("compositionend", compositionEndListener);

		bound.push({
			element: el,
			inputListener,
			compositionStartListener,
			compositionEndListener,
		});
	}

	return () => {
		for (const {
			element,
			inputListener,
			compositionStartListener,
			compositionEndListener,
		} of bound) {
			element.removeEventListener("input", inputListener);
			element.removeEventListener("compositionstart", compositionStartListener);
			element.removeEventListener("compositionend", compositionEndListener);
		}
	};
}
