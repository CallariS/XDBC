import { INSTANCE } from "../../src/DBC/INSTANCE";

describe("INSTANCE", () => {
	const instance = new INSTANCE(RegExp);

	test("Should not report infringement with '/a/g' to check", () => {
		expect(instance.check(/a/g)).toBe(true);
	});

	test("Should report infringement with 'd' to check", () => {
		expect(typeof instance.check("d")).toBe("string");
	});
});
