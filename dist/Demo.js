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
import { REGEX } from "./DBC/REGEX.js";
import { EQ } from "./DBC/EQ.js";
import { TYPE } from "./DBC/TYPE.js";
import { AE } from "./DBC/AE.js";
import { INSTANCE } from "./DBC/INSTANCE.js";
/**
 *
 */
export class Demo {
    constructor() {
        this.test = "a";
    }
    divide(a, b) {
        console.log(a);
        return a;
    }
    HT(o) { }
    type(o) { }
    array(x) { }
    regex(x) { }
    index(x) { }
    instance(candidate) { }
    range(x) { }
    // biome-ignore lint/suspicious/noExplicitAny: Test
    invert(g) {
        return null;
    }
}
__decorate([
    DBC.INVARIANT([new REGEX(/^a$/)]),
    __metadata("design:type", Object)
], Demo.prototype, "test", void 0);
__decorate([
    REGEX.POST(/xxxx*/g),
    DBC.ParamvalueProvider,
    __param(0, REGEX.PRE(/holla*/g)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", String)
], Demo.prototype, "divide", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, EQ.PRE("SELECT", true, "tagName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [HTMLElement]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "HT", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, TYPE.PRE("string")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "type", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, AE.PRE([new TYPE("string")])),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "array", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, AE.PRE(new REGEX(/^(?i:(NOW)|([+-]\d+[dmy]))$/i))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "regex", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, AE.PRE(new REGEX(/^\d$/i), 0)),
    __param(0, AE.PRE(new REGEX(/^(?i:(NOW)|([+-]\d+[dmy]))$/i), 1)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "index", null);
__decorate([
    DBC.ParamvalueProvider
    // biome-ignore lint/suspicious/noExplicitAny: Test
    ,
    __param(0, INSTANCE.PRE(Date)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "instance", null);
__decorate([
    DBC.ParamvalueProvider,
    __param(0, AE.PRE([new TYPE("string"), new REGEX(/^abc$/)], 1, 2)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "range", null);
__decorate([
    AE.POST(new EQ(null, true), 0),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "invert", null);
const calculator = new Demo();
console.log("Starting demo...");
try {
    calculator.test = "abd";
}
catch (X) {
    console.log("INVARIANT Infringement", "OK");
    console.log(X);
}
//new Calculator().divide("xxxx", 1);
//new Calculator().HT(document.createElement("select"));
//new Calculator().type("10");
//new Calculator().array([11, "10", "b"]);
//new Calculator().index(["1a", "+d1m", "-x10y"]);
//new Calculator().instance(new Date());
//new Calculator().range([11, "abc", "abc"]);
//new Calculator().invert("");
