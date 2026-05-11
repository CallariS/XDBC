import { DBC } from "../../src/DBC";
import { registerDOMContract, scanDOM } from "../../src/DBC/DOM";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates an <input> with the given attributes, appends it to document.body, and returns it. */
function makeInput(attrs: Record<string, string>): HTMLInputElement {
	const el = document.createElement("input");
	el.type = "text";
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v);
	}
	document.body.appendChild(el);
	return el;
}

/** Fires an "input" event on the element (simulates any user input change). */
function fireInput(
	el: HTMLInputElement | HTMLTextAreaElement,
	newValue: string,
): void {
	el.value = newValue;
	el.dispatchEvent(new Event("input"));
}

/** Fires a "blur" event on the element. */
function fireBlur(el: HTMLInputElement | HTMLTextAreaElement): void {
	el.dispatchEvent(new Event("blur"));
}

/** Fires compositionstart → sets value → compositionend → input (simulates IME). */
function fireIME(el: HTMLInputElement, composed: string): void {
	el.dispatchEvent(new Event("compositionstart"));
	el.value = composed;
	el.dispatchEvent(new Event("compositionend"));
	el.dispatchEvent(new Event("input"));
}

beforeEach(() => {
	// Clean up any elements added during a test.
	document.body.innerHTML = "";
});

// ─── scanDOM — basic binding ───────────────────────────────────────────────────

describe("scanDOM — basic binding", () => {
	test("returns a cleanup function", () => {
		const cleanup = scanDOM();
		expect(typeof cleanup).toBe("function");
		cleanup();
	});

	test("ignores elements without data-xdbc", () => {
		const el = makeInput({ "data-xdbc-regex": "^\\d*$" }); // no data-xdbc marker
		const cleanup = scanDOM();
		fireInput(el, "abc");
		expect(el.value).toBe("abc"); // not blocked
		cleanup();
	});

	test("ignores data-xdbc elements that have no recognised contract attribute", () => {
		const el = makeInput({ "data-xdbc": "" }); // marker only
		const cleanup = scanDOM();
		fireInput(el, "anything");
		expect(el.value).toBe("anything");
		cleanup();
	});

	test("cleanup removes all listeners — further blur is no longer validated", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^\\d*$" });
		const cleanup = scanDOM();
		cleanup();
		el.value = "abc";
		fireBlur(el); // would revert if listener was still attached
		expect(el.value).toBe("abc");
	});

	test("can scan a sub-element instead of the whole document", () => {
		const container = document.createElement("div");
		document.body.appendChild(container);
		const inside = document.createElement("input");
		inside.setAttribute("data-xdbc", "");
		inside.setAttribute("data-xdbc-regex", "^\\d*$");
		container.appendChild(inside);
		const outside = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^\\d*$" });

		const cleanup = scanDOM(container);
		fireInput(inside, "abc");
		fireBlur(inside);
		expect(inside.value).toBe(""); // blocked on blur
		fireInput(outside, "abc");
		fireBlur(outside);
		expect(outside.value).toBe("abc"); // NOT scanned
		cleanup();
	});
});

// ─── data-xdbc-regex ──────────────────────────────────────────────────────────

describe("data-xdbc-regex", () => {
	test("accepts a valid value", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^\\d*$" });
		const cleanup = scanDOM();
		fireInput(el, "123");
		expect(el.value).toBe("123");
		cleanup();
	});

	test("reverts an invalid value to the last valid state", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^\\d*$" });
		// el.value is "" when scanDOM() runs, so lastValid starts as ""
		const cleanup = scanDOM();
		fireInput(el, "1a");
		fireBlur(el);
		expect(el.value).toBe(""); // reverted to lastValid = "" on blur
		cleanup();
	});

	test("preserves the last valid value on revert", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^\\d*$" });
		const cleanup = scanDOM();
		fireInput(el, "42");
		fireBlur(el); // commits "42" as lastValid
		fireInput(el, "42x");
		fireBlur(el);
		expect(el.value).toBe("42");
		cleanup();
	});

	test("warns and skips element with invalid RegExp pattern", () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => { });
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "[invalid" });
		const cleanup = scanDOM();
		// Element still bound; invalid check returns error string, so value is reverted on blur
		fireInput(el, "anything");
		fireBlur(el);
		expect(el.value).toBe(""); // reverted
		warn.mockRestore();
		cleanup();
	});
});

// ─── data-xdbc-type ───────────────────────────────────────────────────────────

describe("data-xdbc-type", () => {
	test("accepts empty string (TYPE skips null/undefined/empty)", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-type": "number" });
		const cleanup = scanDOM();
		fireInput(el, "");
		expect(el.value).toBe("");
		cleanup();
	});

	test("accepts a value matching the type", () => {
		// All input values are strings — TYPE 'string' always passes for non-empty input
		const el = makeInput({ "data-xdbc": "", "data-xdbc-type": "string" });
		const cleanup = scanDOM();
		fireInput(el, "hello");
		expect(el.value).toBe("hello");
		cleanup();
	});
});

// ─── data-xdbc-eq ─────────────────────────────────────────────────────────────

describe("data-xdbc-eq", () => {
	test("accepts the exact configured value", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-eq": "secret" });
		const cleanup = scanDOM();
		fireInput(el, "secret");
		expect(el.value).toBe("secret");
		cleanup();
	});

	test("reverts when value does not match", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-eq": "secret" });
		const cleanup = scanDOM();
		fireInput(el, "other");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});
});

// ─── data-xdbc-different ──────────────────────────────────────────────────────

describe("data-xdbc-different", () => {
	test("accepts a value that differs from the configured value", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-different": "forbidden",
		});
		const cleanup = scanDOM();
		fireInput(el, "allowed");
		expect(el.value).toBe("allowed");
		cleanup();
	});

	test("reverts the forbidden value", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-different": "forbidden",
		});
		const cleanup = scanDOM();
		fireInput(el, "forbidden");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});
});

// ─── data-xdbc-defined ────────────────────────────────────────────────────────

describe("data-xdbc-defined", () => {
	test("accepts a non-empty string", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-defined": "" });
		const cleanup = scanDOM();
		fireInput(el, "hello");
		expect(el.value).toBe("hello");
		cleanup();
	});
});

// ─── data-xdbc-greater / less / or-equal variants ────────────────────────────

describe("data-xdbc-greater", () => {
	test("accepts a value greater than the threshold", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-greater": "5" });
		const cleanup = scanDOM();
		fireInput(el, "10");
		expect(el.value).toBe("10");
		cleanup();
	});

	test("reverts a value equal to the threshold (strict greater)", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-greater": "5" });
		const cleanup = scanDOM();
		fireInput(el, "5");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});

	test("reverts a value less than the threshold", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-greater": "5" });
		const cleanup = scanDOM();
		fireInput(el, "3");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});
});

describe("data-xdbc-greater-or-equal", () => {
	test("accepts a value equal to the threshold", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-greater-or-equal": "5",
		});
		const cleanup = scanDOM();
		fireInput(el, "5");
		expect(el.value).toBe("5");
		cleanup();
	});

	test("reverts a value below the threshold", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-greater-or-equal": "5",
		});
		const cleanup = scanDOM();
		fireInput(el, "4");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});
});

describe("data-xdbc-less", () => {
	test("accepts a value less than the threshold", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-less": "10" });
		const cleanup = scanDOM();
		fireInput(el, "3");
		expect(el.value).toBe("3");
		cleanup();
	});

	test("reverts a value equal to the threshold (strict less)", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-less": "10" });
		const cleanup = scanDOM();
		fireInput(el, "10");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});
});

describe("data-xdbc-less-or-equal", () => {
	test("accepts a value equal to the threshold", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-less-or-equal": "10" });
		const cleanup = scanDOM();
		fireInput(el, "10");
		expect(el.value).toBe("10");
		cleanup();
	});

	test("reverts a value above the threshold", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-less-or-equal": "10" });
		const cleanup = scanDOM();
		fireInput(el, "11");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});
});

// ─── data-xdbc-or ─────────────────────────────────────────────────────────────

describe("data-xdbc-or", () => {
	test("passes when the first fragment matches", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-or": "regex:^\\d+$;;eq:N/A",
		});
		const cleanup = scanDOM();
		fireInput(el, "123");
		expect(el.value).toBe("123");
		cleanup();
	});

	test("passes when the second fragment matches", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-or": "regex:^\\d+$;;eq:N/A",
		});
		const cleanup = scanDOM();
		fireInput(el, "N/A");
		expect(el.value).toBe("N/A");
		cleanup();
	});

	test("reverts when no fragment matches", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-or": "regex:^\\d+$;;eq:N/A",
		});
		const cleanup = scanDOM();
		fireInput(el, "abc");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});

	test("colons inside a regex value are handled correctly", () => {
		// "regex:^https?://" — colon after first split position belongs to the pattern
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-or": "regex:^https?://;;eq:N/A",
		});
		const cleanup = scanDOM();
		fireInput(el, "https://example.com");
		fireBlur(el); // commits "https://example.com" as lastValid
		expect(el.value).toBe("https://example.com");
		// ftp:// fails both fragments
		fireInput(el, "ftp://nope");
		fireBlur(el);
		expect(el.value).toBe("https://example.com"); // reverted to last valid
		cleanup();
	});

	test("warns and skips an unknown contract key in or fragment", () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => { });
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-or": "unknown:foo;;eq:ok",
		});
		const cleanup = scanDOM();
		fireInput(el, "ok");
		expect(el.value).toBe("ok"); // eq:ok passes
		warn.mockRestore();
		cleanup();
	});
});

// ─── Multiple contracts on one element ────────────────────────────────────────

describe("multiple contracts on one element", () => {
	test("all must pass — first failure blocks and reverts", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-regex": "^\\d+$",
			"data-xdbc-greater": "0",
			"data-xdbc-less-or-equal": "100",
		});
		const cleanup = scanDOM();
		fireInput(el, "50");
		fireBlur(el); // commits "50" as lastValid
		expect(el.value).toBe("50");
		fireInput(el, "150"); // fails less-or-equal
		fireBlur(el);
		expect(el.value).toBe("50");
		fireInput(el, "abc"); // fails regex
		fireBlur(el);
		expect(el.value).toBe("50");
		cleanup();
	});
});

// ─── onInfringement integration ───────────────────────────────────────────────

describe("scanDOM — onInfringement integration", () => {
	test("fires onInfringement callback with precondition context on invalid input", () => {
		const spy = jest.fn();
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = false;
			dbc.infringementSettings.onInfringement = spy;
			const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^\\d*$" });
			const cleanup = scanDOM();
			fireInput(el, "abc");
			fireBlur(el); // validation (and callback) fires on blur by default
			cleanup();
		});
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][1].type).toBe("precondition");
		expect(spy.mock.calls[0][1].value).toBe("abc");
	});

	test("does not fire onInfringement on valid input", () => {
		const spy = jest.fn();
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = false;
			dbc.infringementSettings.onInfringement = spy;
			const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^\\d*$" });
			const cleanup = scanDOM();
			fireInput(el, "123");
			cleanup();
		});
		expect(spy).not.toHaveBeenCalled();
	});

	test("throwException:true does not propagate out of the event handler", () => {
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = true;
			const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^\\d*$" });
			const cleanup = scanDOM();
			fireInput(el, "abc");
			expect(() => fireBlur(el)).not.toThrow();
			cleanup();
		});
	});
});

// ─── IME / composition ────────────────────────────────────────────────────────

describe("scanDOM — IME / composition", () => {
	test("does not validate mid-composition, validates on compositionend", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": "^[a-z]*$" });
		const cleanup = scanDOM();
		// Simulate typing a valid composed value
		fireIME(el, "hello");
		expect(el.value).toBe("hello");
		cleanup();
	});

	test("reverts invalid value after compositionend when validateOn is input", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-validate-on": "input",
			"data-xdbc-regex": "^[a-z]*$",
		});
		const cleanup = scanDOM();
		fireIME(el, "123"); // invalid after composition
		expect(el.value).toBe("");
		cleanup();
	});
});

// ─── registerDOMContract ──────────────────────────────────────────────────────

describe("registerDOMContract", () => {
	test("a custom registered contract is picked up by scanDOM", () => {
		registerDOMContract("test-max-length", (value, attr) =>
			value.length <= Number(attr) ? true : `Max length is ${attr}`,
		);
		const el = makeInput({ "data-xdbc": "", "data-xdbc-test-max-length": "5" });
		const cleanup = scanDOM();
		fireInput(el, "hello"); // length 5 — passes
		fireBlur(el); // commits "hello" as lastValid
		expect(el.value).toBe("hello");
		fireInput(el, "toolong"); // length 7 — fails
		fireBlur(el);
		expect(el.value).toBe("hello");
		cleanup();
	});
});

// ─── <textarea> support ───────────────────────────────────────────────────────

describe("textarea support", () => {
	test("works with <textarea> exactly like <input>", () => {
		const ta = document.createElement("textarea");
		ta.setAttribute("data-xdbc", "");
		ta.setAttribute("data-xdbc-regex", "^[a-z ]*$");
		document.body.appendChild(ta);
		const cleanup = scanDOM();
		ta.value = "hello";
		ta.dispatchEvent(new Event("input"));
		fireBlur(ta); // commits "hello" as lastValid
		expect(ta.value).toBe("hello");
		ta.value = "HELLO";
		ta.dispatchEvent(new Event("input"));
		fireBlur(ta);
		expect(ta.value).toBe("hello");
		cleanup();
	});
});

// ─── data-xdbc-validate-on ───────────────────────────────────────────────────

describe("data-xdbc-validate-on", () => {
	const DOMAIN_REGEX = "^[a-zA-Z0-9][a-zA-Z0-9.\\-]*\\.[a-zA-Z]{2,}$";

	// ── default behaviour: blur ───────────────────────────────────────────────

	test("default: allows partial input during typing", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": DOMAIN_REGEX });
		const cleanup = scanDOM();
		fireInput(el, "e");
		expect(el.value).toBe("e");
		fireInput(el, "example.c");
		expect(el.value).toBe("example.c"); // still not a valid domain, but not reverted
		cleanup();
	});

	test("default: accepts a complete valid value on blur", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": DOMAIN_REGEX });
		const cleanup = scanDOM();
		fireInput(el, "example.com");
		fireBlur(el);
		expect(el.value).toBe("example.com");
		cleanup();
	});

	test("default: reverts to last valid value on blur when value is invalid", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": DOMAIN_REGEX });
		const cleanup = scanDOM();
		fireInput(el, "example.com");
		fireBlur(el); // commits "example.com"
		fireInput(el, "notadomain");
		fireBlur(el);
		expect(el.value).toBe("example.com");
		cleanup();
	});

	test("default: reverts to empty string when no valid value was ever committed", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-regex": DOMAIN_REGEX });
		const cleanup = scanDOM();
		fireInput(el, "notadomain");
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});

	// ── explicit "input" mode ─────────────────────────────────────────────────

	test('"input": reverts invalid value on every keystroke', () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-validate-on": "input",
			"data-xdbc-regex": "^\\d*$",
		});
		const cleanup = scanDOM();
		fireInput(el, "abc");
		expect(el.value).toBe("");
		cleanup();
	});

	test('"input": allows a valid value through without needing blur', () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-validate-on": "input",
			"data-xdbc-regex": "^\\d*$",
		});
		const cleanup = scanDOM();
		fireInput(el, "123");
		expect(el.value).toBe("123");
		cleanup();
	});
});

// ─── data-xdbc-regex-input ───────────────────────────────────────────────────

describe("data-xdbc-regex-input", () => {
	const DOMAIN_REGEX = "^[a-zA-Z0-9][a-zA-Z0-9.\\-]*\\.[a-zA-Z]{2,}$";
	const DOMAIN_CHARS = "^[a-zA-Z0-9.\\-]*$";

	test("blocks disallowed characters on every keystroke", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-regex-input": DOMAIN_CHARS,
		});
		const cleanup = scanDOM();
		fireInput(el, "exam"); // valid chars
		expect(el.value).toBe("exam");
		fireInput(el, "exam ple"); // space is not allowed
		expect(el.value).toBe("exam");
		cleanup();
	});

	test("allows partial input that passes the keystroke regex but not the blur regex", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-regex": DOMAIN_REGEX,
			"data-xdbc-regex-input": DOMAIN_CHARS,
		});
		const cleanup = scanDOM();
		// "example" has valid chars but is not a complete domain — keystroke check passes, blur check deferred
		fireInput(el, "example");
		expect(el.value).toBe("example");
		cleanup();
	});

	test("reverts invalid chars on keystroke and reverts incomplete value on blur", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-regex": DOMAIN_REGEX,
			"data-xdbc-regex-input": DOMAIN_CHARS,
		});
		const cleanup = scanDOM();
		// invalid char — reverted immediately
		fireInput(el, "ex ample");
		expect(el.value).toBe("");
		// valid partial — accepted while typing
		fireInput(el, "example");
		expect(el.value).toBe("example");
		// incomplete on blur — reverted to last blur-committed value ("")
		fireBlur(el);
		expect(el.value).toBe("");
		cleanup();
	});

	test("complete valid domain passes both keystroke and blur checks", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-regex": DOMAIN_REGEX,
			"data-xdbc-regex-input": DOMAIN_CHARS,
		});
		const cleanup = scanDOM();
		fireInput(el, "example.com");
		expect(el.value).toBe("example.com"); // chars ok, not yet blur-validated
		fireBlur(el);
		expect(el.value).toBe("example.com"); // full pattern ok too
		cleanup();
	});

	test("regex-input fires even when data-xdbc-validate-on is absent (blur default)", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-regex-input": "^\\d*$",
		});
		const cleanup = scanDOM();
		fireInput(el, "12");
		expect(el.value).toBe("12");
		fireInput(el, "12a");
		expect(el.value).toBe("12"); // reverted on input even though validate-on defaults to blur
		cleanup();
	});
});

// ─── -input variants for built-in contracts ───────────────────────────────────

describe("-input variants fire on every keystroke regardless of validate-on", () => {
	test("type-input: accepts string value on every keystroke (DOM values are always strings)", () => {
		// In DOM, input values are always JS strings, so type-input="string" always accepts
		// and type-input="number" always rejects. This test verifies the -input contract is
		// picked up and fires on every keystroke without waiting for blur.
		const el = makeInput({ "data-xdbc": "", "data-xdbc-type-input": "string" });
		const cleanup = scanDOM();
		fireInput(el, "hello");
		expect(el.value).toBe("hello"); // string → accepted immediately
		// Verify it really fires on keystroke and not only on blur
		fireInput(el, "world");
		expect(el.value).toBe("world");
		cleanup();
	});

	test("eq-input: blocks non-matching value on every keystroke", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-eq-input": "yes" });
		const cleanup = scanDOM();
		fireInput(el, "yes");
		expect(el.value).toBe("yes");
		fireInput(el, "no");
		expect(el.value).toBe("yes"); // reverted
		cleanup();
	});

	test("different-input: blocks forbidden value on every keystroke", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-different-input": "no" });
		const cleanup = scanDOM();
		fireInput(el, "yes");
		expect(el.value).toBe("yes");
		fireInput(el, "no");
		expect(el.value).toBe("yes"); // reverted
		cleanup();
	});

	test("greater-input: blocks value ≤ threshold on every keystroke", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-greater-input": "0" });
		const cleanup = scanDOM();
		fireInput(el, "1");
		expect(el.value).toBe("1");
		fireInput(el, "0");
		expect(el.value).toBe("1"); // reverted
		cleanup();
	});

	test("greater-or-equal-input: blocks value below threshold on every keystroke", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-greater-or-equal-input": "5",
		});
		const cleanup = scanDOM();
		fireInput(el, "5");
		expect(el.value).toBe("5");
		fireInput(el, "4");
		expect(el.value).toBe("5"); // reverted
		cleanup();
	});

	test("less-input: blocks value ≥ threshold on every keystroke", () => {
		const el = makeInput({ "data-xdbc": "", "data-xdbc-less-input": "10" });
		const cleanup = scanDOM();
		fireInput(el, "9");
		expect(el.value).toBe("9");
		fireInput(el, "10");
		expect(el.value).toBe("9"); // reverted
		cleanup();
	});

	test("less-or-equal-input: blocks value above threshold on every keystroke", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-less-or-equal-input": "10",
		});
		const cleanup = scanDOM();
		fireInput(el, "10");
		expect(el.value).toBe("10");
		fireInput(el, "11");
		expect(el.value).toBe("10"); // reverted
		cleanup();
	});

	test("or-input: passes when any fragment matches, reverts on keystroke when none do", () => {
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-or-input": "regex:^\\d+$;;eq:N/A",
		});
		const cleanup = scanDOM();
		fireInput(el, "42");
		expect(el.value).toBe("42");
		fireInput(el, "N/A");
		expect(el.value).toBe("N/A");
		fireInput(el, "abc");
		expect(el.value).toBe("N/A"); // reverted on keystroke
		cleanup();
	});

	test("combining -input (keystroke) and plain (blur) contracts works independently", () => {
		// greater-input blocks ≤ 0 on every keystroke; less-or-equal only enforced on blur
		const el = makeInput({
			"data-xdbc": "",
			"data-xdbc-greater-input": "0",
			"data-xdbc-less-or-equal": "100",
		});
		const cleanup = scanDOM();
		fireInput(el, "50");
		expect(el.value).toBe("50"); // passes keystroke check; blur check deferred
		fireInput(el, "0");
		expect(el.value).toBe("50"); // ≤ 0 reverted immediately by -input
		fireInput(el, "150");
		expect(el.value).toBe("150"); // chars pass keystroke; blur check not yet run
		fireBlur(el);
		expect(el.value).toBe("50"); // > 100 reverted on blur (lastValid was "50")
		cleanup();
	});
});
