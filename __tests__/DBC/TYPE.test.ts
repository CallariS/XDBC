import { TYPE } from "../../src/DBC/TYPE";

describe("EQ", () => {
	const type = new TYPE("string");

	test("Should not report infringement with 'a' to check", () => {
		expect(type.check("a")).toBe(true);
	});

	test("Should report infringement with 1 to check", () => {
		expect(typeof type.check(1)).toBe("string");
	});
});
