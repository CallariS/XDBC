"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBC = void 0;
/**
 * Provides a [D]esign [B]y [C]ontract Framework using decorators.
 */
var DBC = /** @class */ (function () {
    function DBC() {
        this.g = 0;
    }
    /** A decorator that checks
     *
     * @param target
     * @param methodName
     * @param parameterIndex
     */
    DBC.decPrecondition = function (init) {
        var b = init;
        return function (target, methodName, parameterIndex) {
            console.log("X:".concat(DBC.parameterValues.get(target).get(methodName)));
            console.log(target);
        };
    };
    DBC.log = function (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    target, propertyKey, descriptor) {
        var originalMethod = descriptor.value;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            console.log("Calling ".concat(target.constructor.name, ".").concat(propertyKey, " with arguments: ").concat(JSON.stringify(args)));
            if (DBC.parameterValues.has(target)) {
                if (DBC.parameterValues.get(target).has(propertyKey)) {
                    DBC.parameterValues.get(target).set(propertyKey, args);
                }
                else {
                    DBC.parameterValues.get(target).set(propertyKey, args);
                }
            }
            else {
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                DBC.parameterValues.set(target, 
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                new Map([[propertyKey, args]]));
            }
            var result = originalMethod.apply(this, args);
            console.log("Result: ".concat(result));
            return result;
        };
        return descriptor;
    };
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    DBC.parameterValues = 
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    new Map();
    return DBC;
}());
exports.DBC = DBC;
