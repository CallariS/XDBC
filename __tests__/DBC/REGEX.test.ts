import { REGEX } from "../../src/DBC/REGEX";

describe("EQ", () => {
	const regex = new REGEX(/^a$/);

	test("Should not report infringement with 'a' to check", () => {
		expect(regex.check("a")).toBe(true);
	});

	test("Should report infringement with 'c' to check", () => {
		expect(typeof regex.check("c")).toBe("string");
	});
});
