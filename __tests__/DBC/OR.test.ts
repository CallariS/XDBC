import { EQ } from "../../src/DBC/EQ";
import { OR } from "../../src/DBC/OR";

describe("OR", () => {
	const or = new OR([new EQ("a"), new EQ("b")]);

	test("Should not report infringement with 'b' to check", () => {
		expect(or.check("b")).toBe(true);
	});

	test("Should report infringement with 'c' to check", () => {
		expect(typeof or.check("c")).toBe("string");
	});
});
