import { UNDEFINED } from "../../src/DBC/UNDEFINED";

describe("UNDEFINED", () => {
    const undef = new UNDEFINED();

    test("Should not report infringement with undefined", () => {
        expect(undef.check(undefined)).toBe(true);
    });

    test("Should report infringement with null", () => {
        expect(typeof undef.check(null)).toBe("string");
    });

    test("Should report infringement with a string value", () => {
        expect(typeof undef.check("hello")).toBe("string");
    });

    test("Should report infringement with a number value", () => {
        expect(typeof undef.check(42)).toBe("string");
    });

    test("Should report infringement with zero", () => {
        expect(typeof undef.check(0)).toBe("string");
    });

    test("Should report infringement with false", () => {
        expect(typeof undef.check(false)).toBe("string");
    });

    test("Should report infringement with an empty string", () => {
        expect(typeof undef.check("")).toBe("string");
    });

    describe("checkAlgorithm", () => {
        test("Should return true for undefined", () => {
            expect(UNDEFINED.checkAlgorithm(undefined)).toBe(true);
        });

        test("Should return string for defined values", () => {
            expect(typeof UNDEFINED.checkAlgorithm("test")).toBe("string");
            expect(typeof UNDEFINED.checkAlgorithm(0)).toBe("string");
            expect(typeof UNDEFINED.checkAlgorithm(null)).toBe("string");
        });
    });
});
