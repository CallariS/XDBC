/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/DBC.ts":
/*!********************!*\
  !*** ./src/DBC.ts ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DBC: () => (/* binding */ DBC)
/* harmony export */ });
/**
 * Provides a **D**esign **B**y **C**ontract Framework using decorators.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
class DBC {
    /**
     * Make a request to get the value of a certain parameter of specific method in a specific {@link object }.
     * That request gets enlisted in {@link paramValueRequests } which is used by {@link ParamvalueProvider} to invoke the
     * given "receptor" with the parameter value stored in there. Thus a parameter decorator using this method will
     * not receive any value of the top method is not tagged with {@link ParamvalueProvider}.
     *
     * @param target		The {@link object } containing the method with the parameter which's value is requested.
     * @param methodName	The name of the method with the parameter which's value is requested.
     * @param index			The index of the parameter which's value is requested.
     * @param receptor		The method the requested parameter-value shall be passed to when it becomes available. */
    static requestParamValue(target, methodName, index, 
    // biome-ignore lint/suspicious/noExplicitAny: Gotta be any since parameter-values may be undefined.
    receptor) {
        if (DBC.paramValueRequests.has(target)) {
            if (DBC.paramValueRequests.get(target).has(methodName)) {
                if (DBC.paramValueRequests.get(target).get(methodName).has(index)) {
                    DBC.paramValueRequests
                        .get(target)
                        .get(methodName)
                        .get(index)
                        .push(receptor);
                }
                else {
                    DBC.paramValueRequests
                        .get(target)
                        .get(methodName)
                        .set(index, new Array(receptor));
                }
            }
            else {
                DBC.paramValueRequests
                    .get(target)
                    .set(methodName, new Map([
                    [index, new Array(receptor)],
                ]));
            }
        }
        else {
            DBC.paramValueRequests.set(target, new Map([
                [
                    methodName,
                    new Map([
                        [index, new Array(receptor)],
                    ]),
                ],
            ]));
        }
        return undefined;
    }
    /**
     * A method-decorator factory checking the {@link paramValueRequests } for value-requests of the method's parameter thus
     * also usable on setters.
     * When found it will invoke the "receptor" registered there, inter alia by {@link requestParamValue }, with the
     * parameter's value.
     *
     * @param target 		The {@link object } hosting the tagged method as provided by the runtime.
     * @param propertyKey 	The tagged method's name as provided by the runtime.
     * @param descriptor 	The {@link PropertyDescriptor } as provided by the runtime.
     *
     * @returns The {@link PropertyDescriptor } that was passed by the runtime. */
    static ParamvalueProvider(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        // biome-ignore lint/suspicious/noExplicitAny: Gotta be any since parameter-values may be undefined.
        descriptor.value = (...args) => {
            // #region	Check if a value of one of the method's parameter has been requested and pass it to the
            //			receptor, if so.
            if (DBC.paramValueRequests.has(target) &&
                DBC.paramValueRequests.get(target).has(propertyKey)) {
                for (const index of DBC.paramValueRequests
                    .get(target)
                    .get(propertyKey)
                    .keys()) {
                    if (index < args.length) {
                        for (const receptor of DBC.paramValueRequests
                            .get(target)
                            .get(propertyKey)
                            .get(index)) {
                            receptor(args[index]);
                        }
                    }
                }
            }
            // #endregion 	Check if a value of one of the method's parameter has been requested and pass it to the
            // 				receptor, if so.
            // biome-ignore lint/complexity/noThisInStatic: Necessary.
            return originalMethod.apply(this, args);
        };
        return descriptor;
    }
    // #endregion Parameter-value requests.
    // #region Invariant
    /**
     * A property-decorator factory serving as a **D**esign **B**y **C**ontract Invariant.
     * Since the value must be initialized or set according to the specified **contracts** the value will only be checked
     * when assigning it.
     *
     * @param contracts The {@link DBC }-Contracts the value shall uphold.
     *
     * @throws 	A {@link DBC.Infringement } whenever the property is tried to be set to a value that does not comply to the
     * 			specified **contracts**, by the returned method.*/
    static decInvariant(contracts, path = undefined, dbc = "WaXCode.DBC") {
        return (target, propertyKey) => {
            // biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
            let value;
            // #region Replace original property.
            Object.defineProperty(target, propertyKey, {
                set(newValue) {
                    const realValue = path ? DBC.resolve(newValue, path) : newValue;
                    // #region Check if all "contracts" are fulfilled.
                    for (const contract of contracts) {
                        const result = contract.check(realValue);
                        if (typeof result === "string") {
                            DBC.resolveDBCPath(window, dbc).reportFieldInfringement(result, target, path, propertyKey, realValue);
                        }
                    }
                    // #endregion Check if all "contracts" are fulfilled.
                    value = newValue;
                },
                enumerable: true,
                configurable: true,
            });
            // #endregion Replace original property.
        };
    }
    // #endregion Invariant
    // #region Postcondition
    /**
     * A method decorator factory checking the result of a method whenever it is invoked thus also usable on getters.
     *
     * @param check	The **(toCheck: any, object, string) => boolean | string** to use for checking.
     * @param dbc	See {@link DBC.resolveDBCPath }.
     * @param path	The dotted path referring to the actual value to check, starting form the specified one.
     *
     * @returns The **( target : object, propertyKey : string, descriptor : PropertyDescriptor ) : PropertyDescriptor**
     * 			invoked by Typescript.
     */
    static decPostcondition(
    // biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
    check, dbc, path = undefined) {
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;
            // biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
            descriptor.value = (...args) => {
                // biome-ignore lint/complexity/noThisInStatic: <explanation>
                const result = originalMethod.apply(this, args);
                const realValue = path ? DBC.resolve(result, path) : result;
                const checkResult = check(realValue, target, propertyKey);
                if (typeof checkResult === "string") {
                    DBC.resolveDBCPath(window, dbc).reportReturnvalueInfringement(checkResult, target, path, propertyKey, realValue);
                }
                return result;
            };
            return descriptor;
        };
    }
    // #endregion Postcondition
    // #region Decorator
    // #region Precondition
    /**
     * A parameter-decorator factory that requests the tagged parameter's value passing it to the provided
     * "check"-method when the value becomes available.
     *
     * @param check	The "( unknown ) => void" to be invoked along with the tagged parameter's value as soon
     * 				as it becomes available.
     * @param dbc  	See {@link DBC.resolveDBCPath }.
     * @param path	The dotted path referring to the actual value to check, starting form the specified one.
     *
     * @returns The **(target: object, methodName: string | symbol, parameterIndex: number ) => void** invoked by Typescript- */
    static decPrecondition(check, dbc, path = undefined) {
        return (target, methodName, parameterIndex) => {
            DBC.requestParamValue(target, methodName, parameterIndex, (value) => {
                const realValue = path ? DBC.resolve(value, path) : value;
                const result = check(realValue, target, methodName, parameterIndex);
                if (typeof result === "string") {
                    DBC.resolveDBCPath(window, dbc).reportParameterInfringement(result, target, path, methodName, parameterIndex, realValue);
                }
            });
        };
    }
    /**
     * Reports a warning.
     *
     * @param message The message containing the warning. */
    reportWarning(message) {
        if (this.warningSettings.logToConsole) {
            console.warn(message);
        }
    }
    /**
     * Reports an infringement according to the {@link infringementSettings } also generating a proper {@link string }-wrapper
     * for the given "message" & violator.
     *
     * @param message	The {@link string } describing the infringement and it's provenience.
     * @param violator 	The {@link string } describing or naming the violator. */
    reportInfringement(message, violator, target, path) {
        const finalMessage = `[ From "${violator}"${path ? `'s member "${path}"` : ""}${typeof target === "function" ? ` in "${target.name}"` : typeof target === "object" && target !== null && typeof target.constructor === "function" ? ` in "${target.constructor.name}"` : ""}: ${message}]`;
        if (this.infringementSettings.throwException) {
            throw new DBC.Infringement(finalMessage);
        }
        if (this.infringementSettings.logToConsole) {
            console.log(finalMessage);
        }
    }
    /**
     * Reports a parameter-infringement via {@link reportInfringement } also generating a proper {@link string }-wrapper
     * for the given "message","method", parameter-"index" & value.
     *
     * @param message	The {@link string } describing the infringement and it's provenience.
     * @param method 	The {@link string } describing or naming the violator.
     * @param index		The index of the parameter within the argument listing.
     * @param value 	The parameter's value. */
    reportParameterInfringement(message, target, path, method, index, value) {
        const properIndex = index + 1;
        this.reportInfringement(`[ Parameter-value "${value}" of the ${properIndex}${properIndex === 1 ? "st" : properIndex === 2 ? "nd" : properIndex === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${message}]`, method, target, path);
    }
    /**
     * Reports a field-infringement via {@link reportInfringement } also generating a proper {@link string }-wrapper
     * for the given **message** & **name**.
     *
     * @param message	A {@link string } describing the infringement and it's provenience.
     * @param key 		The property key.
     * @param path		The dotted-path {@link string } that leads to the value not fulfilling the contract starting from
     * 					the tagged one.
     * @param value		The value not fulfilling a contract. */
    reportFieldInfringement(message, target, path, key, value) {
        this.reportInfringement(`[ New value for "${key}"${path === undefined ? "" : `.${path}`} with value "${value}" did not fulfill one of it's contracts: ${message}]`, key, target, path);
    }
    /**
     * Reports a returnvalue-infringement according via {@link reportInfringement } also generating a proper {@link string }-wrapper
     * for the given "message","method" & value.
     *
     * @param message	The {@link string } describing the infringement and it's provenience.
     * @param method 	The {@link string } describing or naming the violator.
     * @param value		The parameter's value. */
    reportReturnvalueInfringement(message, target, path, method, 
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    value) {
        this.reportInfringement(`[ Return-value "${value}" did not fulfill one of it's contracts: ${message}]`, method, target, path);
    }
    /**
     * Constructs this {@link DBC } by setting the {@link DBC.infringementSettings }, define the **WaXCode** namespace in
     * **window** if not yet available and setting the property **DBC** in there to the instance of this {@link DBC }.
     *
     * @param infringementSettings See {@link DBC.infringementSettings }. */
    constructor(infringementSettings = { throwException: true, logToConsole: false }) {
        // #endregion Precondition
        // #endregion Decorator
        // #region Warning handling.
        /** Stores settings concerning warnings. */
        this.warningSettings = { logToConsole: true };
        // #endregion Warning handling.
        // #region infringement handling.
        /** Stores the settings concerning infringements */
        this.infringementSettings = { throwException: true, logToConsole: false };
        this.infringementSettings = infringementSettings;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        if (window.WaXCode === undefined)
            window.WaXCode = {};
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        window.WaXCode.DBC = this;
    }
    /**
     *
     */
    static resolve(toResolveFrom, path) {
        if (!toResolveFrom || typeof path !== "string") {
            return undefined;
        }
        const parts = path.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split("."); // Handle indexers
        let current = toResolveFrom;
        for (const part of parts) {
            if (current === null || typeof current === "undefined") {
                return undefined;
            }
            const methodMatch = part.match(/(\w+)\((.*)\)/);
            if (methodMatch) {
                const methodName = methodMatch[1];
                const argsStr = methodMatch[2];
                const args = argsStr.split(",").map((arg) => arg.trim()); // Simple argument parsing
                if (typeof current[methodName] === "function") {
                    current = current[methodName].apply(current, args);
                }
                else {
                    return undefined; // Method not found or not a function
                }
            }
            else {
                current = current[part];
            }
        }
        return current;
    }
}
// #region Parameter-value requests.
/** Stores all request for parameter values registered by {@link decPrecondition }. */
DBC.paramValueRequests = new Map();
// #region Classes
// #region Errors
/** An {@link Error } to be thrown whenever an infringement is detected. */
DBC.Infringement = class extends Error {
    /**
     * Constructs this {@link Error } by tagging the specified message-{@link string } as an XDBC-Infringement.
     *
     * @param message The {@link string } describing the infringement. */
    constructor(message) {
        super(`[ XDBC Infringement ${message}]`);
    }
};
// #endregion Errors
// #endregion Classes
// #endregion infringement handling.
/**
 * Resolves the specified dotted {@link string }-path to a {@link DBC }.
 *
 * @param obj 	The {@link object } to start resolving from.
 * @param path 	The dotted {@link string }-path leading to the {@link DBC }.
 *
 * @returns The requested {@link DBC }.
 */
DBC.resolveDBCPath = (obj, path) => path === null || path === void 0 ? void 0 : path.split(".").reduce((accumulator, current) => accumulator[current], obj);
// Set the main instance with standard **DBC.infringementSettings**.
new DBC();


/***/ }),

/***/ "./src/DBC/AE.ts":
/*!***********************!*\
  !*** ./src/DBC/AE.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AE: () => (/* binding */ AE)
/* harmony export */ });
/* harmony import */ var _DBC__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../DBC */ "./src/DBC.ts");

/**
 * A {@link DBC } defining that all elements of an {@link object }s have to fulfill
 * a given {@link object }'s check-method (**( toCheck : any ) => boolean | string**).
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
class AE extends _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC {
    // #region Condition checking.
    /**
     * Checks each element of the **value**-{@link Array < any >} against the given **condition**, if it is one. If it is not
     * the **value** itself will be checked.
     *
     * @param condition	The { check: (toCheck: any) => boolean | string } to check the **value** against.
     * @param value		Either **value**-{@link Array < any >}, which's elements will be checked, or the value to be
     * 					checked itself.
     * @param index		If specified with **idxEnd** being undefined, this {@link Number } will be seen as the index of
     * 					the value-{@link Array }'s element to check. If value isn't an {@link Array } this parameter
     * 					will not have any effect.
     * 					With **idxEnd** not undefined this parameter indicates the beginning of the span of elements to
     * 					check within the value-{@link Array }.
     * @param idxEnd	Indicates the last element's index (including) of the span of value-{@link Array } elements to check.
     * 					Setting this parameter to -1 specifies that all value-{@link Array }'s elements beginning from the
     * 					specified **index** shall be checked.
     *
     * @returns As soon as the **condition** returns a {@link string }, instead of TRUE, the returned string. TRUE if the
     * 			**condition** never returns a {@link string}. */
    static checkAlgorithm(condition, value, index, idxEnd) {
        if (Array.isArray(value)) {
            if (index !== undefined && idxEnd === undefined) {
                if (index > -1 && index < value.length) {
                    const result = condition.check(value[index]);
                    if (typeof result === "string") {
                        return `Violating-Arrayelement at index "${index}" with value "${value[index]}". ${result}`;
                    }
                }
                return true; // In order for optional parameter to not cause an error if they are omitted.
            }
            const ending = idxEnd !== undefined
                ? idxEnd !== -1
                    ? idxEnd + 1
                    : value.length
                : value.length;
            for (let i = index ? index : 0; i < ending; i++) {
                const result = condition.check(value[i]);
                if (result !== true) {
                    return `Violating-Arrayelement at index ${i}. ${result}`;
                }
            }
        }
        else {
            return condition.check(value);
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged parameter-value against with.
     * When specifying an **index** and the tagged parameter's **value** is an {@link Array }, the **realConditions** apply to the
     * element at the specified **index**.
     * If the {@link Array } is too short the currently processed { check: (toCheck: any) => boolean | string } of
     * **realConditions** will be verified to TRUE automatically, considering optional parameters.
     * If an **index** is specified but the tagged parameter's value isn't an array, the **index** is treated as being undefined.
     * If **index** is undefined and the tagged parameter's value is an {@link Array } each element of it will be checked
     * against the **realConditions**.
     *
     * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
     * 							against with.
     * @param index				See the {@link AE.checkAlgorithm }.
     * @param idxEnd			See the {@link AE.checkAlgorithm }.
     * @param path				See {@link DBC.decPrecondition }.
     * @param dbc				See {@link DBC.decPrecondition }.
     *
     * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** returns one.
     * 			Otherwise TRUE. */
    static PRE(realConditions, index = undefined, idxEnd = undefined, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            if (Array.isArray(realConditions)) {
                for (const currentCondition of realConditions) {
                    const result = AE.checkAlgorithm(currentCondition, value, index, idxEnd);
                    if (typeof result !== "boolean")
                        return result;
                }
            }
            else {
                return AE.checkAlgorithm(realConditions, value, index, idxEnd);
            }
            return true;
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged method's return-value against with.
     *
     * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
     * 							against with.
     * @param index				See the {@link AE.checkAlgorithm }.
     * @param idxEnd			See the {@link AE.checkAlgorithm }.
     * @param path				See {@link DBC.decPrecondition }.
     * @param dbc				See {@link DBC.decPrecondition }.
     *
     * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** return one.
     * 			Otherwise TRUE. */
    static POST(realConditions, index = undefined, idxEnd = undefined, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            if (Array.isArray(realConditions)) {
                for (const currentCondition of realConditions) {
                    const result = AE.checkAlgorithm(currentCondition, value, index, idxEnd);
                    if (typeof result !== "boolean")
                        return result;
                }
            }
            else {
                return AE.checkAlgorithm(
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                realConditions, value, index, idxEnd);
            }
            return true;
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged field.
     *
     * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
     * 							against with.
     * @param index				See the {@link AE.checkAlgorithm }.
     * @param idxEnd			See the {@link AE.checkAlgorithm }.
     * @param path				See {@link DBC.decInvariant }.
     * @param dbc				See {@link DBC.decInvariant }.
     *
     * @returns	See {@link DBC.decInvariant }. */
    static INVARIANT(realConditions, index = undefined, idxEnd = undefined, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new AE(realConditions, index, idxEnd)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like global functions).
    //
    /**
     * Invokes the {@link AE.checkAlgorithm } with all {@link AE.conditions } and the {@link object } {@link toCheck },
     * {@link AE.index } & {@link AE.idxEnd }.
     *
     * @param toCheck See {@link AE.checkAlgorithm }.
     *
     * @returns See {@link EQ.checkAlgorithm}. */
    check(toCheck) {
        if (Array.isArray(this.conditions)) {
            for (const currentCondition of this.conditions) {
                const result = AE.checkAlgorithm(currentCondition, toCheck, this.index, this.idxEnd);
                if (typeof result !== "boolean")
                    return result;
            }
        }
        else {
            return AE.checkAlgorithm(
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            this.conditions, toCheck, this.index, this.idxEnd);
        }
        return true;
    }
    /**
     * Creates this {@link AE } by setting the protected property {@link AE.conditions }, {@link AE.index } and {@link AE.idxEnd } used by {@link AE.check }.
     *
     * @param equivalent See {@link EQ.check }. */
    constructor(conditions, index = undefined, idxEnd = undefined) {
        super();
        this.conditions = conditions;
        this.index = index;
        this.idxEnd = idxEnd;
    }
}


/***/ }),

/***/ "./src/DBC/EQ.ts":
/*!***********************!*\
  !*** ./src/DBC/EQ.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EQ: () => (/* binding */ EQ)
/* harmony export */ });
/* harmony import */ var _DBC__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../DBC */ "./src/DBC.ts");

/**
 * A {@link DBC } defining that two {@link object }s gotta be equal.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
class EQ extends _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC {
    // #region Condition checking.
    /**
     * Checks if the value **toCheck** is equal to the specified **equivalent**.
     *
     * @param toCheck		The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
     * @param equivalent	The {@link object } the one **toCheck** has to be equal to in order for this {@link DBC } to be
     * 						fulfilled.
     *
     * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
    static checkAlgorithm(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    toCheck, equivalent, invert) {
        if (!invert && equivalent !== toCheck) {
            return `Value has to to be equal to "${equivalent}"`;
        }
        if (invert && equivalent === toCheck) {
            return `Value must not to be equal to "${equivalent}"`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link EQ.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param equivalent	See {@link EQ.checkAlgorithm }.
     * @param path			See {@link DBC.decPrecondition }.
     * @param dbc			See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(
    // biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
    equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return EQ.checkAlgorithm(value, equivalent, invert);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link EQ.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param equivalent	See {@link EQ.checkAlgorithm }.
     * @param path			See {@link DBC.Postcondition }.
     * @param dbc			See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(
    // biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
    equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return EQ.checkAlgorithm(value, equivalent, invert);
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link EQ.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param equivalent	See {@link EQ.checkAlgorithm }.
     * @param path			See {@link DBC.decInvariant }.
     * @param dbc			See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(
    // biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
    equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new EQ(equivalent, invert)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link EQ.checkAlgorithm } passing the value **toCheck**, {@link EQ.equivalent } and {@link EQ.invert }.
     *
     * @param toCheck See {@link EQ.checkAlgorithm }.
     *
     * @returns See {@link EQ.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary to check against NULL & UNDEFINED.
    check(toCheck) {
        return EQ.checkAlgorithm(toCheck, this.equivalent, this.invert);
    }
    /**
     * Creates this {@link EQ } by setting the protected property {@link EQ.equivalent } used by {@link EQ.check }.
     *
     * @param equivalent See {@link EQ.check }. */
    constructor(
    // biome-ignore lint/suspicious/noExplicitAny: To be able to match UNDEFINED and NULL.
    equivalent, invert = false) {
        super();
        this.equivalent = equivalent;
        this.invert = invert;
    }
}


/***/ }),

/***/ "./src/DBC/INSTANCE.ts":
/*!*****************************!*\
  !*** ./src/DBC/INSTANCE.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   INSTANCE: () => (/* binding */ INSTANCE)
/* harmony export */ });
/* harmony import */ var _DBC__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../DBC */ "./src/DBC.ts");

/**
 * A {@link DBC } defining that the an {@link object }s gotta be an instance of a certain {@link INSTANCE.reference }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
class INSTANCE extends _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC {
    /**
     * Checks if the value **toCheck** is complies to the {@link RegExp } **expression**.
     *
     * @param toCheck	The value that has comply to the {@link RegExp } **expression** for this {@link DBC } to be fulfilled.
     * @param reference	The {@link RegExp } the one **toCheck** has comply to in order for this {@link DBC } to be
     * 					fulfilled.
     *
     * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    static checkAlgorithm(toCheck, reference) {
        if (!(toCheck instanceof reference)) {
            return `Value has to be an instance of "${reference}" but is of type "${typeof toCheck}"`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param reference	See {@link INSTANCE.checkAlgorithm }.
     * @param path	See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    reference, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return INSTANCE.checkAlgorithm(value, reference);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param reference	See {@link INSTANCE.checkAlgorithm }.
     * @param path	See {@link DBC.Postcondition }.
     * @param dbc	See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    reference, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return INSTANCE.checkAlgorithm(value, reference);
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param reference	See {@link INSTANCE.checkAlgorithm }.
     * @param path	See {@link DBC.decInvariant }.
     * @param dbc	See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    reference, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new INSTANCE(reference)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link INSTANCE.checkAlgorithm } passing the value **toCheck** and the {@link INSTANCE.reference } .
     *
     * @param toCheck See {@link INSTANCE.checkAlgorithm }.
     *
     * @returns See {@link INSTANCE.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    check(toCheck) {
        return INSTANCE.checkAlgorithm(toCheck, this.reference);
    }
    /**
     * Creates this {@link INSTANCE } by setting the protected property {@link INSTANCE.reference } used by {@link INSTANCE.check }.
     *
     * @param reference See {@link INSTANCE.check }. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    constructor(reference) {
        super();
        this.reference = reference;
    }
}


/***/ }),

/***/ "./src/DBC/REGEX.ts":
/*!**************************!*\
  !*** ./src/DBC/REGEX.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   REGEX: () => (/* binding */ REGEX)
/* harmony export */ });
/* harmony import */ var _DBC__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../DBC */ "./src/DBC.ts");

/**
 * A {@link DBC } providing {@link REGEX }-contracts and standard {@link RegExp } for common use cases in {@link REGEX.stdExp }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
class REGEX extends _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC {
    // #region Condition checking.
    /**
     * Checks if the value **toCheck** is complies to the {@link RegExp } **expression**.
     *
     * @param toCheck		The value that has comply to the {@link RegExp } **expression** for this {@link DBC } to be fulfilled.
     * @param expression	The {@link RegExp } the one **toCheck** has comply to in order for this {@link DBC } to be
     * 						fulfilled.
     *
     * @returns TRUE if the value **toCheck** complies with the {@link RegExp } **expression**, otherwise FALSE. */
    static checkAlgorithm(toCheck, expression) {
        if (!expression.test(toCheck)) {
            return `Value has to comply to regular expression "${expression}"`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param expression	See {@link REGEX.checkAlgorithm }.
     * @param path			See {@link DBC.decPrecondition }.
     * @param dbc			See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(expression, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return REGEX.checkAlgorithm(value, expression);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param expression	See {@link REGEX.checkAlgorithm }.
     * @param path			See {@link DBC.Postcondition }.
     * @param dbc			See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(expression, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return REGEX.checkAlgorithm(value, expression);
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param expression	See {@link REGEX.checkAlgorithm }.
     * @param path			See {@link DBC.decInvariant }.
     * @param dbc			See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(expression, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new REGEX(expression)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link REGEX.checkAlgorithm } passing the value **toCheck** and {@link REGEX.equivalent }.
     *
     * @param toCheck See {@link REGEX.checkAlgorithm }.
     *
     * @returns See {@link EQ.checkAlgorithm}. */
    check(toCheck) {
        return REGEX.checkAlgorithm(toCheck, this.expression);
    }
    /**
     * Creates this {@link REGEX } by setting the protected property {@link REGEX.expression } used by {@link REGEX.check }.
     *
     * @param expression See {@link REGEX.check }. */
    constructor(expression) {
        super();
        this.expression = expression;
    }
    // #endregion Referenced Condition checking.
    // #region In-Method checking.
    /**
     * Invokes the {@link REGEX.checkAlgorithm } passing the value **toCheck** and {@link REGEX.expression }.
     *
     * @param toCheck		See {@link REGEX.checkAlgorithm}.
     * @param expression	See {@link REGEX.checkAlgorithm}.
     */
    static check(toCheck, expression) {
        const checkResult = REGEX.checkAlgorithm(toCheck, expression);
        if (typeof checkResult === "string") {
            throw new _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.Infringement(checkResult);
        }
    }
}
/** Stores often used {@link RegExp }s. */
REGEX.stdExp = {
    htmlAttributeName: /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/,
    eMail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
    property: /^[$_A-Za-z][$_A-Za-z0-9]*$/,
    url: /^(?:(?:http:|https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:localhost|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(?::\d{2,5})?(?:\/(?:[\w\-\.]*\/)*[\w\-\.]+(?:\?\S*)?(?:#\S*)?)?$/i,
    keyPath: /^([a-zA-Z_$][a-zA-Z0-9_$]*\.)*[a-zA-Z_$][a-zA-Z0-9_$]*$/,
    date: /^\d{1,4}[.\/-]\d{1,2}[.\/-]\d{1,4}$/i,
    dateFormat: /^((D{1,2}[./-]M{1,2}[./-]Y{1,4})|(M{1,2}[./-]D{1,2}[./-]Y{1,4})|Y{1,4}[./-]D{1,2}[./-]M{1,2}|(Y{1,4}[./-]M{1,2}[./-]D{1,2}))$/i,
    cssSelector: /^(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\])(?:,\s*(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\]))*$/,
};


/***/ }),

/***/ "./src/DBC/TYPE.ts":
/*!*************************!*\
  !*** ./src/DBC/TYPE.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TYPE: () => (/* binding */ TYPE)
/* harmony export */ });
/* harmony import */ var _DBC__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../DBC */ "./src/DBC.ts");

/**
 * A {@link DBC } defining that an {@link object }s gotta be of certain {@link TYPE.type }.
 *
 * @remarks
 * Author: 		Salvatore Callari (Callari@WaXCode.net) / 2025
 * Maintainer:	Salvatore Callari (XDBC@WaXCode.net) */
class TYPE extends _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC {
    /**
     * Checks if the value **toCheck** is of the **type** specified.
     *
     * @param toCheck	The {@link Object } which's **type** to check.
     * @param type		The type the {@link object} **toCheck** has to be of.
     *
     * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
    static checkAlgorithm(toCheck, type) {
        // biome-ignore lint/suspicious/useValidTypeof: Necessary
        if (typeof toCheck !== type) {
            return `Value has to to be of type "${type}" but is of type "${typeof toCheck}"`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param type	See {@link TYPE.checkAlgorithm }.
     * @param path	See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(type, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return TYPE.checkAlgorithm(value, type);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param type	See {@link TYPE.checkAlgorithm }.
     * @param path	See {@link DBC.Postcondition }.
     * @param dbc	See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(type, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return TYPE.checkAlgorithm(value, type);
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param type	See {@link TYPE.checkAlgorithm }.
     * @param path	See {@link DBC.decInvariant }.
     * @param dbc	See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(type, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new TYPE(type)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link TYPE.checkAlgorithm } passing the value **toCheck** and the {@link TYPE.type } .
     *
     * @param toCheck See {@link TYPE.checkAlgorithm }.
     *
     * @returns See {@link TYPE.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    check(toCheck) {
        return TYPE.checkAlgorithm(toCheck, this.type);
    }
    /**
     * Creates this {@link TYPE } by setting the protected property {@link TYPE.type } used by {@link TYPE.check }.
     *
     * @param type See {@link TYPE.check }. */
    constructor(type) {
        super();
        this.type = type;
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/Demo.ts ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Demo: () => (/* binding */ Demo)
/* harmony export */ });
/* harmony import */ var _DBC__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DBC */ "./src/DBC.ts");
/* harmony import */ var _DBC_REGEX__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./DBC/REGEX */ "./src/DBC/REGEX.ts");
/* harmony import */ var _DBC_EQ__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DBC/EQ */ "./src/DBC/EQ.ts");
/* harmony import */ var _DBC_TYPE__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./DBC/TYPE */ "./src/DBC/TYPE.ts");
/* harmony import */ var _DBC_AE__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./DBC/AE */ "./src/DBC/AE.ts");
/* harmony import */ var _DBC_INSTANCE__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./DBC/INSTANCE */ "./src/DBC/INSTANCE.ts");
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (undefined && undefined.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};






/** Demonstrative use of **D**esign **B**y **C**ontract Decorators */
class Demo {
    constructor() {
        // #region Check Property Decorator
        this.testProperty = "a";
        // #endregion Check AE Index
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
}
__decorate([
    _DBC_REGEX__WEBPACK_IMPORTED_MODULE_1__.REGEX.INVARIANT(/^a$/),
    __metadata("design:type", Object)
], Demo.prototype, "testProperty", void 0);
__decorate([
    _DBC_REGEX__WEBPACK_IMPORTED_MODULE_1__.REGEX.POST(/^xxxx.*$/),
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_REGEX__WEBPACK_IMPORTED_MODULE_1__.REGEX.PRE(/holla*/g)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", String)
], Demo.prototype, "testParamvalueAndReturnvalue", null);
__decorate([
    _DBC_REGEX__WEBPACK_IMPORTED_MODULE_1__.REGEX.POST(/^xxxx.*$/),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", String)
], Demo.prototype, "testReturnvalue", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_EQ__WEBPACK_IMPORTED_MODULE_2__.EQ.PRE("SELECT", false, "tagName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [HTMLElement]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testEQAndPath", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_EQ__WEBPACK_IMPORTED_MODULE_2__.EQ.PRE("SELECT", true, "tagName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [HTMLElement]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testEQAndPathWithInversion", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_TYPE__WEBPACK_IMPORTED_MODULE_3__.TYPE.PRE("string")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testTYPE", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_AE__WEBPACK_IMPORTED_MODULE_4__.AE.PRE([new _DBC_TYPE__WEBPACK_IMPORTED_MODULE_3__.TYPE("string")])),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testAE", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_AE__WEBPACK_IMPORTED_MODULE_4__.AE.PRE(new _DBC_REGEX__WEBPACK_IMPORTED_MODULE_1__.REGEX(/^(?i:(NOW)|([+-]\d+[dmy]))$/i))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testREGEXWithAE", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider
    // biome-ignore lint/suspicious/noExplicitAny: Test
    ,
    __param(0, _DBC_INSTANCE__WEBPACK_IMPORTED_MODULE_5__.INSTANCE.PRE(Date)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testINSTANCE", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_AE__WEBPACK_IMPORTED_MODULE_4__.AE.PRE([new _DBC_TYPE__WEBPACK_IMPORTED_MODULE_3__.TYPE("string"), new _DBC_REGEX__WEBPACK_IMPORTED_MODULE_1__.REGEX(/^abc$/)], 1, 2)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testAERange", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_AE__WEBPACK_IMPORTED_MODULE_4__.AE.PRE([new _DBC_TYPE__WEBPACK_IMPORTED_MODULE_3__.TYPE("string"), new _DBC_REGEX__WEBPACK_IMPORTED_MODULE_1__.REGEX(/^abc$/)], 1)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testAEIndex", null);
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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUk7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUkscUNBQUc7QUFDUCxlQUFlLHVDQUFFLFNBQVMsNkNBQUs7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUkscUNBQUc7QUFDUDtBQUNBO0FBQ0EsZUFBZSxtREFBUTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxxQ0FBRztBQUNQLGVBQWUsdUNBQUUsVUFBVSwyQ0FBSSxnQkFBZ0IsNkNBQUs7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUkscUNBQUc7QUFDUCxlQUFlLHVDQUFFLFVBQVUsMkNBQUksZ0JBQWdCLDZDQUFLO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3hkYmMvLi9zcmMvREJDLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0FFLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0VRLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0lOU1RBTkNFLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL1JFR0VYLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL1RZUEUudHMiLCJ3ZWJwYWNrOi8veGRiYy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly94ZGJjL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly94ZGJjL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8veGRiYy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3hkYmMvLi9zcmMvRGVtby50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFByb3ZpZGVzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEZyYW1ld29yayB1c2luZyBkZWNvcmF0b3JzLlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgREJDIHtcbiAgICAvKipcbiAgICAgKiBNYWtlIGEgcmVxdWVzdCB0byBnZXQgdGhlIHZhbHVlIG9mIGEgY2VydGFpbiBwYXJhbWV0ZXIgb2Ygc3BlY2lmaWMgbWV0aG9kIGluIGEgc3BlY2lmaWMge0BsaW5rIG9iamVjdCB9LlxuICAgICAqIFRoYXQgcmVxdWVzdCBnZXRzIGVubGlzdGVkIGluIHtAbGluayBwYXJhbVZhbHVlUmVxdWVzdHMgfSB3aGljaCBpcyB1c2VkIGJ5IHtAbGluayBQYXJhbXZhbHVlUHJvdmlkZXJ9IHRvIGludm9rZSB0aGVcbiAgICAgKiBnaXZlbiBcInJlY2VwdG9yXCIgd2l0aCB0aGUgcGFyYW1ldGVyIHZhbHVlIHN0b3JlZCBpbiB0aGVyZS4gVGh1cyBhIHBhcmFtZXRlciBkZWNvcmF0b3IgdXNpbmcgdGhpcyBtZXRob2Qgd2lsbFxuICAgICAqIG5vdCByZWNlaXZlIGFueSB2YWx1ZSBvZiB0aGUgdG9wIG1ldGhvZCBpcyBub3QgdGFnZ2VkIHdpdGgge0BsaW5rIFBhcmFtdmFsdWVQcm92aWRlcn0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFyZ2V0XHRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gY29udGFpbmluZyB0aGUgbWV0aG9kIHdpdGggdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cbiAgICAgKiBAcGFyYW0gbWV0aG9kTmFtZVx0VGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aXRoIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXG4gICAgICogQHBhcmFtIGluZGV4XHRcdFx0VGhlIGluZGV4IG9mIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXG4gICAgICogQHBhcmFtIHJlY2VwdG9yXHRcdFRoZSBtZXRob2QgdGhlIHJlcXVlc3RlZCBwYXJhbWV0ZXItdmFsdWUgc2hhbGwgYmUgcGFzc2VkIHRvIHdoZW4gaXQgYmVjb21lcyBhdmFpbGFibGUuICovXG4gICAgc3RhdGljIHJlcXVlc3RQYXJhbVZhbHVlKHRhcmdldCwgbWV0aG9kTmFtZSwgaW5kZXgsIFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cbiAgICByZWNlcHRvcikge1xuICAgICAgICBpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXModGFyZ2V0KSkge1xuICAgICAgICAgICAgaWYgKERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuaGFzKG1ldGhvZE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuZ2V0KG1ldGhvZE5hbWUpLmhhcyhpbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLmdldCh0YXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KG1ldGhvZE5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KGluZGV4KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnB1c2gocmVjZXB0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLmdldCh0YXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KG1ldGhvZE5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2V0KGluZGV4LCBuZXcgQXJyYXkocmVjZXB0b3IpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBEQkMucGFyYW1WYWx1ZVJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgIC5nZXQodGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAuc2V0KG1ldGhvZE5hbWUsIG5ldyBNYXAoW1xuICAgICAgICAgICAgICAgICAgICBbaW5kZXgsIG5ldyBBcnJheShyZWNlcHRvcildLFxuICAgICAgICAgICAgICAgIF0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuc2V0KHRhcmdldCwgbmV3IE1hcChbXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICBtZXRob2ROYW1lLFxuICAgICAgICAgICAgICAgICAgICBuZXcgTWFwKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFtpbmRleCwgbmV3IEFycmF5KHJlY2VwdG9yKV0sXG4gICAgICAgICAgICAgICAgICAgIF0pLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBdKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgY2hlY2tpbmcgdGhlIHtAbGluayBwYXJhbVZhbHVlUmVxdWVzdHMgfSBmb3IgdmFsdWUtcmVxdWVzdHMgb2YgdGhlIG1ldGhvZCdzIHBhcmFtZXRlciB0aHVzXG4gICAgICogYWxzbyB1c2FibGUgb24gc2V0dGVycy5cbiAgICAgKiBXaGVuIGZvdW5kIGl0IHdpbGwgaW52b2tlIHRoZSBcInJlY2VwdG9yXCIgcmVnaXN0ZXJlZCB0aGVyZSwgaW50ZXIgYWxpYSBieSB7QGxpbmsgcmVxdWVzdFBhcmFtVmFsdWUgfSwgd2l0aCB0aGVcbiAgICAgKiBwYXJhbWV0ZXIncyB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YXJnZXQgXHRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gaG9zdGluZyB0aGUgdGFnZ2VkIG1ldGhvZCBhcyBwcm92aWRlZCBieSB0aGUgcnVudGltZS5cbiAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgXHRUaGUgdGFnZ2VkIG1ldGhvZCdzIG5hbWUgYXMgcHJvdmlkZWQgYnkgdGhlIHJ1bnRpbWUuXG4gICAgICogQHBhcmFtIGRlc2NyaXB0b3IgXHRUaGUge0BsaW5rIFByb3BlcnR5RGVzY3JpcHRvciB9IGFzIHByb3ZpZGVkIGJ5IHRoZSBydW50aW1lLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlIHtAbGluayBQcm9wZXJ0eURlc2NyaXB0b3IgfSB0aGF0IHdhcyBwYXNzZWQgYnkgdGhlIHJ1bnRpbWUuICovXG4gICAgc3RhdGljIFBhcmFtdmFsdWVQcm92aWRlcih0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKSB7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsTWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZTtcbiAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBHb3R0YSBiZSBhbnkgc2luY2UgcGFyYW1ldGVyLXZhbHVlcyBtYXkgYmUgdW5kZWZpbmVkLlxuICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIC8vICNyZWdpb25cdENoZWNrIGlmIGEgdmFsdWUgb2Ygb25lIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgaGFzIGJlZW4gcmVxdWVzdGVkIGFuZCBwYXNzIGl0IHRvIHRoZVxuICAgICAgICAgICAgLy9cdFx0XHRyZWNlcHRvciwgaWYgc28uXG4gICAgICAgICAgICBpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXModGFyZ2V0KSAmJlxuICAgICAgICAgICAgICAgIERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuaGFzKHByb3BlcnR5S2V5KSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaW5kZXggb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgICAuZ2V0KHRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgLmdldChwcm9wZXJ0eUtleSlcbiAgICAgICAgICAgICAgICAgICAgLmtleXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCBhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByZWNlcHRvciBvZiBEQkMucGFyYW1WYWx1ZVJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCh0YXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldChwcm9wZXJ0eUtleSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY2VwdG9yKGFyZ3NbaW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gXHRDaGVjayBpZiBhIHZhbHVlIG9mIG9uZSBvZiB0aGUgbWV0aG9kJ3MgcGFyYW1ldGVyIGhhcyBiZWVuIHJlcXVlc3RlZCBhbmQgcGFzcyBpdCB0byB0aGVcbiAgICAgICAgICAgIC8vIFx0XHRcdFx0cmVjZXB0b3IsIGlmIHNvLlxuICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1RoaXNJblN0YXRpYzogTmVjZXNzYXJ5LlxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZGVzY3JpcHRvcjtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBQYXJhbWV0ZXItdmFsdWUgcmVxdWVzdHMuXG4gICAgLy8gI3JlZ2lvbiBJbnZhcmlhbnRcbiAgICAvKipcbiAgICAgKiBBIHByb3BlcnR5LWRlY29yYXRvciBmYWN0b3J5IHNlcnZpbmcgYXMgYSAqKkQqKmVzaWduICoqQioqeSAqKkMqKm9udHJhY3QgSW52YXJpYW50LlxuICAgICAqIFNpbmNlIHRoZSB2YWx1ZSBtdXN0IGJlIGluaXRpYWxpemVkIG9yIHNldCBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCAqKmNvbnRyYWN0cyoqIHRoZSB2YWx1ZSB3aWxsIG9ubHkgYmUgY2hlY2tlZFxuICAgICAqIHdoZW4gYXNzaWduaW5nIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRyYWN0cyBUaGUge0BsaW5rIERCQyB9LUNvbnRyYWN0cyB0aGUgdmFsdWUgc2hhbGwgdXBob2xkLlxuICAgICAqXG4gICAgICogQHRocm93cyBcdEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSB3aGVuZXZlciB0aGUgcHJvcGVydHkgaXMgdHJpZWQgdG8gYmUgc2V0IHRvIGEgdmFsdWUgdGhhdCBkb2VzIG5vdCBjb21wbHkgdG8gdGhlXG4gICAgICogXHRcdFx0c3BlY2lmaWVkICoqY29udHJhY3RzKiosIGJ5IHRoZSByZXR1cm5lZCBtZXRob2QuKi9cbiAgICBzdGF0aWMgZGVjSW52YXJpYW50KGNvbnRyYWN0cywgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiAodGFyZ2V0LCBwcm9wZXJ0eUtleSkgPT4ge1xuICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICAgICAgICAgIGxldCB2YWx1ZTtcbiAgICAgICAgICAgIC8vICNyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5S2V5LCB7XG4gICAgICAgICAgICAgICAgc2V0KG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZShuZXdWYWx1ZSwgcGF0aCkgOiBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGNvbnRyYWN0IG9mIGNvbnRyYWN0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29udHJhY3QuY2hlY2socmVhbFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChyZXN1bHQsIHRhcmdldCwgcGF0aCwgcHJvcGVydHlLZXksIHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBJbnZhcmlhbnRcbiAgICAvLyAjcmVnaW9uIFBvc3Rjb25kaXRpb25cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZCBkZWNvcmF0b3IgZmFjdG9yeSBjaGVja2luZyB0aGUgcmVzdWx0IG9mIGEgbWV0aG9kIHdoZW5ldmVyIGl0IGlzIGludm9rZWQgdGh1cyBhbHNvIHVzYWJsZSBvbiBnZXR0ZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoZWNrXHRUaGUgKioodG9DaGVjazogYW55LCBvYmplY3QsIHN0cmluZykgPT4gYm9vbGVhbiB8IHN0cmluZyoqIHRvIHVzZSBmb3IgY2hlY2tpbmcuXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMucmVzb2x2ZURCQ1BhdGggfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0VGhlIGRvdHRlZCBwYXRoIHJlZmVycmluZyB0byB0aGUgYWN0dWFsIHZhbHVlIHRvIGNoZWNrLCBzdGFydGluZyBmb3JtIHRoZSBzcGVjaWZpZWQgb25lLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlICoqKCB0YXJnZXQgOiBvYmplY3QsIHByb3BlcnR5S2V5IDogc3RyaW5nLCBkZXNjcmlwdG9yIDogUHJvcGVydHlEZXNjcmlwdG9yICkgOiBQcm9wZXJ0eURlc2NyaXB0b3IqKlxuICAgICAqIFx0XHRcdGludm9rZWQgYnkgVHlwZXNjcmlwdC5cbiAgICAgKi9cbiAgICBzdGF0aWMgZGVjUG9zdGNvbmRpdGlvbihcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxuICAgIGNoZWNrLCBkYmMsIHBhdGggPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuICh0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbE1ldGhvZCA9IGRlc2NyaXB0b3IudmFsdWU7XG4gICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxuICAgICAgICAgICAgZGVzY3JpcHRvci52YWx1ZSA9ICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1RoaXNJblN0YXRpYzogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZShyZXN1bHQsIHBhdGgpIDogcmVzdWx0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrUmVzdWx0ID0gY2hlY2socmVhbFZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNoZWNrUmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIERCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykucmVwb3J0UmV0dXJudmFsdWVJbmZyaW5nZW1lbnQoY2hlY2tSZXN1bHQsIHRhcmdldCwgcGF0aCwgcHJvcGVydHlLZXksIHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3I7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUG9zdGNvbmRpdGlvblxuICAgIC8vICNyZWdpb24gRGVjb3JhdG9yXG4gICAgLy8gI3JlZ2lvbiBQcmVjb25kaXRpb25cbiAgICAvKipcbiAgICAgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB0aGF0IHJlcXVlc3RzIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgcGFzc2luZyBpdCB0byB0aGUgcHJvdmlkZWRcbiAgICAgKiBcImNoZWNrXCItbWV0aG9kIHdoZW4gdGhlIHZhbHVlIGJlY29tZXMgYXZhaWxhYmxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoZWNrXHRUaGUgXCIoIHVua25vd24gKSA9PiB2b2lkXCIgdG8gYmUgaW52b2tlZCBhbG9uZyB3aXRoIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgYXMgc29vblxuICAgICAqIFx0XHRcdFx0YXMgaXQgYmVjb21lcyBhdmFpbGFibGUuXG4gICAgICogQHBhcmFtIGRiYyAgXHRTZWUge0BsaW5rIERCQy5yZXNvbHZlREJDUGF0aCB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRUaGUgZG90dGVkIHBhdGggcmVmZXJyaW5nIHRvIHRoZSBhY3R1YWwgdmFsdWUgdG8gY2hlY2ssIHN0YXJ0aW5nIGZvcm0gdGhlIHNwZWNpZmllZCBvbmUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgKioodGFyZ2V0OiBvYmplY3QsIG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCwgcGFyYW1ldGVySW5kZXg6IG51bWJlciApID0+IHZvaWQqKiBpbnZva2VkIGJ5IFR5cGVzY3JpcHQtICovXG4gICAgc3RhdGljIGRlY1ByZWNvbmRpdGlvbihjaGVjaywgZGJjLCBwYXRoID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAodGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgREJDLnJlcXVlc3RQYXJhbVZhbHVlKHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZSh2YWx1ZSwgcGF0aCkgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjaGVjayhyZWFsVmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIERCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykucmVwb3J0UGFyYW1ldGVySW5mcmluZ2VtZW50KHJlc3VsdCwgdGFyZ2V0LCBwYXRoLCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCwgcmVhbFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhIHdhcm5pbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSBjb250YWluaW5nIHRoZSB3YXJuaW5nLiAqL1xuICAgIHJlcG9ydFdhcm5pbmcobWVzc2FnZSkge1xuICAgICAgICBpZiAodGhpcy53YXJuaW5nU2V0dGluZ3MubG9nVG9Db25zb2xlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhbiBpbmZyaW5nZW1lbnQgYWNjb3JkaW5nIHRvIHRoZSB7QGxpbmsgaW5mcmluZ2VtZW50U2V0dGluZ3MgfSBhbHNvIGdlbmVyYXRpbmcgYSBwcm9wZXIge0BsaW5rIHN0cmluZyB9LXdyYXBwZXJcbiAgICAgKiBmb3IgdGhlIGdpdmVuIFwibWVzc2FnZVwiICYgdmlvbGF0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZVx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXG4gICAgICogQHBhcmFtIHZpb2xhdG9yIFx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIG9yIG5hbWluZyB0aGUgdmlvbGF0b3IuICovXG4gICAgcmVwb3J0SW5mcmluZ2VtZW50KG1lc3NhZ2UsIHZpb2xhdG9yLCB0YXJnZXQsIHBhdGgpIHtcbiAgICAgICAgY29uc3QgZmluYWxNZXNzYWdlID0gYFsgRnJvbSBcIiR7dmlvbGF0b3J9XCIke3BhdGggPyBgJ3MgbWVtYmVyIFwiJHtwYXRofVwiYCA6IFwiXCJ9JHt0eXBlb2YgdGFyZ2V0ID09PSBcImZ1bmN0aW9uXCIgPyBgIGluIFwiJHt0YXJnZXQubmFtZX1cImAgOiB0eXBlb2YgdGFyZ2V0ID09PSBcIm9iamVjdFwiICYmIHRhcmdldCAhPT0gbnVsbCAmJiB0eXBlb2YgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBcImZ1bmN0aW9uXCIgPyBgIGluIFwiJHt0YXJnZXQuY29uc3RydWN0b3IubmFtZX1cImAgOiBcIlwifTogJHttZXNzYWdlfV1gO1xuICAgICAgICBpZiAodGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncy50aHJvd0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoZmluYWxNZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncy5sb2dUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGZpbmFsTWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhIHBhcmFtZXRlci1pbmZyaW5nZW1lbnQgdmlhIHtAbGluayByZXBvcnRJbmZyaW5nZW1lbnQgfSBhbHNvIGdlbmVyYXRpbmcgYSBwcm9wZXIge0BsaW5rIHN0cmluZyB9LXdyYXBwZXJcbiAgICAgKiBmb3IgdGhlIGdpdmVuIFwibWVzc2FnZVwiLFwibWV0aG9kXCIsIHBhcmFtZXRlci1cImluZGV4XCIgJiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cbiAgICAgKiBAcGFyYW0gbWV0aG9kIFx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIG9yIG5hbWluZyB0aGUgdmlvbGF0b3IuXG4gICAgICogQHBhcmFtIGluZGV4XHRcdFRoZSBpbmRleCBvZiB0aGUgcGFyYW1ldGVyIHdpdGhpbiB0aGUgYXJndW1lbnQgbGlzdGluZy5cbiAgICAgKiBAcGFyYW0gdmFsdWUgXHRUaGUgcGFyYW1ldGVyJ3MgdmFsdWUuICovXG4gICAgcmVwb3J0UGFyYW1ldGVySW5mcmluZ2VtZW50KG1lc3NhZ2UsIHRhcmdldCwgcGF0aCwgbWV0aG9kLCBpbmRleCwgdmFsdWUpIHtcbiAgICAgICAgY29uc3QgcHJvcGVySW5kZXggPSBpbmRleCArIDE7XG4gICAgICAgIHRoaXMucmVwb3J0SW5mcmluZ2VtZW50KGBbIFBhcmFtZXRlci12YWx1ZSBcIiR7dmFsdWV9XCIgb2YgdGhlICR7cHJvcGVySW5kZXh9JHtwcm9wZXJJbmRleCA9PT0gMSA/IFwic3RcIiA6IHByb3BlckluZGV4ID09PSAyID8gXCJuZFwiIDogcHJvcGVySW5kZXggPT09IDMgPyBcInJkXCIgOiBcInRoXCJ9IHBhcmFtZXRlciBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9XWAsIG1ldGhvZCwgdGFyZ2V0LCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhIGZpZWxkLWluZnJpbmdlbWVudCB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxuICAgICAqIGZvciB0aGUgZ2l2ZW4gKiptZXNzYWdlKiogJiAqKm5hbWUqKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlXHRBIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXG4gICAgICogQHBhcmFtIGtleSBcdFx0VGhlIHByb3BlcnR5IGtleS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRUaGUgZG90dGVkLXBhdGgge0BsaW5rIHN0cmluZyB9IHRoYXQgbGVhZHMgdG8gdGhlIHZhbHVlIG5vdCBmdWxmaWxsaW5nIHRoZSBjb250cmFjdCBzdGFydGluZyBmcm9tXG4gICAgICogXHRcdFx0XHRcdHRoZSB0YWdnZWQgb25lLlxuICAgICAqIEBwYXJhbSB2YWx1ZVx0XHRUaGUgdmFsdWUgbm90IGZ1bGZpbGxpbmcgYSBjb250cmFjdC4gKi9cbiAgICByZXBvcnRGaWVsZEluZnJpbmdlbWVudChtZXNzYWdlLCB0YXJnZXQsIHBhdGgsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoYFsgTmV3IHZhbHVlIGZvciBcIiR7a2V5fVwiJHtwYXRoID09PSB1bmRlZmluZWQgPyBcIlwiIDogYC4ke3BhdGh9YH0gd2l0aCB2YWx1ZSBcIiR7dmFsdWV9XCIgZGlkIG5vdCBmdWxmaWxsIG9uZSBvZiBpdCdzIGNvbnRyYWN0czogJHttZXNzYWdlfV1gLCBrZXksIHRhcmdldCwgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlcG9ydHMgYSByZXR1cm52YWx1ZS1pbmZyaW5nZW1lbnQgYWNjb3JkaW5nIHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXG4gICAgICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIixcIm1ldGhvZFwiICYgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZVx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXG4gICAgICogQHBhcmFtIG1ldGhvZCBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLlxuICAgICAqIEBwYXJhbSB2YWx1ZVx0XHRUaGUgcGFyYW1ldGVyJ3MgdmFsdWUuICovXG4gICAgcmVwb3J0UmV0dXJudmFsdWVJbmZyaW5nZW1lbnQobWVzc2FnZSwgdGFyZ2V0LCBwYXRoLCBtZXRob2QsIFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIHZhbHVlKSB7XG4gICAgICAgIHRoaXMucmVwb3J0SW5mcmluZ2VtZW50KGBbIFJldHVybi12YWx1ZSBcIiR7dmFsdWV9XCIgZGlkIG5vdCBmdWxmaWxsIG9uZSBvZiBpdCdzIGNvbnRyYWN0czogJHttZXNzYWdlfV1gLCBtZXRob2QsIHRhcmdldCwgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgdGhpcyB7QGxpbmsgREJDIH0gYnkgc2V0dGluZyB0aGUge0BsaW5rIERCQy5pbmZyaW5nZW1lbnRTZXR0aW5ncyB9LCBkZWZpbmUgdGhlICoqV2FYQ29kZSoqIG5hbWVzcGFjZSBpblxuICAgICAqICoqd2luZG93KiogaWYgbm90IHlldCBhdmFpbGFibGUgYW5kIHNldHRpbmcgdGhlIHByb3BlcnR5ICoqREJDKiogaW4gdGhlcmUgdG8gdGhlIGluc3RhbmNlIG9mIHRoaXMge0BsaW5rIERCQyB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIGluZnJpbmdlbWVudFNldHRpbmdzIFNlZSB7QGxpbmsgREJDLmluZnJpbmdlbWVudFNldHRpbmdzIH0uICovXG4gICAgY29uc3RydWN0b3IoaW5mcmluZ2VtZW50U2V0dGluZ3MgPSB7IHRocm93RXhjZXB0aW9uOiB0cnVlLCBsb2dUb0NvbnNvbGU6IGZhbHNlIH0pIHtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBQcmVjb25kaXRpb25cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBEZWNvcmF0b3JcbiAgICAgICAgLy8gI3JlZ2lvbiBXYXJuaW5nIGhhbmRsaW5nLlxuICAgICAgICAvKiogU3RvcmVzIHNldHRpbmdzIGNvbmNlcm5pbmcgd2FybmluZ3MuICovXG4gICAgICAgIHRoaXMud2FybmluZ1NldHRpbmdzID0geyBsb2dUb0NvbnNvbGU6IHRydWUgfTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBXYXJuaW5nIGhhbmRsaW5nLlxuICAgICAgICAvLyAjcmVnaW9uIGluZnJpbmdlbWVudCBoYW5kbGluZy5cbiAgICAgICAgLyoqIFN0b3JlcyB0aGUgc2V0dGluZ3MgY29uY2VybmluZyBpbmZyaW5nZW1lbnRzICovXG4gICAgICAgIHRoaXMuaW5mcmluZ2VtZW50U2V0dGluZ3MgPSB7IHRocm93RXhjZXB0aW9uOiB0cnVlLCBsb2dUb0NvbnNvbGU6IGZhbHNlIH07XG4gICAgICAgIHRoaXMuaW5mcmluZ2VtZW50U2V0dGluZ3MgPSBpbmZyaW5nZW1lbnRTZXR0aW5ncztcbiAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgIGlmICh3aW5kb3cuV2FYQ29kZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgd2luZG93LldhWENvZGUgPSB7fTtcbiAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgIHdpbmRvdy5XYVhDb2RlLkRCQyA9IHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgc3RhdGljIHJlc29sdmUodG9SZXNvbHZlRnJvbSwgcGF0aCkge1xuICAgICAgICBpZiAoIXRvUmVzb2x2ZUZyb20gfHwgdHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFydHMgPSBwYXRoLnJlcGxhY2UoL1xcWyhbJ1wiXT8pKC4qPylcXDFcXF0vZywgXCIuJDJcIikuc3BsaXQoXCIuXCIpOyAvLyBIYW5kbGUgaW5kZXhlcnNcbiAgICAgICAgbGV0IGN1cnJlbnQgPSB0b1Jlc29sdmVGcm9tO1xuICAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50ID09PSBudWxsIHx8IHR5cGVvZiBjdXJyZW50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1ldGhvZE1hdGNoID0gcGFydC5tYXRjaCgvKFxcdyspXFwoKC4qKVxcKS8pO1xuICAgICAgICAgICAgaWYgKG1ldGhvZE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IG1ldGhvZE1hdGNoWzFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3NTdHIgPSBtZXRob2RNYXRjaFsyXTtcbiAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gYXJnc1N0ci5zcGxpdChcIixcIikubWFwKChhcmcpID0+IGFyZy50cmltKCkpOyAvLyBTaW1wbGUgYXJndW1lbnQgcGFyc2luZ1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudFttZXRob2ROYW1lXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W21ldGhvZE5hbWVdLmFwcGx5KGN1cnJlbnQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gTWV0aG9kIG5vdCBmb3VuZCBvciBub3QgYSBmdW5jdGlvblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhcnRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyZW50O1xuICAgIH1cbn1cbi8vICNyZWdpb24gUGFyYW1ldGVyLXZhbHVlIHJlcXVlc3RzLlxuLyoqIFN0b3JlcyBhbGwgcmVxdWVzdCBmb3IgcGFyYW1ldGVyIHZhbHVlcyByZWdpc3RlcmVkIGJ5IHtAbGluayBkZWNQcmVjb25kaXRpb24gfS4gKi9cbkRCQy5wYXJhbVZhbHVlUmVxdWVzdHMgPSBuZXcgTWFwKCk7XG4vLyAjcmVnaW9uIENsYXNzZXNcbi8vICNyZWdpb24gRXJyb3JzXG4vKiogQW4ge0BsaW5rIEVycm9yIH0gdG8gYmUgdGhyb3duIHdoZW5ldmVyIGFuIGluZnJpbmdlbWVudCBpcyBkZXRlY3RlZC4gKi9cbkRCQy5JbmZyaW5nZW1lbnQgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIHRoaXMge0BsaW5rIEVycm9yIH0gYnkgdGFnZ2luZyB0aGUgc3BlY2lmaWVkIG1lc3NhZ2Ute0BsaW5rIHN0cmluZyB9IGFzIGFuIFhEQkMtSW5mcmluZ2VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgVGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQuICovXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihgWyBYREJDIEluZnJpbmdlbWVudCAke21lc3NhZ2V9XWApO1xuICAgIH1cbn07XG4vLyAjZW5kcmVnaW9uIEVycm9yc1xuLy8gI2VuZHJlZ2lvbiBDbGFzc2VzXG4vLyAjZW5kcmVnaW9uIGluZnJpbmdlbWVudCBoYW5kbGluZy5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIHNwZWNpZmllZCBkb3R0ZWQge0BsaW5rIHN0cmluZyB9LXBhdGggdG8gYSB7QGxpbmsgREJDIH0uXG4gKlxuICogQHBhcmFtIG9iaiBcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdG8gc3RhcnQgcmVzb2x2aW5nIGZyb20uXG4gKiBAcGFyYW0gcGF0aCBcdFRoZSBkb3R0ZWQge0BsaW5rIHN0cmluZyB9LXBhdGggbGVhZGluZyB0byB0aGUge0BsaW5rIERCQyB9LlxuICpcbiAqIEByZXR1cm5zIFRoZSByZXF1ZXN0ZWQge0BsaW5rIERCQyB9LlxuICovXG5EQkMucmVzb2x2ZURCQ1BhdGggPSAob2JqLCBwYXRoKSA9PiBwYXRoID09PSBudWxsIHx8IHBhdGggPT09IHZvaWQgMCA/IHZvaWQgMCA6IHBhdGguc3BsaXQoXCIuXCIpLnJlZHVjZSgoYWNjdW11bGF0b3IsIGN1cnJlbnQpID0+IGFjY3VtdWxhdG9yW2N1cnJlbnRdLCBvYmopO1xuLy8gU2V0IHRoZSBtYWluIGluc3RhbmNlIHdpdGggc3RhbmRhcmQgKipEQkMuaW5mcmluZ2VtZW50U2V0dGluZ3MqKi5cbm5ldyBEQkMoKTtcbiIsImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcbi8qKlxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbGwgZWxlbWVudHMgb2YgYW4ge0BsaW5rIG9iamVjdCB9cyBoYXZlIHRvIGZ1bGZpbGxcbiAqIGEgZ2l2ZW4ge0BsaW5rIG9iamVjdCB9J3MgY2hlY2stbWV0aG9kICgqKiggdG9DaGVjayA6IGFueSApID0+IGJvb2xlYW4gfCBzdHJpbmcqKikuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBBRSBleHRlbmRzIERCQyB7XG4gICAgLy8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGVhY2ggZWxlbWVudCBvZiB0aGUgKip2YWx1ZSoqLXtAbGluayBBcnJheSA8IGFueSA+fSBhZ2FpbnN0IHRoZSBnaXZlbiAqKmNvbmRpdGlvbioqLCBpZiBpdCBpcyBvbmUuIElmIGl0IGlzIG5vdFxuICAgICAqIHRoZSAqKnZhbHVlKiogaXRzZWxmIHdpbGwgYmUgY2hlY2tlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb25kaXRpb25cdFRoZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlICoqdmFsdWUqKiBhZ2FpbnN0LlxuICAgICAqIEBwYXJhbSB2YWx1ZVx0XHRFaXRoZXIgKip2YWx1ZSoqLXtAbGluayBBcnJheSA8IGFueSA+fSwgd2hpY2gncyBlbGVtZW50cyB3aWxsIGJlIGNoZWNrZWQsIG9yIHRoZSB2YWx1ZSB0byBiZVxuICAgICAqIFx0XHRcdFx0XHRjaGVja2VkIGl0c2VsZi5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0SWYgc3BlY2lmaWVkIHdpdGggKippZHhFbmQqKiBiZWluZyB1bmRlZmluZWQsIHRoaXMge0BsaW5rIE51bWJlciB9IHdpbGwgYmUgc2VlbiBhcyB0aGUgaW5kZXggb2ZcbiAgICAgKiBcdFx0XHRcdFx0dGhlIHZhbHVlLXtAbGluayBBcnJheSB9J3MgZWxlbWVudCB0byBjaGVjay4gSWYgdmFsdWUgaXNuJ3QgYW4ge0BsaW5rIEFycmF5IH0gdGhpcyBwYXJhbWV0ZXJcbiAgICAgKiBcdFx0XHRcdFx0d2lsbCBub3QgaGF2ZSBhbnkgZWZmZWN0LlxuICAgICAqIFx0XHRcdFx0XHRXaXRoICoqaWR4RW5kKiogbm90IHVuZGVmaW5lZCB0aGlzIHBhcmFtZXRlciBpbmRpY2F0ZXMgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3BhbiBvZiBlbGVtZW50cyB0b1xuICAgICAqIFx0XHRcdFx0XHRjaGVjayB3aXRoaW4gdGhlIHZhbHVlLXtAbGluayBBcnJheSB9LlxuICAgICAqIEBwYXJhbSBpZHhFbmRcdEluZGljYXRlcyB0aGUgbGFzdCBlbGVtZW50J3MgaW5kZXggKGluY2x1ZGluZykgb2YgdGhlIHNwYW4gb2YgdmFsdWUte0BsaW5rIEFycmF5IH0gZWxlbWVudHMgdG8gY2hlY2suXG4gICAgICogXHRcdFx0XHRcdFNldHRpbmcgdGhpcyBwYXJhbWV0ZXIgdG8gLTEgc3BlY2lmaWVzIHRoYXQgYWxsIHZhbHVlLXtAbGluayBBcnJheSB9J3MgZWxlbWVudHMgYmVnaW5uaW5nIGZyb20gdGhlXG4gICAgICogXHRcdFx0XHRcdHNwZWNpZmllZCAqKmluZGV4Kiogc2hhbGwgYmUgY2hlY2tlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEFzIHNvb24gYXMgdGhlICoqY29uZGl0aW9uKiogcmV0dXJucyBhIHtAbGluayBzdHJpbmcgfSwgaW5zdGVhZCBvZiBUUlVFLCB0aGUgcmV0dXJuZWQgc3RyaW5nLiBUUlVFIGlmIHRoZVxuICAgICAqIFx0XHRcdCoqY29uZGl0aW9uKiogbmV2ZXIgcmV0dXJucyBhIHtAbGluayBzdHJpbmd9LiAqL1xuICAgIHN0YXRpYyBjaGVja0FsZ29yaXRobShjb25kaXRpb24sIHZhbHVlLCBpbmRleCwgaWR4RW5kKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQgJiYgaWR4RW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSAmJiBpbmRleCA8IHZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb25kaXRpb24uY2hlY2sodmFsdWVbaW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgVmlvbGF0aW5nLUFycmF5ZWxlbWVudCBhdCBpbmRleCBcIiR7aW5kZXh9XCIgd2l0aCB2YWx1ZSBcIiR7dmFsdWVbaW5kZXhdfVwiLiAke3Jlc3VsdH1gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBJbiBvcmRlciBmb3Igb3B0aW9uYWwgcGFyYW1ldGVyIHRvIG5vdCBjYXVzZSBhbiBlcnJvciBpZiB0aGV5IGFyZSBvbWl0dGVkLlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZW5kaW5nID0gaWR4RW5kICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICA/IGlkeEVuZCAhPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBpZHhFbmQgKyAxXG4gICAgICAgICAgICAgICAgICAgIDogdmFsdWUubGVuZ3RoXG4gICAgICAgICAgICAgICAgOiB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gaW5kZXggPyBpbmRleCA6IDA7IGkgPCBlbmRpbmc7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbmRpdGlvbi5jaGVjayh2YWx1ZVtpXSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYFZpb2xhdGluZy1BcnJheWVsZW1lbnQgYXQgaW5kZXggJHtpfS4gJHtyZXN1bHR9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZGl0aW9uLmNoZWNrKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9IHdpdGggZWl0aGVyIG11bHRpcGxlIG9yIGEgc2luZ2xlIG9uZVxuICAgICAqIG9mIHRoZSAqKnJlYWxDb25kaXRpb25zKiogdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWUgYWdhaW5zdCB3aXRoLlxuICAgICAqIFdoZW4gc3BlY2lmeWluZyBhbiAqKmluZGV4KiogYW5kIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgKip2YWx1ZSoqIGlzIGFuIHtAbGluayBBcnJheSB9LCB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIGFwcGx5IHRvIHRoZVxuICAgICAqIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCAqKmluZGV4KiouXG4gICAgICogSWYgdGhlIHtAbGluayBBcnJheSB9IGlzIHRvbyBzaG9ydCB0aGUgY3VycmVudGx5IHByb2Nlc3NlZCB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gb2ZcbiAgICAgKiAqKnJlYWxDb25kaXRpb25zKiogd2lsbCBiZSB2ZXJpZmllZCB0byBUUlVFIGF1dG9tYXRpY2FsbHksIGNvbnNpZGVyaW5nIG9wdGlvbmFsIHBhcmFtZXRlcnMuXG4gICAgICogSWYgYW4gKippbmRleCoqIGlzIHNwZWNpZmllZCBidXQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBpc24ndCBhbiBhcnJheSwgdGhlICoqaW5kZXgqKiBpcyB0cmVhdGVkIGFzIGJlaW5nIHVuZGVmaW5lZC5cbiAgICAgKiBJZiAqKmluZGV4KiogaXMgdW5kZWZpbmVkIGFuZCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIGlzIGFuIHtAbGluayBBcnJheSB9IGVhY2ggZWxlbWVudCBvZiBpdCB3aWxsIGJlIGNoZWNrZWRcbiAgICAgKiBhZ2FpbnN0IHRoZSAqKnJlYWxDb25kaXRpb25zKiouXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWVcbiAgICAgKiBcdFx0XHRcdFx0XHRcdGFnYWluc3Qgd2l0aC5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGlkeEVuZFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZiAqKnJlYWxDb25kaXRpb25zKiogcmV0dXJucyBvbmUuXG4gICAgICogXHRcdFx0T3RoZXJ3aXNlIFRSVUUuICovXG4gICAgc3RhdGljIFBSRShyZWFsQ29uZGl0aW9ucywgaW5kZXggPSB1bmRlZmluZWQsIGlkeEVuZCA9IHVuZGVmaW5lZCwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVhbENvbmRpdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjdXJyZW50Q29uZGl0aW9uIG9mIHJlYWxDb25kaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEFFLmNoZWNrQWxnb3JpdGhtKGN1cnJlbnRDb25kaXRpb24sIHZhbHVlLCBpbmRleCwgaWR4RW5kKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT09IFwiYm9vbGVhblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQUUuY2hlY2tBbGdvcml0aG0ocmVhbENvbmRpdGlvbnMsIHZhbHVlLCBpbmRleCwgaWR4RW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCBkYmMsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXG4gICAgICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybi12YWx1ZSBhZ2FpbnN0IHdpdGguXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWVcbiAgICAgKiBcdFx0XHRcdFx0XHRcdGFnYWluc3Qgd2l0aC5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGlkeEVuZFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZiAqKnJlYWxDb25kaXRpb25zKiogcmV0dXJuIG9uZS5cbiAgICAgKiBcdFx0XHRPdGhlcndpc2UgVFJVRS4gKi9cbiAgICBzdGF0aWMgUE9TVChyZWFsQ29uZGl0aW9ucywgaW5kZXggPSB1bmRlZmluZWQsIGlkeEVuZCA9IHVuZGVmaW5lZCwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlYWxDb25kaXRpb25zKSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY3VycmVudENvbmRpdGlvbiBvZiByZWFsQ29uZGl0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBBRS5jaGVja0FsZ29yaXRobShjdXJyZW50Q29uZGl0aW9uLCB2YWx1ZSwgaW5kZXgsIGlkeEVuZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcImJvb2xlYW5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFFLmNoZWNrQWxnb3JpdGhtKFxuICAgICAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgICAgICAgIHJlYWxDb25kaXRpb25zLCB2YWx1ZSwgaW5kZXgsIGlkeEVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXG4gICAgICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIGZpZWxkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXG4gICAgICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXG4gICAgICogQHBhcmFtIGluZGV4XHRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBpZHhFbmRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKHJlYWxDb25kaXRpb25zLCBpbmRleCA9IHVuZGVmaW5lZCwgaWR4RW5kID0gdW5kZWZpbmVkLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBBRShyZWFsQ29uZGl0aW9ucywgaW5kZXgsIGlkeEVuZCldLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIGdsb2JhbCBmdW5jdGlvbnMpLlxuICAgIC8vXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBhbGwge0BsaW5rIEFFLmNvbmRpdGlvbnMgfSBhbmQgdGhlIHtAbGluayBvYmplY3QgfSB7QGxpbmsgdG9DaGVjayB9LFxuICAgICAqIHtAbGluayBBRS5pbmRleCB9ICYge0BsaW5rIEFFLmlkeEVuZCB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobX0uICovXG4gICAgY2hlY2sodG9DaGVjaykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmNvbmRpdGlvbnMpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGN1cnJlbnRDb25kaXRpb24gb2YgdGhpcy5jb25kaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gQUUuY2hlY2tBbGdvcml0aG0oY3VycmVudENvbmRpdGlvbiwgdG9DaGVjaywgdGhpcy5pbmRleCwgdGhpcy5pZHhFbmQpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcImJvb2xlYW5cIilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBBRS5jaGVja0FsZ29yaXRobShcbiAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgICAgdGhpcy5jb25kaXRpb25zLCB0b0NoZWNrLCB0aGlzLmluZGV4LCB0aGlzLmlkeEVuZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgQUUgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIEFFLmNvbmRpdGlvbnMgfSwge0BsaW5rIEFFLmluZGV4IH0gYW5kIHtAbGluayBBRS5pZHhFbmQgfSB1c2VkIGJ5IHtAbGluayBBRS5jaGVjayB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnQgU2VlIHtAbGluayBFUS5jaGVjayB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbmRpdGlvbnMsIGluZGV4ID0gdW5kZWZpbmVkLCBpZHhFbmQgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jb25kaXRpb25zID0gY29uZGl0aW9ucztcbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgICAgICB0aGlzLmlkeEVuZCA9IGlkeEVuZDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdHdvIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgZXF1YWwuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBFUSBleHRlbmRzIERCQyB7XG4gICAgLy8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBlcXVhbCB0byB0aGUgc3BlY2lmaWVkICoqZXF1aXZhbGVudCoqLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRoYXQgaGFzIHRvIGJlIGVxdWFsIHRvIGl0J3MgcG9zc2libGUgKiplcXVpdmFsZW50KiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudFx0VGhlIHtAbGluayBvYmplY3QgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyB0byBiZSBlcXVhbCB0byBpbiBvcmRlciBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0XHRmdWxmaWxsZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlICoqZXF1aXZhbGVudCoqIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyLCBvdGhlcndpc2UgRkFMU0UuICovXG4gICAgc3RhdGljIGNoZWNrQWxnb3JpdGhtKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIHRvQ2hlY2ssIGVxdWl2YWxlbnQsIGludmVydCkge1xuICAgICAgICBpZiAoIWludmVydCAmJiBlcXVpdmFsZW50ICE9PSB0b0NoZWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGludmVydCAmJiBlcXVpdmFsZW50ID09PSB0b0NoZWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIG11c3Qgbm90IHRvIGJlIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUoXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBjaGVjayBmb3IgVU5ERUZJTkVEIGFuZCBOVUxMLlxuICAgIGVxdWl2YWxlbnQsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gRVEuY2hlY2tBbGdvcml0aG0odmFsdWUsIGVxdWl2YWxlbnQsIGludmVydCk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXF1aXZhbGVudCwgaW52ZXJ0KTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgRVEoZXF1aXZhbGVudCwgaW52ZXJ0KV0sIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy9cbiAgICAvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxuICAgIC8vXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiosIHtAbGluayBFUS5lcXVpdmFsZW50IH0gYW5kIHtAbGluayBFUS5pbnZlcnQgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGNoZWNrIGFnYWluc3QgTlVMTCAmIFVOREVGSU5FRC5cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmVxdWl2YWxlbnQsIHRoaXMuaW52ZXJ0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBFUSB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgRVEuZXF1aXZhbGVudCB9IHVzZWQgYnkge0BsaW5rIEVRLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudCBTZWUge0BsaW5rIEVRLmNoZWNrIH0uICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBiZSBhYmxlIHRvIG1hdGNoIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmVxdWl2YWxlbnQgPSBlcXVpdmFsZW50O1xuICAgICAgICB0aGlzLmludmVydCA9IGludmVydDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdGhlIGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgYW4gaW5zdGFuY2Ugb2YgYSBjZXJ0YWluIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogU2FsdmF0b3JlIENhbGxhcmkgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgSU5TVEFOQ0UgZXh0ZW5kcyBEQkMge1xuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgY29tcGxpZXMgdG8gdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrXHRUaGUgdmFsdWUgdGhhdCBoYXMgY29tcGx5IHRvIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlXHRUaGUge0BsaW5rIFJlZ0V4cCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIGNvbXBseSB0byBpbiBvcmRlciBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0ZnVsZmlsbGVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgb2YgdGhlIHNwZWNpZmllZCAqKnR5cGUqKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgcmVmZXJlbmNlKSB7XG4gICAgICAgIGlmICghKHRvQ2hlY2sgaW5zdGFuY2VvZiByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7cmVmZXJlbmNlfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHt0eXBlb2YgdG9DaGVja31cImA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUFJFKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICByZWZlcmVuY2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXG4gICAgc3RhdGljIFBPU1QoXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBJbiBvcmRlciB0byBwZXJmb3JtIGFuIFwiaW5zdGFuY2VvZlwiIGNoZWNrLlxuICAgIHJlZmVyZW5jZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICByZWZlcmVuY2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IElOU1RBTkNFKHJlZmVyZW5jZSldLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cbiAgICAvL1xuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgcmV0dXJuIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMucmVmZXJlbmNlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBJTlNUQU5DRSB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgSU5TVEFOQ0UucmVmZXJlbmNlIH0gdXNlZCBieSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2sgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWZlcmVuY2UgU2VlIHtAbGluayBJTlNUQU5DRS5jaGVjayB9LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIGNvbnN0cnVjdG9yKHJlZmVyZW5jZSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnJlZmVyZW5jZSA9IHJlZmVyZW5jZTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IHByb3ZpZGluZyB7QGxpbmsgUkVHRVggfS1jb250cmFjdHMgYW5kIHN0YW5kYXJkIHtAbGluayBSZWdFeHAgfSBmb3IgY29tbW9uIHVzZSBjYXNlcyBpbiB7QGxpbmsgUkVHRVguc3RkRXhwIH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBSRUdFWCBleHRlbmRzIERCQyB7XG4gICAgLy8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBjb21wbGllcyB0byB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRoYXQgaGFzIGNvbXBseSB0byB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb25cdFRoZSB7QGxpbmsgUmVnRXhwIH0gdGhlIG9uZSAqKnRvQ2hlY2sqKiBoYXMgY29tcGx5IHRvIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZVxuICAgICAqIFx0XHRcdFx0XHRcdGZ1bGZpbGxlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGNvbXBsaWVzIHdpdGggdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuICAgIHN0YXRpYyBjaGVja0FsZ29yaXRobSh0b0NoZWNrLCBleHByZXNzaW9uKSB7XG4gICAgICAgIGlmICghZXhwcmVzc2lvbi50ZXN0KHRvQ2hlY2spKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byBjb21wbHkgdG8gcmVndWxhciBleHByZXNzaW9uIFwiJHtleHByZXNzaW9ufVwiYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXhwcmVzc2lvbiwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFJFR0VYLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBleHByZXNzaW9uKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXG4gICAgc3RhdGljIFBPU1QoZXhwcmVzc2lvbiwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXhwcmVzc2lvbik7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChleHByZXNzaW9uLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBSRUdFWChleHByZXNzaW9uKV0sIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy9cbiAgICAvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxuICAgIC8vXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHtAbGluayBSRUdFWC5lcXVpdmFsZW50IH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtfS4gKi9cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmV4cHJlc3Npb24pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoaXMge0BsaW5rIFJFR0VYIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0gdXNlZCBieSB7QGxpbmsgUkVHRVguY2hlY2sgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHByZXNzaW9uIFNlZSB7QGxpbmsgUkVHRVguY2hlY2sgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihleHByZXNzaW9uKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvbiA9IGV4cHJlc3Npb247XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBJbi1NZXRob2QgY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVja1x0XHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtfS5cbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobX0uXG4gICAgICovXG4gICAgc3RhdGljIGNoZWNrKHRvQ2hlY2ssIGV4cHJlc3Npb24pIHtcbiAgICAgICAgY29uc3QgY2hlY2tSZXN1bHQgPSBSRUdFWC5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCBleHByZXNzaW9uKTtcbiAgICAgICAgaWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoY2hlY2tSZXN1bHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqIFN0b3JlcyBvZnRlbiB1c2VkIHtAbGluayBSZWdFeHAgfXMuICovXG5SRUdFWC5zdGRFeHAgPSB7XG4gICAgaHRtbEF0dHJpYnV0ZU5hbWU6IC9eW2EtekEtWl86XVthLXpBLVowLTlfLjotXSokLyxcbiAgICBlTWFpbDogL15bYS16QS1aMC05Ll8lKy1dK0BbYS16QS1aMC05Li1dK1xcLlthLXpBLVpdezIsfSQvaSxcbiAgICBwcm9wZXJ0eTogL15bJF9BLVphLXpdWyRfQS1aYS16MC05XSokLyxcbiAgICB1cmw6IC9eKD86KD86aHR0cDp8aHR0cHM/fGZ0cCk6XFwvXFwvKT8oPzpcXFMrKD86OlxcUyopP0ApPyg/OmxvY2FsaG9zdHwoPzpbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT9cXC4pK1thLXpBLVpdezIsfSkoPzo6XFxkezIsNX0pPyg/OlxcLyg/OltcXHdcXC1cXC5dKlxcLykqW1xcd1xcLVxcLl0rKD86XFw/XFxTKik/KD86I1xcUyopPyk/JC9pLFxuICAgIGtleVBhdGg6IC9eKFthLXpBLVpfJF1bYS16QS1aMC05XyRdKlxcLikqW2EtekEtWl8kXVthLXpBLVowLTlfJF0qJC8sXG4gICAgZGF0ZTogL15cXGR7MSw0fVsuXFwvLV1cXGR7MSwyfVsuXFwvLV1cXGR7MSw0fSQvaSxcbiAgICBkYXRlRm9ybWF0OiAvXigoRHsxLDJ9Wy4vLV1NezEsMn1bLi8tXVl7MSw0fSl8KE17MSwyfVsuLy1dRHsxLDJ9Wy4vLV1ZezEsNH0pfFl7MSw0fVsuLy1dRHsxLDJ9Wy4vLV1NezEsMn18KFl7MSw0fVsuLy1dTXsxLDJ9Wy4vLV1EezEsMn0pKSQvaSxcbiAgICBjc3NTZWxlY3RvcjogL14oPzpcXCp8I1tcXHctXSt8XFwuW1xcdy1dK3woPzpbXFx3LV0rfFxcKikoPzo6KD86W1xcdy1dKyg/OlxcKFtcXHctXStcXCkpPykrKT8oPzpcXFsoPzpbXFx3LV0rKD86KD86PXx+PXxcXHw9fFxcKj18XFwkPXxcXF49KVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqKT8pP1xcXSkrfFxcW1xccypbXFx3LV0rXFxzKj1cXHMqKD86XCJbXlwiXSpcInwnW14nXSonfFtcXHctXSspXFxzKlxcXSkoPzosXFxzKig/OlxcKnwjW1xcdy1dK3xcXC5bXFx3LV0rfCg/OltcXHctXSt8XFwqKSg/OjooPzpbXFx3LV0rKD86XFwoW1xcdy1dK1xcKSk/KSspPyg/OlxcWyg/OltcXHctXSsoPzooPzo9fH49fFxcfD18XFwqPXxcXCQ9fFxcXj0pXFxzKig/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXFx3LV0rKVxccyopPyk/XFxdKSt8XFxbXFxzKltcXHctXStcXHMqPVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqXFxdKSkqJC8sXG59O1xuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgb2YgY2VydGFpbiB7QGxpbmsgVFlQRS50eXBlIH0uXG4gKlxuICogQHJlbWFya3NcbiAqIEF1dGhvcjogXHRcdFNhbHZhdG9yZSBDYWxsYXJpIChDYWxsYXJpQFdhWENvZGUubmV0KSAvIDIwMjVcbiAqIE1haW50YWluZXI6XHRTYWx2YXRvcmUgQ2FsbGFyaSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBUWVBFIGV4dGVuZHMgREJDIHtcbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIG9mIHRoZSAqKnR5cGUqKiBzcGVjaWZpZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVja1x0VGhlIHtAbGluayBPYmplY3QgfSB3aGljaCdzICoqdHlwZSoqIHRvIGNoZWNrLlxuICAgICAqIEBwYXJhbSB0eXBlXHRcdFRoZSB0eXBlIHRoZSB7QGxpbmsgb2JqZWN0fSAqKnRvQ2hlY2sqKiBoYXMgdG8gYmUgb2YuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBvZiB0aGUgc3BlY2lmaWVkICoqdHlwZSoqLCBvdGhlcndpc2UgRkFMU0UuICovXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgZm9yIGR5bmFtaWMgdHlwZSBjaGVja2luZyBvZiBhbHNvIFVOREVGSU5FRC5cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdHlwZSkge1xuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL3VzZVZhbGlkVHlwZW9mOiBOZWNlc3NhcnlcbiAgICAgICAgaWYgKHR5cGVvZiB0b0NoZWNrICE9PSB0eXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBvZiB0eXBlIFwiJHt0eXBlfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHt0eXBlb2YgdG9DaGVja31cImA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHR5cGVcdFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUodHlwZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFRZUEUuY2hlY2tBbGdvcml0aG0odmFsdWUsIHR5cGUpO1xuICAgICAgICB9LCBkYmMsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHR5cGVcdFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKHR5cGUsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgdHlwZSk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKHR5cGUsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IFRZUEUodHlwZSldLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cbiAgICAvL1xuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSB7QGxpbmsgVFlQRS50eXBlIH0gLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgcmV0dXJuIFRZUEUuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy50eXBlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBUWVBFIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBUWVBFLnR5cGUgfSB1c2VkIGJ5IHtAbGluayBUWVBFLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHlwZSBTZWUge0BsaW5rIFRZUEUuY2hlY2sgfS4gKi9cbiAgICBjb25zdHJ1Y3Rvcih0eXBlKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgfVxufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJ2YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xudmFyIF9fcGFyYW0gPSAodGhpcyAmJiB0aGlzLl9fcGFyYW0pIHx8IGZ1bmN0aW9uIChwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cbn07XG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi9EQkNcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcIi4vREJDL1JFR0VYXCI7XG5pbXBvcnQgeyBFUSB9IGZyb20gXCIuL0RCQy9FUVwiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCIuL0RCQy9UWVBFXCI7XG5pbXBvcnQgeyBBRSB9IGZyb20gXCIuL0RCQy9BRVwiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwiLi9EQkMvSU5TVEFOQ0VcIjtcbi8qKiBEZW1vbnN0cmF0aXZlIHVzZSBvZiAqKkQqKmVzaWduICoqQioqeSAqKkMqKm9udHJhY3QgRGVjb3JhdG9ycyAqL1xuZXhwb3J0IGNsYXNzIERlbW8ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvLyAjcmVnaW9uIENoZWNrIFByb3BlcnR5IERlY29yYXRvclxuICAgICAgICB0aGlzLnRlc3RQcm9wZXJ0eSA9IFwiYVwiO1xuICAgICAgICAvLyAjZW5kcmVnaW9uIENoZWNrIEFFIEluZGV4XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgUHJvcGVydHkgRGVjb3JhdG9yXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBQYXJhbWV0ZXIuICYgUmV0dXJudmFsdWUgRGVjb3JhdG9yXG4gICAgdGVzdFBhcmFtdmFsdWVBbmRSZXR1cm52YWx1ZShhKSB7XG4gICAgICAgIHJldHVybiBgeHh4eCR7YX1gO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFBhcmFtZXRlci4gJiBSZXR1cm52YWx1ZSBEZWNvcmF0b3JcbiAgICAvLyAjcmVnaW9uIENoZWNrIFJldHVybnZhbHVlIERlY29yYXRvclxuICAgIHRlc3RSZXR1cm52YWx1ZShhKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFJldHVybnZhbHVlIERlY29yYXRvclxuICAgIC8vICNyZWdpb24gQ2hlY2sgRVEtREJDICYgUGF0aCB0byBwcm9wZXJ0eSBvZiBQYXJhbWV0ZXItdmFsdWVcbiAgICB0ZXN0RVFBbmRQYXRoKG8pIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgRVEtREJDICYgUGF0aCB0byBwcm9wZXJ0eSBvZiBQYXJhbWV0ZXItdmFsdWVcbiAgICAvLyAjcmVnaW9uIENoZWNrIEVRLURCQyAmIFBhdGggdG8gcHJvcGVydHkgb2YgUGFyYW1ldGVyLXZhbHVlIHdpdGggSW52ZXJzaW9uXG4gICAgdGVzdEVRQW5kUGF0aFdpdGhJbnZlcnNpb24obykgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBFUS1EQkMgJiBQYXRoIHRvIHByb3BlcnR5IG9mIFBhcmFtZXRlci12YWx1ZSB3aXRoIEludmVyc2lvblxuICAgIC8vICNyZWdpb24gQ2hlY2sgVFlQRVxuICAgIHRlc3RUWVBFKG8pIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgVFlQRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgQUVcbiAgICB0ZXN0QUUoeCkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBBRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgUkVHRVggd2l0aCBBRVxuICAgIHRlc3RSRUdFWFdpdGhBRSh4KSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFJFR0VYIHdpdGggQUVcbiAgICAvLyAjcmVnaW9uIENoZWNrIElOU1RBTkNFXG4gICAgdGVzdElOU1RBTkNFKGNhbmRpZGF0ZSkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBJTlNUQU5DRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgQUUgUmFuZ2VcbiAgICB0ZXN0QUVSYW5nZSh4KSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIEFFIFJhbmdlXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBBRSBJbmRleFxuICAgIHRlc3RBRUluZGV4KHgpIHsgfVxufVxuX19kZWNvcmF0ZShbXG4gICAgUkVHRVguSU5WQVJJQU5UKC9eYSQvKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgT2JqZWN0KVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdFByb3BlcnR5XCIsIHZvaWQgMCk7XG5fX2RlY29yYXRlKFtcbiAgICBSRUdFWC5QT1NUKC9eeHh4eC4qJC8pLFxuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBSRUdFWC5QUkUoL2hvbGxhKi9nKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW1N0cmluZ10pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCBTdHJpbmcpXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0UGFyYW12YWx1ZUFuZFJldHVybnZhbHVlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgUkVHRVguUE9TVCgvXnh4eHguKiQvKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbU3RyaW5nXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIFN0cmluZylcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RSZXR1cm52YWx1ZVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBFUS5QUkUoXCJTRUxFQ1RcIiwgZmFsc2UsIFwidGFnTmFtZVwiKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0hUTUxFbGVtZW50XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RFUUFuZFBhdGhcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgRVEuUFJFKFwiU0VMRUNUXCIsIHRydWUsIFwidGFnTmFtZVwiKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0hUTUxFbGVtZW50XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RFUUFuZFBhdGhXaXRoSW52ZXJzaW9uXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIFRZUEUuUFJFKFwic3RyaW5nXCIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbT2JqZWN0XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RUWVBFXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEFFLlBSRShbbmV3IFRZUEUoXCJzdHJpbmdcIildKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RBRVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBBRS5QUkUobmV3IFJFR0VYKC9eKD9pOihOT1cpfChbKy1dXFxkK1tkbXldKSkkL2kpKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RSRUdFWFdpdGhBRVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IFRlc3RcbiAgICAsXG4gICAgX19wYXJhbSgwLCBJTlNUQU5DRS5QUkUoRGF0ZSkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtPYmplY3RdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdElOU1RBTkNFXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEFFLlBSRShbbmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXmFiYyQvKV0sIDEsIDIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbQXJyYXldKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdEFFUmFuZ2VcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgQUUuUFJFKFtuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eYWJjJC8pXSwgMSkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtBcnJheV0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0QUVJbmRleFwiLCBudWxsKTtcbmNvbnN0IGRlbW8gPSBuZXcgRGVtbygpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RQcm9wZXJ0eSA9IFwiYWJkXCI7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5WQVJJQU5UIEluZnJpbmdlbWVudFwiLCBcIk9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RQcm9wZXJ0eSA9IFwiYVwiO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIklOVkFSSUFOVCBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG5kZW1vLnRlc3RQYXJhbXZhbHVlQW5kUmV0dXJudmFsdWUoXCJob2xsYVwiKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJQQVJBTUVURVItICYgUkVUVVJOVkFMVUUgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RQYXJhbXZhbHVlQW5kUmV0dXJudmFsdWUoXCJ5eXl5XCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlBBUkFNRVRFUi0gJiBSRVRVUk5WQUxVRSBJbmZyaW5nZW1lbnRcIiwgXCJPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0UmV0dXJudmFsdWUoXCJ4eHh4XCIpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIlJFVFVSTlZBTFVFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0UmV0dXJudmFsdWUoXCJ5eXl5XCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlJFVFVSTlZBTFVFIEluZnJpbmdlbWVudFwiLCBcIk9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RFUUFuZFBhdGgoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiRVEgd2l0aCBQYXRoIEluZnJpbmdlbWVudCBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEVRQW5kUGF0aFdpdGhJbnZlcnNpb24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKSk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiRVEgd2l0aCBQYXRoIGFuZCBJbnZlcnNpb24gSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RUWVBFKFwieFwiKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJUWVBFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0VFlQRSgwKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJUWVBFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0QUUoW1wiMTFcIiwgXCIxMFwiLCBcImJcIl0pO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIkFFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0QUUoW1wiMTFcIiwgMTEsIFwiYlwiXSk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiQUUgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RSRUdFWFdpdGhBRShbXCIrMWRcIiwgXCJOT1dcIiwgXCItMTB5XCJdKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJSRUdFWCB3aXRoIEFFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0UkVHRVhXaXRoQUUoW1wiKzFkXCIsIFwiKzVkXCIsIFwiLXgxMHlcIl0pO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlJFR0VYIHdpdGggQUUgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RJTlNUQU5DRShuZXcgRGF0ZSgpKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJJTlNUQU5DRSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdElOU1RBTkNFKGRlbW8pO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOU1RBTkNFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0QUVSYW5nZShbMTEsIFwiYWJjXCIsIFwiYWJjXCJdKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJBRSBSYW5nZSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEFFUmFuZ2UoWzExLCBcImFiY1wiLCAvYS9nXSk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiQUUgUmFuZ2UgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RBRUluZGV4KFsxMSwgXCJhYmNcIiwgXCJhYmNcIl0pO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIkFFIEluZGV4IE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0QUVJbmRleChbXCIxMVwiLCAxMiwgXCIvYS9nXCJdKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJBRSBJbmRleCBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==