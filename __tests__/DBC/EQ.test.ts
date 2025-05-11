import { EQ } from "../../src/DBC/EQ";

describe("EQ", () => {
	const eq = new EQ("b");

	test("Should not report infringement with 'b' to check", () => {
		expect(eq.check("b")).toBe(true);
	});

	test("Should report infringement with 'c' to check", () => {
		expect(typeof eq.check("c")).toBe("string");
	});
});
