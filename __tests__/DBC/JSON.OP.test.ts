import { JSON_OP } from "../../src/DBC/JSON.OP";

describe("JSON.OP", () => {
	const jsonOP = new JSON_OP([
		{ name: "x", type: "string" },
		{ name: "y", type: "number" },
	]);

	test("Should not report infringement with { x: 'x', y: 1 } to check", () => {
		expect(jsonOP.check({ x: "x", y: 1 })).toBe(true);
	});

	test("Should report infringement with { x: 1 } to check", () => {
		expect(typeof jsonOP.check({ x: 1 })).toBe("string");
	});

	test("Should not report infringement with [{ x: 'x', y: 1 },{ x: 'xs', y: 2 }] to check in 'checkElements' mode", () => {
		expect(
			new JSON_OP(
				[
					{ name: "x", type: "string" },
					{ name: "y", type: "number" },
				],
				true,
			).check([
				{ x: "x", y: 1 },
				{ x: "xs", y: 2 },
			]),
		).toBe(true);
	});

	test("Should report infringement with [{ x: 'x', y: 1 },{ x: 'xs', y: 2 }] to check with no 'checkElements' mode", () => {
		expect(
			typeof new JSON_OP([
				{ name: "x", type: "string" },
				{ name: "y", type: "number" },
			]).check([
				{ x: "x", y: 1 },
				{ x: "xs", y: 2 },
			]),
		).toBe("string");
	});

	test("Should report infringement with [] to check", () => {
		expect(typeof jsonOP.check([])).toBe("string");
	});
});
