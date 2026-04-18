import { EQ } from "../../src/DBC/EQ";
import { IF } from "../../src/DBC/IF";
import { TYPE } from "../../src/DBC/TYPE";

describe("IF", () => {
	const isString = new TYPE("string");
	const eqHello = new EQ("hello");

	const ifContract = new IF(isString, eqHello);

	test("Should not report infringement when condition matches and inCase is fulfilled", () => {
		expect(ifContract.check("hello")).toBe(true);
	});

	test("Should report infringement when condition matches but inCase is not fulfilled", () => {
		expect(typeof ifContract.check("world")).toBe("string");
	});

	test("Should not report infringement when condition does not match", () => {
		expect(ifContract.check(42)).toBe(true);
	});

	describe("invert", () => {
		const invertedContract = new IF(isString, eqHello, true);

		test("Should not report infringement when condition does not match and inCase is fulfilled", () => {
			expect(invertedContract.check("hello")).toBe(true);
		});

		test("Should report infringement when condition does not match and inCase is not fulfilled", () => {
			expect(typeof invertedContract.check(42)).toBe("string");
		});

		test("Should not report infringement when condition matches", () => {
			expect(invertedContract.check("world")).toBe(true);
		});
	});

	describe("checkAlgorithm", () => {
		test("Should return true when condition not met", () => {
			expect(IF.checkAlgorithm(123, isString, eqHello)).toBe(true);
		});

		test("Should return string when condition met but inCase fails", () => {
			expect(typeof IF.checkAlgorithm("notHello", isString, eqHello)).toBe(
				"string",
			);
		});

		test("Should return true when both condition and inCase pass", () => {
			expect(IF.checkAlgorithm("hello", isString, eqHello)).toBe(true);
		});

		test("Should return true when toCheck is undefined", () => {
			expect(IF.checkAlgorithm(undefined, isString, eqHello)).toBe(true);
		});

		test("Should return true when toCheck is null", () => {
			expect(IF.checkAlgorithm(null, isString, eqHello)).toBe(true);
		});
	});
});
