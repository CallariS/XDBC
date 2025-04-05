"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGEX = void 0;
var DBC_js_1 = require("../DBC.js");
var REGEX = /** @class */ (function (_super) {
    __extends(REGEX, _super);
    function REGEX() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    REGEX.PRE = function (a) {
        return DBC_js_1.DBC.decPrecondition({
            arguments: [a],
            check: function () { },
        });
    };
    return REGEX;
}(DBC_js_1.DBC));
exports.REGEX = REGEX;
