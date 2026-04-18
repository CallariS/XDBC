import { HasAttribute } from "../../src/DBC/HasAttribute";

describe("HasAttribute", () => {
	const hasId = new HasAttribute("id");

	test("Should not report infringement when attribute exists", () => {
		const el = document.createElement("div");
		el.setAttribute("id", "test");
		expect(hasId.check(el)).toBe(true);
	});

	test("Should report infringement when attribute is missing", () => {
		const el = document.createElement("div");
		expect(typeof hasId.check(el)).toBe("string");
	});

	test("Should report infringement when value is not an HTMLElement", () => {
		expect(typeof hasId.check("not an element")).toBe("string");
	});

	test("Should report infringement when value is a plain object", () => {
		expect(typeof hasId.check({ id: "test" })).toBe("string");
	});

	describe("invert", () => {
		const noId = new HasAttribute("id", true);

		test("Should not report infringement when attribute is absent", () => {
			const el = document.createElement("div");
			expect(noId.check(el)).toBe(true);
		});

		test("Should report infringement when forbidden attribute exists", () => {
			const el = document.createElement("div");
			el.setAttribute("id", "test");
			expect(typeof noId.check(el)).toBe("string");
		});
	});

	describe("checkAlgorithm", () => {
		test("Should return true when element has the attribute", () => {
			const el = document.createElement("span");
			el.setAttribute("class", "active");
			expect(HasAttribute.checkAlgorithm(el, "class", false)).toBe(true);
		});

		test("Should return string when element lacks the attribute", () => {
			const el = document.createElement("span");
			expect(typeof HasAttribute.checkAlgorithm(el, "class", false)).toBe(
				"string",
			);
		});

		test("Should return string for non-HTMLElement", () => {
			expect(typeof HasAttribute.checkAlgorithm(42, "id", false)).toBe(
				"string",
			);
		});
	});
});
