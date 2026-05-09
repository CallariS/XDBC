import { DBC } from "../DBC";
import { REGEX } from "./REGEX";

type BoundEntry = {
	element: HTMLInputElement | HTMLTextAreaElement;
	inputListener: () => void;
	compositionStartListener: () => void;
	compositionEndListener: () => void;
};

/**
 * Scans the given **root** for `<input>` and `<textarea>` elements marked with the
 * `data-xdbc` attribute, and binds XDBC contracts to their `input` events (covering
 * keyboard, paste, IME / mobile on-screen keyboard, voice input, and autofill).
 *
 * ### Supported attributes
 *
 * | Attribute          | Description                                                                 |
 * |--------------------|-----------------------------------------------------------------------------|
 * | `data-xdbc`        | **Required** marker. Optional value = the DBC-instance path (default `"WaXCode.DBC"`). |
 * | `data-xdbc-regex`  | Applies a {@link REGEX } contract. Attribute value is the RegExp pattern string. |
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
 * <input type="text" data-xdbc="MyApp.DBC" data-xdbc-regex="^[A-Z]{0,5}$" />
 * <textarea data-xdbc data-xdbc-regex="^[\w\s]*$"></textarea>
 * ```
 * ```ts
 * import { scanDOM } from "xdbc/DBC/DOM";
 *
 * const cleanup = scanDOM(); // scans entire document
 * // later, e.g. on component unmount:
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
		const regexPattern = el.dataset.xdbcRegex;

		// No supported contract attributes configured — nothing to bind.
		if (!regexPattern) continue;

		let regex: RegExp;
		try {
			regex = new RegExp(regexPattern);
		} catch {
			console.warn(
				"[XDBC] Invalid regular expression in data-xdbc-regex on element",
				el,
				`: "${regexPattern}"`,
			);
			continue;
		}

		let lastValid = el.value;
		let composing = false;

		const inputListener = () => {
			if (composing) return;
			const value = el.value;
			const result = REGEX.checkAlgorithm(value, regex);
			if (typeof result === "string") {
				// Block: revert to last accepted value.
				el.value = lastValid;
				// Report: honour the DBC instance's infringement settings.
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
					// throwException:true would normally propagate — swallowed here because
					// throwing from a DOM event handler would be unhandled.
				}
			} else {
				lastValid = value;
			}
		};

		const compositionStartListener = () => {
			composing = true;
		};

		const compositionEndListener = () => {
			composing = false;
			// Validate the fully composed value now that composition is complete.
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
