import { DBC } from "./DBC";
import { REGEX } from "./DBC/REGEX";
import { EQ } from "./DBC/EQ";
import { TYPE } from "./DBC/TYPE";
import { AE } from "./DBC/AE";
import { INSTANCE } from "./DBC/INSTANCE";
/** Demonstrative use of **D**esign **B**y **C**ontract Decorators */
export class Demo {
	// #region Check Property Decorator
	@REGEX.INVARIANT(/^a$/)
	public testProperty = "a";
	// #endregion Check Property Decorator
	// #region Check Parameter. & Returnvalue Decorator
	@REGEX.POST(/^xxxx.*$/)
	@DBC.ParamvalueProvider
	public testParamvalueAndReturnvalue(@REGEX.PRE(/holla*/g) a: string): string {
		return `xxxx${a}`;
	}
	// #endregion Check Parameter. & Returnvalue Decorator
	// #region Check Returnvalue Decorator
	@REGEX.POST(/^xxxx.*$/)
	public testReturnvalue(a: string): string {
		return a;
	}
	// #endregion Check Returnvalue Decorator
	// #region Check EQ-DBC & Path to property of Parameter-value
	@DBC.ParamvalueProvider
	public testEQAndPath(
		@EQ.PRE("SELECT" as unknown as object, false, "tagName") o: HTMLElement,
	) {}
	// #endregion Check EQ-DBC & Path to property of Parameter-value
	// #region Check EQ-DBC & Path to property of Parameter-value with Inversion
	@DBC.ParamvalueProvider
	public testEQAndPathWithInversion(
		@EQ.PRE("SELECT" as unknown as object, true, "tagName") o: HTMLElement,
	) {}
	// #endregion Check EQ-DBC & Path to property of Parameter-value with Inversion
	// #region Check TYPE
	@DBC.ParamvalueProvider
	public testTYPE(@TYPE.PRE("string") o: unknown) {}
	// #endregion Check TYPE
	// #region Check AE
	@DBC.ParamvalueProvider
	public testAE(@AE.PRE([new TYPE("string")]) x: Array<unknown>) {}
	// #endregion Check AE
	// #region Check REGEX with AE
	@DBC.ParamvalueProvider
	public testREGEXWithAE(
		@AE.PRE(new REGEX(/^(?i:(NOW)|([+-]\d+[dmy]))$/i)) x: Array<string>,
	) {}
	// #endregion Check REGEX with AE
	// #region Check INSTANCE
	@DBC.ParamvalueProvider
	// biome-ignore lint/suspicious/noExplicitAny: Test
	public testINSTANCE(@INSTANCE.PRE(Date) candidate: any): undefined {}
	// #endregion Check INSTANCE
	// #region Check AE Range
	@DBC.ParamvalueProvider
	public testAERange(
		@AE.PRE([new TYPE("string"), new REGEX(/^abc$/)], 1, 2) x: Array<unknown>,
	) {}
	// #endregion Check AE Range
	// #region Check AE Index
	@DBC.ParamvalueProvider
	public testAEIndex(
		@AE.PRE([new TYPE("string"), new REGEX(/^abc$/)], 1) x: Array<unknown>,
	) {}
	// #endregion Check AE Index
}

const demo = new Demo();

try {
	demo.testProperty = "abd";
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("INVARIANT Infringement", "OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testProperty = "a";
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("INVARIANT OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

demo.testParamvalueAndReturnvalue("holla");
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("PARAMETER- & RETURNVALUE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testParamvalueAndReturnvalue("yyyy");
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("PARAMETER- & RETURNVALUE Infringement", "OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testReturnvalue("xxxx");
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("RETURNVALUE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testReturnvalue("yyyy");
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("RETURNVALUE Infringement", "OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testEQAndPath(document.createElement("select"));
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("EQ with Path Infringement OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testEQAndPathWithInversion(document.createElement("select"));
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("EQ with Path and Inversion Infringement OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testTYPE("x");
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("TYPE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testTYPE(0);
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("TYPE Infringement OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testAE(["11", "10", "b"]);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("AE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testAE(["11", 11, "b"]);
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("AE Infringement OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testREGEXWithAE(["+1d", "NOW", "-10y"]);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("REGEX with AE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testREGEXWithAE(["+1d", "+5d", "-x10y"]);
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("REGEX with AE Infringement OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testINSTANCE(new Date());
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("INSTANCE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testINSTANCE(demo);
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("INSTANCE Infringement OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testAERange([11, "abc", "abc"]);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("AE Range OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testAERange([11, "abc", /a/g]);
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("AE Range Infringement OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}

demo.testAEIndex([11, "abc", "abc"]);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("AE Index OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");

try {
	demo.testAEIndex(["11", 12, "/a/g"]);
} catch (X) {
	console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
	console.log("AE Index Infringement OK");
	console.log(X);
	console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
