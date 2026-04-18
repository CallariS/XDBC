import { DEFINED } from "../../src/DBC/DEFINED";

describe("DEFINED", () => {
	const defined = new DEFINED();

	test("Should not report infringement with a string value", () => {
		expect(defined.check("hello")).toBe(true);
	});

	test("Should not report infringement with a number value", () => {
		expect(defined.check(42)).toBe(true);
	});

	test("Should not report infringement with an empty string", () => {
		expect(defined.check("")).toBe(true);
	});

	test("Should not report infringement with zero", () => {
		expect(defined.check(0)).toBe(true);
	});

	test("Should not report infringement with false", () => {
		expect(defined.check(false)).toBe(true);
	});

	test("Should report infringement with null", () => {
		expect(typeof defined.check(null)).toBe("string");
	});

	test("Should report infringement with undefined", () => {
		expect(typeof defined.check(undefined)).toBe("string");
	});

	describe("checkAlgorithm", () => {
		test("Should return true for defined values", () => {
			expect(DEFINED.checkAlgorithm("test")).toBe(true);
			expect(DEFINED.checkAlgorithm(0)).toBe(true);
			expect(DEFINED.checkAlgorithm(false)).toBe(true);
		});

		test("Should return string for null", () => {
			const result = DEFINED.checkAlgorithm(null);
			expect(typeof result).toBe("string");
			expect(result).toContain("NULL");
		});

		test("Should return string for undefined", () => {
			const result = DEFINED.checkAlgorithm(undefined);
			expect(typeof result).toBe("string");
			expect(result).toContain("UNDEFINED");
		});
	});
});
