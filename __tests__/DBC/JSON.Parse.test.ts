import { JSON_Parse } from "../../src/DBC/JSON.Parse";

describe("EQ", () => {
	const jsonParse = new JSON_Parse();

	test(`Should not report infringement with '{"d":"o"}' to check`, () => {
		expect(jsonParse.check('{"d":"o"}')).toBe(true);
	});

	test(`Should report infringement with '{"d":o}' to check`, () => {
		expect(typeof jsonParse.check('{"d":o}')).toBe("string");
	});

	test(`Should not report infringement or throw "referenceException" with '{"d":"o"}' to check and "receptor" not defined`, () => {
		expect(new JSON_Parse().check('{"d":"o"}')).toBe(true);
	});
});
