import { PLAIN_OBJECT } from "../../src/DBC/ARR/PLAIN_OBJECT";
import { DBC } from "../../src/DBC";

describe("PLAIN_OBJECT", () => {
	const plainObject = new PLAIN_OBJECT();

	test("Should not report infringement with a plain object", () => {
		expect(plainObject.check({ a: 1 })).toBe(true);
	});

	test("Should not report infringement with an empty object", () => {
		expect(plainObject.check({})).toBe(true);
	});

	test("Should not report infringement with undefined (null-passthrough)", () => {
		expect(plainObject.check(undefined)).toBe(true);
	});

	test("Should not report infringement with null (null-passthrough)", () => {
		expect(plainObject.check(null)).toBe(true);
	});

	test("Should report infringement with an array", () => {
		expect(typeof plainObject.check([])).toBe("string");
	});

	test("Should report infringement with a non-empty array", () => {
		expect(typeof plainObject.check([1, 2, 3])).toBe("string");
	});

	test("Should report infringement with a string", () => {
		expect(typeof plainObject.check("hello")).toBe("string");
	});

	test("Should report infringement with a number", () => {
		expect(typeof plainObject.check(42)).toBe("string");
	});

	describe("checkAlgorithm", () => {
		test("Should return true for a plain object", () => {
			expect(PLAIN_OBJECT.checkAlgorithm({ key: "value" })).toBe(true);
		});

		test("Should return true for an empty object", () => {
			expect(PLAIN_OBJECT.checkAlgorithm({})).toBe(true);
		});

		test("Should return true for null (null-passthrough)", () => {
			expect(PLAIN_OBJECT.checkAlgorithm(null)).toBe(true);
		});

		test("Should return true for undefined (null-passthrough)", () => {
			expect(PLAIN_OBJECT.checkAlgorithm(undefined)).toBe(true);
		});

		test("Should return string for an array", () => {
			const result = PLAIN_OBJECT.checkAlgorithm([]);
			expect(typeof result).toBe("string");
			expect(result).toContain("ARRAY");
		});

		test("Should return string for a non-empty array", () => {
			const result = PLAIN_OBJECT.checkAlgorithm([1, 2, 3]);
			expect(typeof result).toBe("string");
			expect(result).toContain("ARRAY");
		});

		test("Should return string for a string value", () => {
			const result = PLAIN_OBJECT.checkAlgorithm("hello");
			expect(typeof result).toBe("string");
			expect(result).toContain("PLAIN_OBJECT");
		});

		test("Should return string for a number", () => {
			const result = PLAIN_OBJECT.checkAlgorithm(42);
			expect(typeof result).toBe("string");
			expect(result).toContain("PLAIN_OBJECT");
		});
	});

	describe("tsCheck", () => {
		test("Should return the value when it is a plain object", () => {
			const value = { x: 1 };
			expect(PLAIN_OBJECT.tsCheck(value)).toBe(value);
		});

		test("Should throw DBC.Infringement when value is an array", () => {
			expect(() => PLAIN_OBJECT.tsCheck([] as any)).toThrow(DBC.Infringement);
		});

		test("Should throw DBC.Infringement when value is a string", () => {
			expect(() => PLAIN_OBJECT.tsCheck("oops" as any)).toThrow(
				DBC.Infringement,
			);
		});

		test("Should include hint in the infringement message", () => {
			expect(() =>
				PLAIN_OBJECT.tsCheck([] as any, "must be a plain object"),
			).toThrow(/must be a plain object/);
		});

		test("Should include id in the infringement message", () => {
			expect(() =>
				PLAIN_OBJECT.tsCheck(42 as any, undefined, "optionsParam"),
			).toThrow(/optionsParam/);
		});
	});
});
