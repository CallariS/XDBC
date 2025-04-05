"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Calculator = void 0;
var Calculator = /** @class */ (function () {
    function Calculator() {
    }
    //	@DBC.log
    Calculator.prototype.divide = function (@REGEX.PRE("r") a, b) {
        return a / b;
    };
    return Calculator;
}());
exports.Calculator = Calculator;
alert(new Calculator().divide(2, 1));
