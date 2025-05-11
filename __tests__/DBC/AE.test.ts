import { AE } from "../../src/DBC/AE";
import { REGEX } from "../../src/DBC/REGEX";
import { EQ } from "../../src/DBC/EQ";

describe("AE", () => {
	const ae = new AE([new REGEX(/^a$/), new EQ("a")]);

	test("Should report no infringement with 'a' to check", () => {
		expect(ae.check("a" as unknown as object)).toBe(true);
	});

	test("Should report no infringement with ['a','a','a'] to check", () => {
		expect(ae.check(["a", "a", "a"] as unknown as object)).toBe(true);
	});

	test("Should report infringement with ['a','b','a'] to check", () => {
		expect(typeof ae.check(["a", "b", "a"] as unknown as object)).toBe(
			"string",
		);
		1;
	});

	test("Should not report infringement with ['b','a','b'] to check when checking only index 1", () => {
		expect(
			new AE([new REGEX(/^a$/), new EQ("a")], 1).check([
				"b",
				"a",
				"b",
			] as unknown as object),
		).toBe(true);
	});

	test("Should report infringement with ['b','a','b'] to check when checking from index 1 on", () => {
		expect(
			typeof new AE([new REGEX(/^a$/), new EQ("a")], 1, -1).check([
				"b",
				"a",
				"b",
			] as unknown as object),
		).toBe("string");
	});

	test("Should not report infringement with ['a','a','b'] to check when checking from index 0 to 1", () => {
		expect(
			new AE([new REGEX(/^a$/), new EQ("a")], 0, 1).check([
				"a",
				"a",
				"b",
			] as unknown as object),
		).toBe(true);
	});

	test("Should report infringement with ['a','a','b'] to check when checking from index 0 to 1 case of EQ-Condition", () => {
		expect(
			typeof new AE([new REGEX(/^a$/), new EQ("b")], 0, 1).check([
				"a",
				"a",
				"b",
			] as unknown as object),
		).toBe("string");
	});
});
