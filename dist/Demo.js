var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { DBC } from "./DBC";
import { REGEX } from "./DBC/REGEX";
import { EQ } from "./DBC/EQ";
import { TYPE } from "./DBC/TYPE";
import { AE } from "./DBC/AE";
import { INSTANCE } from "./DBC/INSTANCE";
import { GREATER } from "./DBC/COMPARISON/GREATER";
/** Demonstrative use of **D**esign **B**y **C**ontract Decorators */
export class Demo {
    constructor() {
        // #region Check Property Decorator
        this.testProperty = "a";
        // #endregion Check Comparison
    }
    // #endregion Check Property Decorator
    // #region Check Parameter. & Returnvalue Decorator
    testParamvalueAndReturnvalue(a) {
        return `xxxx${a}`;
    }
    // #endregion Check Parameter. & Returnvalue Decorator
    // #region Check Returnvalue Decorator
    testReturnvalue(a) {
        return a;
    }
    // #endregion Check Returnvalue Decorator
    // #region Check EQ-DBC & Path to property of Parameter-value
    testEQAndPath(o) { }
    // #endregion Check EQ-DBC & Path to property of Parameter-value
    // #region Check EQ-DBC & Path to property of Parameter-value with Inversion
    testEQAndPathWithInversion(o) { }
    // #endregion Check EQ-DBC & Path to property of Parameter-value with Inversion
    // #region Check TYPE
    testTYPE(o) { }
    // #endregion Check TYPE
    // #region Check AE
    testAE(x) { }
    // #endregion Check AE
    // #region Check REGEX with AE
    testREGEXWithAE(x) { }
    // #endregion Check REGEX with AE
    // #region Check INSTANCE
    testINSTANCE(candidate) { }
    // #endregion Check INSTANCE
    // #region Check AE Range
    testAERange(x) { }
    // #endregion Check AE Range
    // #region Check AE Index
    testAEIndex(x) { }
    // #endregion Check AE Index
    // #region Check Comparison
    testGREATER(input) { }
}
__decorate([
    REGEX.INVARIANT(/^a$/),
    __metadata("design:type", Object)
], Demo.prototype, "testProperty", void 0);
__decorate([
    REGEX.POST(/^xxxx.*$/),
    DBC.ParamvalueProvider,
    __param(0, REGEX.PRE(/holla*/g)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", String)
], Demo.prototype, "testParamvalueAndReturnvalue", null);
__decorate([
    REGEX.POST(/^xxxx.*$/),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", String)
], Demo.prototype, "testReturnvalue", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, EQ.PRE("SELECT", false, "tagName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [HTMLElement]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testEQAndPath", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, EQ.PRE("SELECT", true, "tagName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [HTMLElement]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testEQAndPathWithInversion", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, TYPE.PRE("string")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testTYPE", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, AE.PRE([new TYPE("string")])),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testAE", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, AE.PRE(new REGEX(/^(?i:(NOW)|([+-]\d+[dmy]))$/i))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testREGEXWithAE", null);
__decorate([
    DBC.ParamvalueProvider
    // biome-ignore lint/suspicious/noExplicitAny: Test
    ,
    __param(0, INSTANCE.PRE(Date)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testINSTANCE", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, AE.PRE([new TYPE("string"), new REGEX(/^abc$/)], 1, 2)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testAERange", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, AE.PRE([new TYPE("string"), new REGEX(/^abc$/)], 1)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testAEIndex", null);
__decorate([
    __param(0, GREATER.PRE(2)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testGREATER", null);
const demo = new Demo();
try {
    demo.testProperty = "abd";
}
catch (X) {
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
}
catch (X) {
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
}
catch (X) {
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
}
catch (X) {
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
}
catch (X) {
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
}
catch (X) {
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
}
catch (X) {
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
}
catch (X) {
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
}
catch (X) {
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
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("AE Index Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testGREATER(11);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("GREATER OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testGREATER(2);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("GREATER OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
