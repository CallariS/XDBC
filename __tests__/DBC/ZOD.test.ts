import { z } from "zod";
import { ZOD } from "../../src/DBC/ZOD";

describe("ZOD", () => {
	describe("string schema", () => {
		const zodString = new ZOD(z.string());

		test("Should not report infringement with a string value", () => {
			expect(zodString.check("hello")).toBe(true);
		});

		test("Should report infringement with a number value", () => {
			expect(typeof zodString.check(42)).toBe("string");
		});
	});

	describe("number schema", () => {
		const zodNumber = new ZOD(z.number());

		test("Should not report infringement with a number value", () => {
			expect(zodNumber.check(42)).toBe(true);
		});

		test("Should report infringement with a string value", () => {
			expect(typeof zodNumber.check("hello")).toBe("string");
		});
	});

	describe("object schema", () => {
		const zodObject = new ZOD(z.object({ name: z.string(), age: z.number() }));

		test("Should not report infringement with a valid object", () => {
			expect(zodObject.check({ name: "Alice", age: 30 })).toBe(true);
		});

		test("Should report infringement with an invalid object", () => {
			expect(typeof zodObject.check({ name: 123 })).toBe("string");
		});

		test("Should report infringement with a non-object value", () => {
			expect(typeof zodObject.check("not an object")).toBe("string");
		});
	});

	describe("checkAlgorithm", () => {
		test("Should return true for valid value", () => {
			expect(ZOD.checkAlgorithm("test", z.string())).toBe(true);
		});

		test("Should return string for invalid value", () => {
			expect(typeof ZOD.checkAlgorithm(42, z.string())).toBe("string");
		});
	});
});
