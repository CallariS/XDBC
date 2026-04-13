import { GREATER } from "../../src/DBC/COMPARISON/GREATER";
import { GREATER_OR_EQUAL } from "../../src/DBC/COMPARISON/GREATER_OR_EQUAL";
import { LESS_OR_EQUAL } from "../../src/DBC/COMPARISON/LESS_OR_EQUAL";

describe("GREATER", () => {
	const greater = new GREATER(1);

	test("Should not report infringement with '2' to check", () => {
		expect(greater.check(2)).toBe(true);
	});

	test("Should report infringement with '0' to check", () => {
		expect(typeof greater.check(0)).toBe("string");
	});

	test("Should report infringement with '1' to check (equality not permitted)", () => {
		expect(typeof greater.check(1)).toBe("string");
	});

	test("Should not report infringement with '1' and '1' to check since equality is now permitted", () => {
		expect(new GREATER_OR_EQUAL(1).check(1)).toBe(true);
	});

	test("Should not report infringement with '1' and '1' to check since inverting the result is now on", () => {
		expect(new LESS_OR_EQUAL(1).check(1)).toBe(true);
	});

	test("Should not report infringement with 'undefined' and 'undefined' to check", () => {
		expect(new GREATER(undefined).check(undefined)).toBe(true);
	});
});
