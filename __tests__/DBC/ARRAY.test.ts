import { ARRAY } from "../../src/DBC/ARRAY";
import { DBC } from "../../src/DBC";

describe("ARRAY", () => {
	const array = new ARRAY();

	test("Should not report infringement with an array", () => {
		expect(array.check([1, 2, 3])).toBe(true);
	});

	test("Should not report infringement with an empty array", () => {
		expect(array.check([])).toBe(true);
	});

	test("Should not report infringement with undefined (null-passthrough)", () => {
		expect(array.check(undefined)).toBe(true);
	});

	test("Should not report infringement with null (null-passthrough)", () => {
		expect(array.check(null)).toBe(true);
	});

	test("Should report infringement with a plain object", () => {
		expect(typeof array.check({})).toBe("string");
	});

	test("Should report infringement with a string", () => {
		expect(typeof array.check("hello")).toBe("string");
	});

	test("Should report infringement with a number", () => {
		expect(typeof array.check(42)).toBe("string");
	});

	describe("checkAlgorithm", () => {
		test("Should return true for an array", () => {
			expect(ARRAY.checkAlgorithm([1, 2, 3])).toBe(true);
		});

		test("Should return true for an empty array", () => {
			expect(ARRAY.checkAlgorithm([])).toBe(true);
		});

		test("Should return true for null (null-passthrough)", () => {
			expect(ARRAY.checkAlgorithm(null)).toBe(true);
		});

		test("Should return true for undefined (null-passthrough)", () => {
			expect(ARRAY.checkAlgorithm(undefined)).toBe(true);
		});

		test("Should return string for a plain object", () => {
			const result = ARRAY.checkAlgorithm({});
			expect(typeof result).toBe("string");
			expect(result).toContain("ARRAY");
		});

		test("Should return string for a string value", () => {
			const result = ARRAY.checkAlgorithm("hello");
			expect(typeof result).toBe("string");
		});

		test("Should return string for a number", () => {
			const result = ARRAY.checkAlgorithm(42);
			expect(typeof result).toBe("string");
		});
	});

	describe("tsCheck", () => {
		test("Should return the value when it is an array", () => {
			const value = [1, 2, 3];
			expect(ARRAY.tsCheck(value)).toBe(value);
		});

		test("Should throw DBC.Infringement when value is not an array", () => {
			expect(() => ARRAY.tsCheck({} as any)).toThrow(DBC.Infringement);
		});

		test("Should include hint in the infringement message", () => {
			expect(() => ARRAY.tsCheck("oops" as any, "must be an array")).toThrow(
				/must be an array/,
			);
		});

		test("Should include id in the infringement message", () => {
			expect(() => ARRAY.tsCheck(42 as any, undefined, "myParam")).toThrow(
				/myParam/,
			);
		});
	});
});
