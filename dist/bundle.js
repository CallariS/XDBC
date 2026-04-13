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
    static getHost() {
        return typeof window !== "undefined" ? window : globalThis;
    }
    static getDBC(dbc) {
        const path = dbc !== null && dbc !== void 0 ? dbc : "WaXCode.DBC";
        if (DBC.dbcCache.has(path)) {
            return DBC.dbcCache.get(path);
        }
        const resolved = DBC.resolveDBCPath(DBC.getHost(), path);
        if (resolved) {
            DBC.dbcCache.set(path, resolved);
        }
        return resolved;
    }
    /**
     * Generate a unique key for storing parameter value requests.
     * Format: "ClassName:methodName"
     */
    static getRequestKey(target, methodName) {
        var _a;
        const className = typeof target === 'function' ? target.name : ((_a = target.constructor) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown';
        return `${className}:${String(methodName)}`;
    }
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
        const key = DBC.getRequestKey(target, methodName);
        if (DBC.paramValueRequests.has(key)) {
            if (DBC.paramValueRequests.get(key).has(index)) {
                DBC.paramValueRequests.get(key).get(index).push(receptor);
            }
            else {
                DBC.paramValueRequests.get(key).set(index, new Array(receptor));
            }
        }
        else {
            DBC.paramValueRequests.set(key, new Map([
                [index, new Array(receptor)],
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
        const isStatic = typeof target === 'function';
        // biome-ignore lint/suspicious/noExplicitAny: Gotta be any since parameter-values may be undefined.
        descriptor.value = function (...args) {
            // #region   Check if a value of one of the method's parameter has been requested and pass it to the
            //           receptor, if so.
            const actualTarget = isStatic ? this : this.constructor;
            const key = DBC.getRequestKey(actualTarget, propertyKey);
            if (DBC.paramValueRequests.has(key)) {
                for (const index of DBC.paramValueRequests.get(key).keys()) {
                    if (index < args.length) {
                        for (const receptor of DBC.paramValueRequests.get(key).get(index)) {
                            receptor(args[index]);
                        }
                    }
                }
            }
            else {
                console.warn("No parameter value requests found for key:", key);
            }
            // #endregion	Check if a value of one of the method's parameter has been requested and pass it to the
            //              receptor, if so.
            return originalMethod.apply(this, args);
        };
        return descriptor;
    }
    // #endregion Parameter-value requests.
    // #region Class
    /**
     * A property-decorator factory serving as a **D**esign **B**y **C**ontract Invariant.
     * This invariant aims to check the instance of the class not the value to be get or set.
     *
     * @param contracts The {@link DBC }-Contracts the value shall uphold.
     *
     * @throws 	A {@link DBC.Infringement } whenever the property is tried to be get or set without the instance of it's class
     * 			fulfilling the specified **contracts**. */
    static decClassInvariant(contracts, path = undefined, dbc = "WaXCode.DBC") {
        return (target, propertyKey, descriptor) => {
            if (!DBC.getDBC(dbc).executionSettings.checkInvariants) {
                return;
            }
            const originalSetter = descriptor.set;
            const originalGetter = descriptor.get;
            // biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
            let value;
            // #region Replace original property.
            Object.defineProperty(target, propertyKey, {
                get() {
                    if (!DBC.getDBC(dbc).executionSettings.checkInvariants) {
                        return;
                    }
                    const realValue = path ? DBC.resolve(this, path) : this;
                    // #region Check if all "contracts" are fulfilled.
                    for (const contract of contracts) {
                        const result = contract.check(realValue);
                        if (typeof result === "string") {
                            DBC.getDBC(dbc).reportFieldInfringement(result, target, path, propertyKey, realValue);
                        }
                    }
                    // #endregion Check if all "contracts" are fulfilled.
                    return originalGetter[propertyKey];
                },
                set(newValue) {
                    if (!DBC.getDBC(dbc).executionSettings.checkInvariants) {
                        return;
                    }
                    const realValue = path ? DBC.resolve(this, path) : this;
                    // #region Check if all "contracts" are fulfilled.
                    for (const contract of contracts) {
                        const result = contract.check(realValue);
                        if (typeof result === "string") {
                            DBC.getDBC(dbc).reportFieldInfringement(result, target, path, propertyKey, realValue);
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
    // #endregion Class
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
    static decInvariant(contracts, path = undefined, dbc = undefined, hint = undefined) {
        return (target, propertyKey) => {
            if (!DBC.getDBC(dbc).executionSettings.checkInvariants) {
                return;
            }
            // biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
            let value;
            // #region Replace original property.
            Object.defineProperty(target, propertyKey, {
                set(newValue) {
                    if (!DBC.getDBC(dbc).executionSettings.checkInvariants) {
                        return;
                    }
                    const realValue = path ? DBC.resolve(newValue, path) : newValue;
                    // #region Check if all "contracts" are fulfilled.
                    for (const contract of contracts) {
                        const result = contract.check(realValue);
                        if (typeof result === "string") {
                            DBC.getDBC(dbc).reportFieldInfringement(result, target, path, propertyKey, realValue, hint);
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
    check, dbc = undefined, path = undefined, hint = undefined) {
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;
            // biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
            descriptor.value = (...args) => {
                if (!DBC.getDBC(dbc).executionSettings.checkPostconditions) {
                    return;
                }
                // biome-ignore lint/complexity/noThisInStatic: <explanation>
                const result = originalMethod.apply(this, args);
                const realValue = path ? DBC.resolve(result, path) : result;
                const checkResult = check(realValue, target, propertyKey);
                if (typeof checkResult === "string") {
                    DBC.getDBC(dbc).reportReturnvalueInfringement(checkResult, target, path, propertyKey, realValue, hint);
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
     * 				May contain :: to separate multiple paths.
     *
     * @returns The **(target: object, methodName: string | symbol, parameterIndex: number ) => void** invoked by Typescript- */
    static decPrecondition(check, dbc = undefined, path = undefined, hint = undefined) {
        const paths = path ? path.replace(/ /g, "").split("::") : [undefined];
        return (target, methodName, parameterIndex) => {
            DBC.requestParamValue(target, methodName, parameterIndex, (value) => {
                if (!DBC.getDBC(dbc).executionSettings.checkPreconditions) {
                    return;
                }
                for (const singlePath of paths) {
                    const realValue = singlePath ? DBC.resolve(value, singlePath) : value;
                    const result = check(realValue, target, methodName, parameterIndex);
                    if (typeof result === "string") {
                        DBC.getDBC(dbc).reportParameterInfringement(result, target, singlePath, methodName, parameterIndex, realValue, hint);
                    }
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
    reportInfringement(message, violator, target, value, path, hint = undefined) {
        const finalMessage = `[ From "${violator}"${typeof target === "function" ? ` in "${target.name}"` : typeof target === "object" && target !== null && typeof target.constructor === "function" ? ` in "${target.constructor.name}"` : `in "${target}"`}${path ? ` > "${path}"` : ""}: ${message} ${hint ? `✨ ${hint} ✨` : ""}]`;
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
    reportParameterInfringement(message, target, path, method, index, value, hint = undefined) {
        const properIndex = index + 1;
        this.reportInfringement(`[ Parameter-value "${value}" of the ${properIndex}${properIndex === 1 ? "st" : properIndex === 2 ? "nd" : properIndex === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${message} ]`, method, target, value, path, hint);
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
    reportFieldInfringement(message, target, path, key, value, hint = undefined) {
        this.reportInfringement(`[ New value for "${key}"${path === undefined ? "" : `.${path}`} with value "${value}" did not fulfill one of it's contracts: ${message} ]`, key, target, value, path);
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
    value, hint = undefined) {
        this.reportInfringement(`[ Return-value "${value}" did not fulfill one of it's contracts: ${message} ]`, method, target, value, path, hint);
    }
    /**
     * Constructs this {@link DBC } by setting the {@link DBC.infringementSettings }, define the **WaXCode** namespace in
     * **window** if not yet available and setting the property **DBC** in there to the instance of this {@link DBC }.
     *
     * @param infringementSettings 	See {@link DBC.infringementSettings }.
     * @param executionSettings		See {@link DBC.executionSettings }. */
    constructor(infringementSettings = { throwException: true, logToConsole: false }, executionSettings = {
        checkPreconditions: true,
        checkPostconditions: true,
        checkInvariants: true,
    }) {
        // #endregion Precondition
        // #endregion Decorator
        // #region Execution Handling
        /** Stores settings concerning the execution of checks. */
        this.executionSettings = {
            checkPreconditions: true,
            checkPostconditions: true,
            checkInvariants: true,
        };
        // #endregion Execution Handling
        // #region Warning handling.
        /** Stores settings concerning warnings. */
        this.warningSettings = { logToConsole: true };
        // #endregion Warning handling.
        // #region infringement handling.
        /** Stores the settings concerning infringements */
        this.infringementSettings = { throwException: true, logToConsole: false };
        this.infringementSettings = infringementSettings;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        if (DBC.getHost().WaXCode === undefined)
            DBC.getHost().WaXCode = {};
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        DBC.getHost().WaXCode.DBC = this;
        DBC.dbcCache.set("WaXCode.DBC", this);
    }
    /**
     * Resolves the desired {@link object } out a given one **toResolveFrom** using the specified **path**.
     *
     * @param toResolveFrom The {@link object } starting to resolve from.
     * @param path			The dotted path-{@link string }.
     * 						This string uses ., [...], and () to represent accessing nested properties,
     * 						array elements/object keys, and calling methods, respectively, mimicking JavaScript syntax to navigate
     * 						an object's structure. Code, e.g. something like a.b( 1 as number ).c, will not be executed and
     * 						thus make the retrieval fail.
     *
     * @returns The requested {@link object }, NULL or UNDEFINED. */
    static resolve(toResolveFrom, path) {
        if (!toResolveFrom || typeof path !== "string") {
            return undefined;
        }
        const cachedParts = DBC.pathTokenCache.get(path);
        const parts = cachedParts !== null && cachedParts !== void 0 ? cachedParts : path.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split(".");
        if (!cachedParts) {
            DBC.pathTokenCache.set(path, parts);
        }
        let current = toResolveFrom;
        for (const part of parts) {
            if (current === null || typeof current === "undefined") {
                return undefined;
            }
            const methodMatch = part.match(/(\w+)\((.*)\)/);
            if (methodMatch) {
                const methodName = methodMatch[1];
                const argsStr = methodMatch[2];
                const args = argsStr.split(",").map((arg) => arg.trim());
                if (typeof current[methodName] === "function") {
                    current = current[methodName].apply(current, args);
                }
                else {
                    return undefined;
                }
            }
            else {
                if (typeof window !== "undefined" && typeof HTMLElement !== "undefined" && current instanceof HTMLElement && part.startsWith("@")) {
                    current = current.getAttribute(part.slice(1));
                }
                else if (typeof current === "object" && current !== null && part in current) {
                    current = current[part];
                }
                else if (typeof window !== "undefined" && typeof HTMLElement !== "undefined" && current instanceof HTMLElement) {
                    current = undefined;
                }
                else {
                    current = undefined;
                }
            }
        }
        return current;
    }
}
// #region Internal caches.
DBC.dbcCache = new Map();
DBC.pathTokenCache = new Map();
// #endregion Internal caches.
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
     * @param hint				See {@link DBC.decPrecondition }.
     * @param dbc				See {@link DBC.decPrecondition }.
     *
     * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** returns one.
     * 			Otherwise TRUE. */
    static PRE(realConditions, index = undefined, idxEnd = undefined, path = undefined, hint = undefined, dbc = undefined) {
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
        }, dbc, path, hint);
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
     * @param hint				See {@link DBC.decPrecondition }.
     * @param dbc				See {@link DBC.decPrecondition }.
     *
     * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** return one.
     * 			Otherwise TRUE. */
    static POST(realConditions, index = undefined, idxEnd = undefined, path = undefined, hint = undefined, dbc = undefined) {
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
        }, dbc, path, hint);
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
     * @param hint				See {@link DBC.decInvariant }.
     * @param dbc				See {@link DBC.decInvariant }.
     *
     * @returns	See {@link DBC.decInvariant }. */
    static INVARIANT(realConditions, index = undefined, idxEnd = undefined, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new AE(realConditions, index, idxEnd)], path, dbc, hint);
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

/***/ "./src/DBC/COMPARISON.ts":
/*!*******************************!*\
  !*** ./src/DBC/COMPARISON.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   COMPARISON: () => (/* binding */ COMPARISON)
/* harmony export */ });
/* harmony import */ var _DBC__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../DBC */ "./src/DBC.ts");

/**
 * A {@link DBC } defining a comparison between two {@link object }s.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
class COMPARISON extends _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC {
    // #region Condition checking.
    /**
     * Does a comparison between the {@link object } **toCheck** and the **equivalent**.
     *
     * @param toCheck		The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
     * @param equivalent	The {@link object } the one **toCheck** has to be equal to in order for this {@link DBC } to be
     * 						fulfilled.
     *
     * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
    static checkAlgorithm(toCheck, equivalent, equalityPermitted, invert) {
        if (equalityPermitted && !invert && toCheck < equivalent) {
            return `Value has to to be greater than or equal to "${equivalent}"`;
        }
        if (equalityPermitted && invert && toCheck > equivalent) {
            return `Value has to be less than or equal to "${equivalent}"`;
        }
        if (!equalityPermitted && !invert && toCheck <= equivalent) {
            return `Value has to to be greater than "${equivalent}"`;
        }
        if (!equalityPermitted && invert && toCheck >= equivalent) {
            return `Value has to be less than "${equivalent}"`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
     * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
     * @param path			    See {@link DBC.decPrecondition }.
     * @param hint				See {@link DBC.decPrecondition }.
     * @param dbc			    See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return COMPARISON.checkAlgorithm(value, equivalent, equalityPermitted, invert);
        }, dbc, path, hint);
    }
    /**
     * A method-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
     * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
     * @param path			    See {@link DBC.Postcondition }.
     * @param hint				See {@link DBC.decPostcondition }.
     * @param dbc			    See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return COMPARISON.checkAlgorithm(value, equalityPermitted, equivalent, invert);
        }, dbc, path, hint);
    }
    /**
     * A field-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
     * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
     * @param path			    See {@link DBC.decInvariant }.
     * @param hint				See {@link DBC.decInvariant }.
     * @param dbc			    See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new COMPARISON(equivalent, equalityPermitted, invert)], dbc, path, hint);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    // #region Dynamic usage.
    /**
     * Invokes the {@link COMPARISON.checkAlgorithm } passing the value **toCheck**, {@link COMPARISON.equivalent } and {@link COMPARISON.invert }.
     *
     * @param toCheck See {@link COMPARISON.checkAlgorithm }.
     *
     * @returns See {@link COMPARISON.checkAlgorithm}. */
    check(toCheck) {
        return COMPARISON.checkAlgorithm(toCheck, this.equivalent, this.equalityPermitted, this.invert);
    }
    /**
     * Creates this {@link COMPARISON } by setting the protected property {@link COMPARISON.equivalent }, {@link COMPARISON.equalityPermitted } and {@link COMPARISON.invert } used by {@link COMPARISON.check }.
     *
     * @param equivalent        See {@link COMPARISON.check }.
     * @param equalityPermitted See {@link COMPARISON.check }.
     * @param invert            See {@link COMPARISON.check }. */
    constructor(equivalent, equalityPermitted = false, invert = false) {
        super();
        this.equivalent = equivalent;
        this.equalityPermitted = equalityPermitted;
        this.invert = invert;
    }
}


/***/ }),

/***/ "./src/DBC/COMPARISON/GREATER.ts":
/*!***************************************!*\
  !*** ./src/DBC/COMPARISON/GREATER.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GREATER: () => (/* binding */ GREATER)
/* harmony export */ });
/* harmony import */ var _COMPARISON__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../COMPARISON */ "./src/DBC/COMPARISON.ts");

/** See {@link COMPARISON }. */
class GREATER extends _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.PRE(equivalent, false, false, path, hint, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.POST(equivalent, false, false, path, hint, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.INVARIANT(equivalent, false, false, path, hint, dbc);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, false, false);
        this.equivalent = equivalent;
    }
}


/***/ }),

/***/ "./src/DBC/COMPARISON/GREATER_OR_EQUAL.ts":
/*!************************************************!*\
  !*** ./src/DBC/COMPARISON/GREATER_OR_EQUAL.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GREATER_OR_EQUAL: () => (/* binding */ GREATER_OR_EQUAL)
/* harmony export */ });
/* harmony import */ var _COMPARISON__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../COMPARISON */ "./src/DBC/COMPARISON.ts");

/** See {@link COMPARISON }. */
class GREATER_OR_EQUAL extends _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.PRE(equivalent, true, false, path, dbc, hint);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.POST(equivalent, true, false, path, dbc, hint);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.INVARIANT(equivalent, true, false, path, dbc, hint);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, true, false);
        this.equivalent = equivalent;
    }
}


/***/ }),

/***/ "./src/DBC/COMPARISON/LESS.ts":
/*!************************************!*\
  !*** ./src/DBC/COMPARISON/LESS.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LESS: () => (/* binding */ LESS)
/* harmony export */ });
/* harmony import */ var _COMPARISON__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../COMPARISON */ "./src/DBC/COMPARISON.ts");

/** See {@link COMPARISON }. */
class LESS extends _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.PRE(equivalent, false, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.POST(equivalent, false, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.INVARIANT(equivalent, false, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, false, true);
        this.equivalent = equivalent;
    }
}


/***/ }),

/***/ "./src/DBC/COMPARISON/LESS_OR_EQUAL.ts":
/*!*********************************************!*\
  !*** ./src/DBC/COMPARISON/LESS_OR_EQUAL.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LESS_OR_EQUAL: () => (/* binding */ LESS_OR_EQUAL)
/* harmony export */ });
/* harmony import */ var _COMPARISON__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../COMPARISON */ "./src/DBC/COMPARISON.ts");

/** See {@link COMPARISON }. */
class LESS_OR_EQUAL extends _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.PRE(equivalent, true, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.POST(equivalent, true, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.INVARIANT(equivalent, true, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, true, true);
        this.equivalent = equivalent;
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
    equivalent, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return EQ.checkAlgorithm(value, equivalent, invert);
        }, dbc, path, hint);
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
    equivalent, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return EQ.checkAlgorithm(value, equivalent, invert);
        }, dbc, path, hint);
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
    equivalent, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new EQ(equivalent, invert)], path, dbc, hint);
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
     * Invokes the {@link EQ.checkAlgorithm } passing the value **toCheck** and the specified **type** .
     *
     * @param toCheck See {@link EQ.checkAlgorithm }.
     *
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link EQ }.
     *
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link EQ }.*/
    static tsCheck(toCheck, equivalent, hint = undefined, id = undefined) {
        const result = EQ.checkAlgorithm(toCheck, equivalent, false);
        if (result) {
            return toCheck;
        }
        else {
            throw new _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.Infringement(`${id ? `(${id}) ` : ""}${result} ${hint ? `✨ ${hint} ✨` : ""}`);
        }
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

/***/ "./src/DBC/EQ/DIFFERENT.ts":
/*!*********************************!*\
  !*** ./src/DBC/EQ/DIFFERENT.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DIFFERENT: () => (/* binding */ DIFFERENT)
/* harmony export */ });
/* harmony import */ var _EQ__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../EQ */ "./src/DBC/EQ.ts");

/**
 * DIFFERENT class for inequality comparisons.
 *
 * This class extends EQ and provides methods to check if a value is different (not equal)
 * from a specified equivalent value. It inverts the equality check by always passing
 * `true` for the invert parameter to the parent EQ class methods.
 *
 * @remarks
 * The class provides precondition (PRE), postcondition (POST), and invariant (INVARIANT)
 * checks for Design by Contract programming patterns.
 *
 * @see {@link COMPARISON}
 * @see {@link EQ}
 */
class DIFFERENT extends _EQ__WEBPACK_IMPORTED_MODULE_0__.EQ {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _EQ__WEBPACK_IMPORTED_MODULE_0__.EQ.PRE(equivalent, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _EQ__WEBPACK_IMPORTED_MODULE_0__.EQ.POST(equivalent, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, invert = false, path = undefined, hint = undefined, dbc = undefined) {
        return _EQ__WEBPACK_IMPORTED_MODULE_0__.EQ.INVARIANT(equivalent, true, path, dbc, hint);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, true);
        this.equivalent = equivalent;
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
     * Checks if the value **toCheck** is an instance of the specified **reference**.
     *
     * @param toCheck	The value that has to be an instance of the **reference** in order for this {@link DBC }
     * 					to be fulfilled.
     * @param reference	The {@link object } the one **toCheck** has to be an instance of.
     *
     * @returns TRUE if the value **toCheck** is is an instance of the *reference**, **undefined** or **null**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    static checkAlgorithm(toCheck, ...references) {
        if (toCheck === null || toCheck === undefined) {
            return true;
        }
        for (const ref of references) {
            if (toCheck instanceof ref) {
                return true;
            }
        }
        return `Value has to be an instance of "${references.map(ref => ref.name || ref).join(', ')}" but is of type "${typeof toCheck}"`;
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
    reference, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return Array.isArray(reference) ? INSTANCE.checkAlgorithm(value, ...reference) : INSTANCE.checkAlgorithm(value, reference);
        }, dbc, path, hint);
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
    reference, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return Array.isArray(reference) ? INSTANCE.checkAlgorithm(value, ...reference) : INSTANCE.checkAlgorithm(value, reference);
        }, dbc, path, hint);
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
    reference, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new INSTANCE(reference)], path, dbc, hint);
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
        return Array.isArray(this.reference) ? INSTANCE.checkAlgorithm(toCheck, ...this.reference) : INSTANCE.checkAlgorithm(toCheck, this.reference);
    }
    /**
     * Type-safe check that validates if a value is an instance of a specified reference.
     *
     * @param toCheck 	The value to check for instance validity.
     * @param reference	The {@link object } the one **toCheck** has to be an instance of.
     * @param hint		An optional {@link string } providing extra information in case of an infringement.
     * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
     *
     * @returns The **CANDIDATE** **toCheck** if it fulfills this {@link INSTANCE }.
     *
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link INSTANCE }. */
    static tsCheck(toCheck, reference, hint = undefined, id = undefined) {
        return INSTANCE.tsCheckMulti(toCheck, [reference], hint, id);
    }
    /**
     * Invokes the {@link INSTANCE.checkAlgorithm } passing the value **toCheck** and the {@link INSTANCE.reference } .
     *
     * @param toCheck 	See {@link INSTANCE.checkAlgorithm }.
     * @param reference	See {@link INSTANCE.checkAlgorithm }.
     * @param hint		An optional {@link string } providing extra information in case of an infringement.
     * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
     *
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link INSTANCE }.
     *
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
    static tsCheckMulti(toCheck, references, hint = undefined, id = undefined) {
        const result = INSTANCE.checkAlgorithm(toCheck, ...references);
        if (result === true) {
            return toCheck;
        }
        else {
            throw new _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.Infringement(`${id ? `(${id}) ` : ""}${result} ${hint ? `✨ ${hint} ✨` : ""}`);
        }
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
        if (toCheck === undefined || toCheck === null)
            return true;
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
    static PRE(expression, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return REGEX.checkAlgorithm(value, expression);
        }, dbc, path, hint);
    }
    /**
     * A method-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param expression	See {@link REGEX.checkAlgorithm }.
     * @param path			See {@link DBC.Postcondition }.
     * @param dbc			See {@link DBC.decPostcondition }.
     * @param hint			See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(expression, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return REGEX.checkAlgorithm(value, expression);
        }, dbc, path, hint);
    }
    /**
     * A field-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param expression	See {@link REGEX.checkAlgorithm }.
     * @param path			See {@link DBC.decInvariant }.
     * @param dbc			See {@link DBC.decInvariant }.
     * @param hint			See {@link DBC.decInvariant }.
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(expression, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new REGEX(expression)], path, dbc, hint);
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
     * Type-safe check that validates a value against a regular expression and returns it as the specified type.
     *
     * @param toCheck		The value to check against the regular expression.
     * @param expression	The regular expression to validate against.
     * @param hint			Optional hint message to include in the error if validation fails.
     * @param id			Optional identifier to include in the error message.
     *
     * @returns The validated value cast to the CANDIDATE type.
     *
     * @throws {@link DBC.Infringement} if the value does not match the regular expression. */
    static tsCheck(toCheck, expression, hint = undefined, id = undefined) {
        const result = REGEX.checkAlgorithm(toCheck, expression);
        if (result) {
            return toCheck;
        }
        else {
            throw new _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.Infringement(`${id ? `(${id}) ` : ""}${result}${hint ? ` ✨ ${hint} ✨` : ""}`);
        }
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
    boolean: /^(TRUE|FALSE)$/i,
    colorCodeHEX: /^#([A-Fa-f\d]{3,4}|[A-Fa-f\d]{6}|[A-Fa-f\d]{8})$/i,
    simpleHotkey: /^((Alt|Ctrl|Shift|Meta)\+)+[a-z\d]$/i,
    bcp47: /^(?:[a-z]{2,3}(?:-[a-z]{3}){0,3}|[a-z]{4}|[a-z]{5,8})(?:-[a-z]{4})?(?:-[a-z]{2}|-[0-9]{3})?(?:-[a-z0-9]{5,8}|-[0-9][a-z0-9]{3})*(?:-[0-9a-wy-z](?:-[a-z0-9]{2,8})+)*(?:-x(?:-[a-z0-9]{1,8})+)?$|^x(?:-[a-z0-9]{1,8})+$/i
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
     * @param type		The type the {@link object} **toCheck** has to be of. Can be a single type or multiple types separated by "|".
     *
     * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
    static checkAlgorithm(toCheck, type) {
        if (toCheck === undefined || toCheck === null)
            return true;
        const types = type.split("|").map(t => t.trim());
        const actualType = typeof toCheck;
        // #region Check if the actual type matches at least one of the specified types
        // biome-ignore lint/suspicious/useValidTypeof: Necessary
        const isValid = types.some(t => actualType === t);
        if (!isValid) {
            if (types.length === 1) {
                return `Value has to to be of type "${type}" but is of type "${actualType}"`;
            }
            return `Value has to to be of type "${types.join(" | ")}" but is of type "${actualType}"`;
        }
        // #endregion Check if the actual type matches at least one of the specified types
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param type	See {@link TYPE.checkAlgorithm }.
     * @param path	A ::-separated list of dotted paths to check. Each path points to a property within the parameter value.
     * 				Undefined properties are skipped. See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(type, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return TYPE.checkAlgorithm(value, type);
        }, dbc, path, hint);
    }
    /**
     * A method-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param type	See {@link TYPE.checkAlgorithm }.
     * @param path	A ::-separated list of dotted paths to check. Each path points to a property within the parameter value.
     * 				Undefined properties are skipped. See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(type, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return TYPE.checkAlgorithm(value, type);
        }, dbc, path, hint);
    }
    /**
     * A field-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param type	See {@link TYPE.checkAlgorithm }.
     * @param path	A ::-separated list of dotted paths to check. Each path points to a property within the parameter value.
     * 				Undefined properties are skipped. See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(type, path = undefined, hint = undefined, dbc = undefined) {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new TYPE(type)], path, dbc, hint);
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
     * Invokes the {@link TYPE.checkAlgorithm } passing the value **toCheck** and the {@link TYPE.type } .
     *
     * @param toCheck	See {@link TYPE.checkAlgorithm }.
     * @param type		See {@link TYPE.checkAlgorithm }.
     * @param hint		An optional {@link string } providing extra information in case of an infringement.
     * @param id		A {@link string } identifying this {@link TYPE } via the {@link DBC.Infringement }-Message.
     *
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link TYPE }.
     *
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
    static tsCheck(toCheck, type, hint = undefined, id = undefined) {
        const result = TYPE.checkAlgorithm(toCheck, type);
        if (result === true) {
            return toCheck;
        }
        else {
            throw new _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.Infringement(`${id ? `(${id}) ` : ""}${result}${hint ? ` ✨ ${hint} ✨` : ""}`);
        }
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
/* harmony import */ var _DBC_COMPARISON_GREATER__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./DBC/COMPARISON/GREATER */ "./src/DBC/COMPARISON/GREATER.ts");
/* harmony import */ var _DBC_COMPARISON_GREATER_OR_EQUAL__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./DBC/COMPARISON/GREATER_OR_EQUAL */ "./src/DBC/COMPARISON/GREATER_OR_EQUAL.ts");
/* harmony import */ var _DBC_COMPARISON_LESS__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./DBC/COMPARISON/LESS */ "./src/DBC/COMPARISON/LESS.ts");
/* harmony import */ var _DBC_COMPARISON_LESS_OR_EQUAL__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./DBC/COMPARISON/LESS_OR_EQUAL */ "./src/DBC/COMPARISON/LESS_OR_EQUAL.ts");
/* harmony import */ var _DBC_EQ_DIFFERENT__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./DBC/EQ/DIFFERENT */ "./src/DBC/EQ/DIFFERENT.ts");
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
        // #endregion Check Static Method with ParamvalueProvider
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
    testGREATER_OR_EQUAL(input) { }
    testLESS(input) { }
    testLESS_OR_EQUAL(input) { }
    testDIFFERENT(input) { }
    // #endregion Check Comparison
    // #region Check Static Method with ParamvalueProvider
    static testStaticMethod(message, count) {
        return `${message} repeated ${count} times`;
    }
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
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_COMPARISON_GREATER__WEBPACK_IMPORTED_MODULE_6__.GREATER.PRE(2)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testGREATER", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_COMPARISON_GREATER_OR_EQUAL__WEBPACK_IMPORTED_MODULE_7__.GREATER_OR_EQUAL.PRE(2)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testGREATER_OR_EQUAL", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_COMPARISON_LESS__WEBPACK_IMPORTED_MODULE_8__.LESS.PRE(20)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testLESS", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_COMPARISON_LESS_OR_EQUAL__WEBPACK_IMPORTED_MODULE_9__.LESS_OR_EQUAL.PRE(20)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testLESS_OR_EQUAL", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_EQ_DIFFERENT__WEBPACK_IMPORTED_MODULE_10__.DIFFERENT.PRE(20)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], Demo.prototype, "testDIFFERENT", null);
__decorate([
    _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.ParamvalueProvider,
    __param(0, _DBC_TYPE__WEBPACK_IMPORTED_MODULE_3__.TYPE.PRE("string")),
    __param(1, _DBC_TYPE__WEBPACK_IMPORTED_MODULE_3__.TYPE.PRE("number")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", String)
], Demo, "testStaticMethod", null);
const demo = new Demo();
try {
    demo.testProperty = "abd";
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("INVARIANT Infringement", "OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testProperty = "a";
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("INVARIANT OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
demo.testParamvalueAndReturnvalue("holla");
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("PARAMETER- & RETURNVALUE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testParamvalueAndReturnvalue("yyyy");
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("PARAMETER- & RETURNVALUE Infringement", "OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testReturnvalue("xxxx");
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("RETURNVALUE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testReturnvalue("yyyy");
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("RETURNVALUE Infringement", "OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testEQAndPath(document.createElement("select"));
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("EQ with Path Infringement OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testEQAndPathWithInversion(document.createElement("select"));
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("EQ with Path and Inversion Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testTYPE("x");
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("TYPE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testTYPE(0);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("TYPE Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testAE(["11", "10", "b"]);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("AE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testAE(["11", 11, "b"]);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("AE Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testREGEXWithAE(["+1d", "NOW", "-10y"]);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("REGEX with AE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testREGEXWithAE(["+1d", "+5d", "-x10y"]);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("REGEX with AE Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testINSTANCE(new Date());
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("INSTANCE OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testINSTANCE(demo);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("INSTANCE Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testAERange([11, "abc", "abc"]);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("AE Range OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testAERange([11, "abc", /a/g]);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("AE Range Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testAEIndex([11, "abc", "abc"]);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("AE Index OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testAEIndex(["11", 12, "/a/g"]);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("AE Index Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testGREATER(11);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("GREATER OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testGREATER(2);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("GREATER Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testGREATER_OR_EQUAL(2);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("GREATER_OR_EQUAL OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testGREATER_OR_EQUAL(1);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("GREATER_OR_EQUAL Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testLESS(10);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("LESS OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testLESS(20);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("LESS Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testLESS_OR_EQUAL(20);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("LESS OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testLESS_OR_EQUAL(21);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("LESS_OR_EQUAL Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
demo.testDIFFERENT(21);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("DIFFERENT OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    demo.testDIFFERENT(20);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("DIFFERENT Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
// #region Inactivity Checks
window.WaXCode.DBC.executionSettings.checkPreconditions = false;
try {
    demo.testLESS_OR_EQUAL(21);
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("INACTIVE PRECONDITIONS OK");
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("INACTIVE PRECONDITIONS FAILED");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
window.WaXCode.DBC.executionSettings.checkPostconditions = false;
try {
    demo.testReturnvalue("qqqqq");
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("INACTIVE POSTCONDITIONS OK");
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("INACTIVE POSTCONDITIONS FAILED");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
window.WaXCode.DBC.executionSettings.checkInvariants = false;
try {
    demo.testProperty = "b";
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("INACTIVE INVARIANTS OK");
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("INACTIVE INVARIANTS FAILED");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
// #endregion Inactivity Checks
// Re-enable all checks for subsequent tests
window.WaXCode.DBC.executionSettings.checkPreconditions = true;
window.WaXCode.DBC.executionSettings.checkPostconditions = true;
window.WaXCode.DBC.executionSettings.checkInvariants = true;
// #region Static Method Test
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("TESTING STATIC METHOD WITH PARAMVALUEPROVIDER");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
Demo.testStaticMethod("Hello", 3);
console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
console.log("STATIC METHOD OK");
console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
try {
    Demo.testStaticMethod("Hello", "not a number");
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("STATIC METHOD Infringement OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
try {
    Demo.testStaticMethod(123, 5);
}
catch (X) {
    console.log("⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄⌄");
    console.log("STATIC METHOD Infringement (first param) OK");
    console.log(X);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
}
// #endregion Static Method Test

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFlLHNEQUFJO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLHFDQUFHO0FBQ1AsZUFBZSx3RUFBYTtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxxQ0FBRztBQUNQLGVBQWUseURBQVM7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUkscUNBQUc7QUFDUCxlQUFlLDJDQUFJO0FBQ25CLGVBQWUsMkNBQUk7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3hkYmMvLi9zcmMvREJDLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0FFLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0NPTVBBUklTT04udHMiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0NPTVBBUklTT04vR1JFQVRFUl9PUl9FUVVBTC50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9DT01QQVJJU09OL0xFU1MudHMiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EQkMvQ09NUEFSSVNPTi9MRVNTX09SX0VRVUFMLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0VRLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0VRL0RJRkZFUkVOVC50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9JTlNUQU5DRS50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9SRUdFWC50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9UWVBFLnRzIiwid2VicGFjazovL3hkYmMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8veGRiYy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8veGRiYy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3hkYmMvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RlbW8udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQcm92aWRlcyBhICoqRCoqZXNpZ24gKipCKip5ICoqQyoqb250cmFjdCBGcmFtZXdvcmsgdXNpbmcgZGVjb3JhdG9ycy5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xuZXhwb3J0IGNsYXNzIERCQyB7XG4gICAgc3RhdGljIGdldEhvc3QoKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogZ2xvYmFsVGhpcztcbiAgICB9XG4gICAgc3RhdGljIGdldERCQyhkYmMpIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGRiYyAhPT0gbnVsbCAmJiBkYmMgIT09IHZvaWQgMCA/IGRiYyA6IFwiV2FYQ29kZS5EQkNcIjtcbiAgICAgICAgaWYgKERCQy5kYmNDYWNoZS5oYXMocGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBEQkMuZGJjQ2FjaGUuZ2V0KHBhdGgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc29sdmVkID0gREJDLnJlc29sdmVEQkNQYXRoKERCQy5nZXRIb3N0KCksIHBhdGgpO1xuICAgICAgICBpZiAocmVzb2x2ZWQpIHtcbiAgICAgICAgICAgIERCQy5kYmNDYWNoZS5zZXQocGF0aCwgcmVzb2x2ZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSB1bmlxdWUga2V5IGZvciBzdG9yaW5nIHBhcmFtZXRlciB2YWx1ZSByZXF1ZXN0cy5cbiAgICAgKiBGb3JtYXQ6IFwiQ2xhc3NOYW1lOm1ldGhvZE5hbWVcIlxuICAgICAqL1xuICAgIHN0YXRpYyBnZXRSZXF1ZXN0S2V5KHRhcmdldCwgbWV0aG9kTmFtZSkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbicgPyB0YXJnZXQubmFtZSA6ICgoX2EgPSB0YXJnZXQuY29uc3RydWN0b3IpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5uYW1lKSB8fCAnVW5rbm93bic7XG4gICAgICAgIHJldHVybiBgJHtjbGFzc05hbWV9OiR7U3RyaW5nKG1ldGhvZE5hbWUpfWA7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2UgYSByZXF1ZXN0IHRvIGdldCB0aGUgdmFsdWUgb2YgYSBjZXJ0YWluIHBhcmFtZXRlciBvZiBzcGVjaWZpYyBtZXRob2QgaW4gYSBzcGVjaWZpYyB7QGxpbmsgb2JqZWN0IH0uXG4gICAgICogVGhhdCByZXF1ZXN0IGdldHMgZW5saXN0ZWQgaW4ge0BsaW5rIHBhcmFtVmFsdWVSZXF1ZXN0cyB9IHdoaWNoIGlzIHVzZWQgYnkge0BsaW5rIFBhcmFtdmFsdWVQcm92aWRlcn0gdG8gaW52b2tlIHRoZVxuICAgICAqIGdpdmVuIFwicmVjZXB0b3JcIiB3aXRoIHRoZSBwYXJhbWV0ZXIgdmFsdWUgc3RvcmVkIGluIHRoZXJlLiBUaHVzIGEgcGFyYW1ldGVyIGRlY29yYXRvciB1c2luZyB0aGlzIG1ldGhvZCB3aWxsXG4gICAgICogbm90IHJlY2VpdmUgYW55IHZhbHVlIG9mIHRoZSB0b3AgbWV0aG9kIGlzIG5vdCB0YWdnZWQgd2l0aCB7QGxpbmsgUGFyYW12YWx1ZVByb3ZpZGVyfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YXJnZXRcdFx0VGhlIHtAbGluayBvYmplY3QgfSBjb250YWluaW5nIHRoZSBtZXRob2Qgd2l0aCB0aGUgcGFyYW1ldGVyIHdoaWNoJ3MgdmFsdWUgaXMgcmVxdWVzdGVkLlxuICAgICAqIEBwYXJhbSBtZXRob2ROYW1lXHRUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHdpdGggdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0XHRUaGUgaW5kZXggb2YgdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cbiAgICAgKiBAcGFyYW0gcmVjZXB0b3JcdFx0VGhlIG1ldGhvZCB0aGUgcmVxdWVzdGVkIHBhcmFtZXRlci12YWx1ZSBzaGFsbCBiZSBwYXNzZWQgdG8gd2hlbiBpdCBiZWNvbWVzIGF2YWlsYWJsZS4gKi9cbiAgICBzdGF0aWMgcmVxdWVzdFBhcmFtVmFsdWUodGFyZ2V0LCBtZXRob2ROYW1lLCBpbmRleCwgXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBHb3R0YSBiZSBhbnkgc2luY2UgcGFyYW1ldGVyLXZhbHVlcyBtYXkgYmUgdW5kZWZpbmVkLlxuICAgIHJlY2VwdG9yKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IERCQy5nZXRSZXF1ZXN0S2V5KHRhcmdldCwgbWV0aG9kTmFtZSk7XG4gICAgICAgIGlmIChEQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICBpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5oYXMoaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5nZXQoaW5kZXgpLnB1c2gocmVjZXB0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5zZXQoaW5kZXgsIG5ldyBBcnJheShyZWNlcHRvcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5zZXQoa2V5LCBuZXcgTWFwKFtcbiAgICAgICAgICAgICAgICBbaW5kZXgsIG5ldyBBcnJheShyZWNlcHRvcildLFxuICAgICAgICAgICAgXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IGNoZWNraW5nIHRoZSB7QGxpbmsgcGFyYW1WYWx1ZVJlcXVlc3RzIH0gZm9yIHZhbHVlLXJlcXVlc3RzIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgdGh1c1xuICAgICAqIGFsc28gdXNhYmxlIG9uIHNldHRlcnMuXG4gICAgICogV2hlbiBmb3VuZCBpdCB3aWxsIGludm9rZSB0aGUgXCJyZWNlcHRvclwiIHJlZ2lzdGVyZWQgdGhlcmUsIGludGVyIGFsaWEgYnkge0BsaW5rIHJlcXVlc3RQYXJhbVZhbHVlIH0sIHdpdGggdGhlXG4gICAgICogcGFyYW1ldGVyJ3MgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IFx0XHRUaGUge0BsaW5rIG9iamVjdCB9IGhvc3RpbmcgdGhlIHRhZ2dlZCBtZXRob2QgYXMgcHJvdmlkZWQgYnkgdGhlIHJ1bnRpbWUuXG4gICAgICogQHBhcmFtIHByb3BlcnR5S2V5IFx0VGhlIHRhZ2dlZCBtZXRob2QncyBuYW1lIGFzIHByb3ZpZGVkIGJ5IHRoZSBydW50aW1lLlxuICAgICAqIEBwYXJhbSBkZXNjcmlwdG9yIFx0VGhlIHtAbGluayBQcm9wZXJ0eURlc2NyaXB0b3IgfSBhcyBwcm92aWRlZCBieSB0aGUgcnVudGltZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRoZSB7QGxpbmsgUHJvcGVydHlEZXNjcmlwdG9yIH0gdGhhdCB3YXMgcGFzc2VkIGJ5IHRoZSBydW50aW1lLiAqL1xuICAgIHN0YXRpYyBQYXJhbXZhbHVlUHJvdmlkZXIodGFyZ2V0LCBwcm9wZXJ0eUtleSwgZGVzY3JpcHRvcikge1xuICAgICAgICBjb25zdCBvcmlnaW5hbE1ldGhvZCA9IGRlc2NyaXB0b3IudmFsdWU7XG4gICAgICAgIGNvbnN0IGlzU3RhdGljID0gdHlwZW9mIHRhcmdldCA9PT0gJ2Z1bmN0aW9uJztcbiAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBHb3R0YSBiZSBhbnkgc2luY2UgcGFyYW1ldGVyLXZhbHVlcyBtYXkgYmUgdW5kZWZpbmVkLlxuICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIC8vICNyZWdpb24gICBDaGVjayBpZiBhIHZhbHVlIG9mIG9uZSBvZiB0aGUgbWV0aG9kJ3MgcGFyYW1ldGVyIGhhcyBiZWVuIHJlcXVlc3RlZCBhbmQgcGFzcyBpdCB0byB0aGVcbiAgICAgICAgICAgIC8vICAgICAgICAgICByZWNlcHRvciwgaWYgc28uXG4gICAgICAgICAgICBjb25zdCBhY3R1YWxUYXJnZXQgPSBpc1N0YXRpYyA/IHRoaXMgOiB0aGlzLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gREJDLmdldFJlcXVlc3RLZXkoYWN0dWFsVGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICBpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaW5kZXggb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcmVjZXB0b3Igb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5nZXQoaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjZXB0b3IoYXJnc1tpbmRleF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gcGFyYW1ldGVyIHZhbHVlIHJlcXVlc3RzIGZvdW5kIGZvciBrZXk6XCIsIGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyAjZW5kcmVnaW9uXHRDaGVjayBpZiBhIHZhbHVlIG9mIG9uZSBvZiB0aGUgbWV0aG9kJ3MgcGFyYW1ldGVyIGhhcyBiZWVuIHJlcXVlc3RlZCBhbmQgcGFzcyBpdCB0byB0aGVcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgICByZWNlcHRvciwgaWYgc28uXG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxNZXRob2QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkZXNjcmlwdG9yO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIFBhcmFtZXRlci12YWx1ZSByZXF1ZXN0cy5cbiAgICAvLyAjcmVnaW9uIENsYXNzXG4gICAgLyoqXG4gICAgICogQSBwcm9wZXJ0eS1kZWNvcmF0b3IgZmFjdG9yeSBzZXJ2aW5nIGFzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEludmFyaWFudC5cbiAgICAgKiBUaGlzIGludmFyaWFudCBhaW1zIHRvIGNoZWNrIHRoZSBpbnN0YW5jZSBvZiB0aGUgY2xhc3Mgbm90IHRoZSB2YWx1ZSB0byBiZSBnZXQgb3Igc2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRyYWN0cyBUaGUge0BsaW5rIERCQyB9LUNvbnRyYWN0cyB0aGUgdmFsdWUgc2hhbGwgdXBob2xkLlxuICAgICAqXG4gICAgICogQHRocm93cyBcdEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSB3aGVuZXZlciB0aGUgcHJvcGVydHkgaXMgdHJpZWQgdG8gYmUgZ2V0IG9yIHNldCB3aXRob3V0IHRoZSBpbnN0YW5jZSBvZiBpdCdzIGNsYXNzXG4gICAgICogXHRcdFx0ZnVsZmlsbGluZyB0aGUgc3BlY2lmaWVkICoqY29udHJhY3RzKiouICovXG4gICAgc3RhdGljIGRlY0NsYXNzSW52YXJpYW50KGNvbnRyYWN0cywgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiAodGFyZ2V0LCBwcm9wZXJ0eUtleSwgZGVzY3JpcHRvcikgPT4ge1xuICAgICAgICAgICAgaWYgKCFEQkMuZ2V0REJDKGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxTZXR0ZXIgPSBkZXNjcmlwdG9yLnNldDtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsR2V0dGVyID0gZGVzY3JpcHRvci5nZXQ7XG4gICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxuICAgICAgICAgICAgbGV0IHZhbHVlO1xuICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZXBsYWNlIG9yaWdpbmFsIHByb3BlcnR5LlxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcGVydHlLZXksIHtcbiAgICAgICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghREJDLmdldERCQyhkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZSh0aGlzLCBwYXRoKSA6IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERCQy5nZXREQkMoZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChyZXN1bHQsIHRhcmdldCwgcGF0aCwgcHJvcGVydHlLZXksIHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxHZXR0ZXJbcHJvcGVydHlLZXldO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0KG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghREJDLmdldERCQyhkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZSh0aGlzLCBwYXRoKSA6IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERCQy5nZXREQkMoZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChyZXN1bHQsIHRhcmdldCwgcGF0aCwgcHJvcGVydHlLZXksIHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDbGFzc1xuICAgIC8vICNyZWdpb24gSW52YXJpYW50XG4gICAgLyoqXG4gICAgICogQSBwcm9wZXJ0eS1kZWNvcmF0b3IgZmFjdG9yeSBzZXJ2aW5nIGFzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEludmFyaWFudC5cbiAgICAgKiBTaW5jZSB0aGUgdmFsdWUgbXVzdCBiZSBpbml0aWFsaXplZCBvciBzZXQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQgKipjb250cmFjdHMqKiB0aGUgdmFsdWUgd2lsbCBvbmx5IGJlIGNoZWNrZWRcbiAgICAgKiB3aGVuIGFzc2lnbmluZyBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb250cmFjdHMgVGhlIHtAbGluayBEQkMgfS1Db250cmFjdHMgdGhlIHZhbHVlIHNoYWxsIHVwaG9sZC5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgXHRBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gd2hlbmV2ZXIgdGhlIHByb3BlcnR5IGlzIHRyaWVkIHRvIGJlIHNldCB0byBhIHZhbHVlIHRoYXQgZG9lcyBub3QgY29tcGx5IHRvIHRoZVxuICAgICAqIFx0XHRcdHNwZWNpZmllZCAqKmNvbnRyYWN0cyoqLCBieSB0aGUgcmV0dXJuZWQgbWV0aG9kLiovXG4gICAgc3RhdGljIGRlY0ludmFyaWFudChjb250cmFjdHMsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gKHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIGlmICghREJDLmdldERCQyhkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGludGVyY2VwdCBVTkRFRklORUQgYW5kIE5VTEwuXG4gICAgICAgICAgICBsZXQgdmFsdWU7XG4gICAgICAgICAgICAvLyAjcmVnaW9uIFJlcGxhY2Ugb3JpZ2luYWwgcHJvcGVydHkuXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eUtleSwge1xuICAgICAgICAgICAgICAgIHNldChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIURCQy5nZXREQkMoZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWFsVmFsdWUgPSBwYXRoID8gREJDLnJlc29sdmUobmV3VmFsdWUsIHBhdGgpIDogbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERCQy5nZXREQkMoZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChyZXN1bHQsIHRhcmdldCwgcGF0aCwgcHJvcGVydHlLZXksIHJlYWxWYWx1ZSwgaGludCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBJbnZhcmlhbnRcbiAgICAvLyAjcmVnaW9uIFBvc3Rjb25kaXRpb25cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZCBkZWNvcmF0b3IgZmFjdG9yeSBjaGVja2luZyB0aGUgcmVzdWx0IG9mIGEgbWV0aG9kIHdoZW5ldmVyIGl0IGlzIGludm9rZWQgdGh1cyBhbHNvIHVzYWJsZSBvbiBnZXR0ZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoZWNrXHRUaGUgKioodG9DaGVjazogYW55LCBvYmplY3QsIHN0cmluZykgPT4gYm9vbGVhbiB8IHN0cmluZyoqIHRvIHVzZSBmb3IgY2hlY2tpbmcuXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMucmVzb2x2ZURCQ1BhdGggfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0VGhlIGRvdHRlZCBwYXRoIHJlZmVycmluZyB0byB0aGUgYWN0dWFsIHZhbHVlIHRvIGNoZWNrLCBzdGFydGluZyBmb3JtIHRoZSBzcGVjaWZpZWQgb25lLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlICoqKCB0YXJnZXQgOiBvYmplY3QsIHByb3BlcnR5S2V5IDogc3RyaW5nLCBkZXNjcmlwdG9yIDogUHJvcGVydHlEZXNjcmlwdG9yICkgOiBQcm9wZXJ0eURlc2NyaXB0b3IqKlxuICAgICAqIFx0XHRcdGludm9rZWQgYnkgVHlwZXNjcmlwdC5cbiAgICAgKi9cbiAgICBzdGF0aWMgZGVjUG9zdGNvbmRpdGlvbihcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxuICAgIGNoZWNrLCBkYmMgPSB1bmRlZmluZWQsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuICh0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbE1ldGhvZCA9IGRlc2NyaXB0b3IudmFsdWU7XG4gICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxuICAgICAgICAgICAgZGVzY3JpcHRvci52YWx1ZSA9ICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFEQkMuZ2V0REJDKGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tQb3N0Y29uZGl0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9UaGlzSW5TdGF0aWM6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWFsVmFsdWUgPSBwYXRoID8gREJDLnJlc29sdmUocmVzdWx0LCBwYXRoKSA6IHJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVja1Jlc3VsdCA9IGNoZWNrKHJlYWxWYWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICBEQkMuZ2V0REJDKGRiYykucmVwb3J0UmV0dXJudmFsdWVJbmZyaW5nZW1lbnQoY2hlY2tSZXN1bHQsIHRhcmdldCwgcGF0aCwgcHJvcGVydHlLZXksIHJlYWxWYWx1ZSwgaGludCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3I7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUG9zdGNvbmRpdGlvblxuICAgIC8vICNyZWdpb24gRGVjb3JhdG9yXG4gICAgLy8gI3JlZ2lvbiBQcmVjb25kaXRpb25cbiAgICAvKipcbiAgICAgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB0aGF0IHJlcXVlc3RzIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgcGFzc2luZyBpdCB0byB0aGUgcHJvdmlkZWRcbiAgICAgKiBcImNoZWNrXCItbWV0aG9kIHdoZW4gdGhlIHZhbHVlIGJlY29tZXMgYXZhaWxhYmxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoZWNrXHRUaGUgXCIoIHVua25vd24gKSA9PiB2b2lkXCIgdG8gYmUgaW52b2tlZCBhbG9uZyB3aXRoIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgYXMgc29vblxuICAgICAqIFx0XHRcdFx0YXMgaXQgYmVjb21lcyBhdmFpbGFibGUuXG4gICAgICogQHBhcmFtIGRiYyAgXHRTZWUge0BsaW5rIERCQy5yZXNvbHZlREJDUGF0aCB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRUaGUgZG90dGVkIHBhdGggcmVmZXJyaW5nIHRvIHRoZSBhY3R1YWwgdmFsdWUgdG8gY2hlY2ssIHN0YXJ0aW5nIGZvcm0gdGhlIHNwZWNpZmllZCBvbmUuXG4gICAgICogXHRcdFx0XHRNYXkgY29udGFpbiA6OiB0byBzZXBhcmF0ZSBtdWx0aXBsZSBwYXRocy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRoZSAqKih0YXJnZXQ6IG9iamVjdCwgbWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLCBwYXJhbWV0ZXJJbmRleDogbnVtYmVyICkgPT4gdm9pZCoqIGludm9rZWQgYnkgVHlwZXNjcmlwdC0gKi9cbiAgICBzdGF0aWMgZGVjUHJlY29uZGl0aW9uKGNoZWNrLCBkYmMgPSB1bmRlZmluZWQsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgcGF0aHMgPSBwYXRoID8gcGF0aC5yZXBsYWNlKC8gL2csIFwiXCIpLnNwbGl0KFwiOjpcIikgOiBbdW5kZWZpbmVkXTtcbiAgICAgICAgcmV0dXJuICh0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICBEQkMucmVxdWVzdFBhcmFtVmFsdWUodGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFEQkMuZ2V0REJDKGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tQcmVjb25kaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBzaW5nbGVQYXRoIG9mIHBhdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlYWxWYWx1ZSA9IHNpbmdsZVBhdGggPyBEQkMucmVzb2x2ZSh2YWx1ZSwgc2luZ2xlUGF0aCkgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY2hlY2socmVhbFZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIERCQy5nZXREQkMoZGJjKS5yZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQocmVzdWx0LCB0YXJnZXQsIHNpbmdsZVBhdGgsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4LCByZWFsVmFsdWUsIGhpbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlcG9ydHMgYSB3YXJuaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgVGhlIG1lc3NhZ2UgY29udGFpbmluZyB0aGUgd2FybmluZy4gKi9cbiAgICByZXBvcnRXYXJuaW5nKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKHRoaXMud2FybmluZ1NldHRpbmdzLmxvZ1RvQ29uc29sZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlcG9ydHMgYW4gaW5mcmluZ2VtZW50IGFjY29yZGluZyB0byB0aGUge0BsaW5rIGluZnJpbmdlbWVudFNldHRpbmdzIH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXG4gICAgICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIiAmIHZpb2xhdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxuICAgICAqIEBwYXJhbSB2aW9sYXRvciBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLiAqL1xuICAgIHJlcG9ydEluZnJpbmdlbWVudChtZXNzYWdlLCB2aW9sYXRvciwgdGFyZ2V0LCB2YWx1ZSwgcGF0aCwgaGludCA9IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBmaW5hbE1lc3NhZ2UgPSBgWyBGcm9tIFwiJHt2aW9sYXRvcn1cIiR7dHlwZW9mIHRhcmdldCA9PT0gXCJmdW5jdGlvblwiID8gYCBpbiBcIiR7dGFyZ2V0Lm5hbWV9XCJgIDogdHlwZW9mIHRhcmdldCA9PT0gXCJvYmplY3RcIiAmJiB0YXJnZXQgIT09IG51bGwgJiYgdHlwZW9mIHRhcmdldC5jb25zdHJ1Y3RvciA9PT0gXCJmdW5jdGlvblwiID8gYCBpbiBcIiR7dGFyZ2V0LmNvbnN0cnVjdG9yLm5hbWV9XCJgIDogYGluIFwiJHt0YXJnZXR9XCJgfSR7cGF0aCA/IGAgPiBcIiR7cGF0aH1cImAgOiBcIlwifTogJHttZXNzYWdlfSAke2hpbnQgPyBg4pyoICR7aGludH0g4pyoYCA6IFwiXCJ9XWA7XG4gICAgICAgIGlmICh0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzLnRocm93RXhjZXB0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudChmaW5hbE1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzLmxvZ1RvQ29uc29sZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZmluYWxNZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXBvcnRzIGEgcGFyYW1ldGVyLWluZnJpbmdlbWVudCB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxuICAgICAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIsXCJtZXRob2RcIiwgcGFyYW1ldGVyLVwiaW5kZXhcIiAmIHZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxuICAgICAqIEBwYXJhbSBtZXRob2QgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0VGhlIGluZGV4IG9mIHRoZSBwYXJhbWV0ZXIgd2l0aGluIHRoZSBhcmd1bWVudCBsaXN0aW5nLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBcdFRoZSBwYXJhbWV0ZXIncyB2YWx1ZS4gKi9cbiAgICByZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQobWVzc2FnZSwgdGFyZ2V0LCBwYXRoLCBtZXRob2QsIGluZGV4LCB2YWx1ZSwgaGludCA9IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBwcm9wZXJJbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgdGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoYFsgUGFyYW1ldGVyLXZhbHVlIFwiJHt2YWx1ZX1cIiBvZiB0aGUgJHtwcm9wZXJJbmRleH0ke3Byb3BlckluZGV4ID09PSAxID8gXCJzdFwiIDogcHJvcGVySW5kZXggPT09IDIgPyBcIm5kXCIgOiBwcm9wZXJJbmRleCA9PT0gMyA/IFwicmRcIiA6IFwidGhcIn0gcGFyYW1ldGVyIGRpZCBub3QgZnVsZmlsbCBvbmUgb2YgaXQncyBjb250cmFjdHM6ICR7bWVzc2FnZX0gXWAsIG1ldGhvZCwgdGFyZ2V0LCB2YWx1ZSwgcGF0aCwgaGludCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlcG9ydHMgYSBmaWVsZC1pbmZyaW5nZW1lbnQgdmlhIHtAbGluayByZXBvcnRJbmZyaW5nZW1lbnQgfSBhbHNvIGdlbmVyYXRpbmcgYSBwcm9wZXIge0BsaW5rIHN0cmluZyB9LXdyYXBwZXJcbiAgICAgKiBmb3IgdGhlIGdpdmVuICoqbWVzc2FnZSoqICYgKipuYW1lKiouXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZVx0QSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxuICAgICAqIEBwYXJhbSBrZXkgXHRcdFRoZSBwcm9wZXJ0eSBrZXkuXG4gICAgICogQHBhcmFtIHBhdGhcdFx0VGhlIGRvdHRlZC1wYXRoIHtAbGluayBzdHJpbmcgfSB0aGF0IGxlYWRzIHRvIHRoZSB2YWx1ZSBub3QgZnVsZmlsbGluZyB0aGUgY29udHJhY3Qgc3RhcnRpbmcgZnJvbVxuICAgICAqIFx0XHRcdFx0XHR0aGUgdGFnZ2VkIG9uZS5cbiAgICAgKiBAcGFyYW0gdmFsdWVcdFx0VGhlIHZhbHVlIG5vdCBmdWxmaWxsaW5nIGEgY29udHJhY3QuICovXG4gICAgcmVwb3J0RmllbGRJbmZyaW5nZW1lbnQobWVzc2FnZSwgdGFyZ2V0LCBwYXRoLCBrZXksIHZhbHVlLCBoaW50ID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucmVwb3J0SW5mcmluZ2VtZW50KGBbIE5ldyB2YWx1ZSBmb3IgXCIke2tleX1cIiR7cGF0aCA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IGAuJHtwYXRofWB9IHdpdGggdmFsdWUgXCIke3ZhbHVlfVwiIGRpZCBub3QgZnVsZmlsbCBvbmUgb2YgaXQncyBjb250cmFjdHM6ICR7bWVzc2FnZX0gXWAsIGtleSwgdGFyZ2V0LCB2YWx1ZSwgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlcG9ydHMgYSByZXR1cm52YWx1ZS1pbmZyaW5nZW1lbnQgYWNjb3JkaW5nIHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXG4gICAgICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIixcIm1ldGhvZFwiICYgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZVx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXG4gICAgICogQHBhcmFtIG1ldGhvZCBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLlxuICAgICAqIEBwYXJhbSB2YWx1ZVx0XHRUaGUgcGFyYW1ldGVyJ3MgdmFsdWUuICovXG4gICAgcmVwb3J0UmV0dXJudmFsdWVJbmZyaW5nZW1lbnQobWVzc2FnZSwgdGFyZ2V0LCBwYXRoLCBtZXRob2QsIFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIHZhbHVlLCBoaW50ID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucmVwb3J0SW5mcmluZ2VtZW50KGBbIFJldHVybi12YWx1ZSBcIiR7dmFsdWV9XCIgZGlkIG5vdCBmdWxmaWxsIG9uZSBvZiBpdCdzIGNvbnRyYWN0czogJHttZXNzYWdlfSBdYCwgbWV0aG9kLCB0YXJnZXQsIHZhbHVlLCBwYXRoLCBoaW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyB0aGlzIHtAbGluayBEQkMgfSBieSBzZXR0aW5nIHRoZSB7QGxpbmsgREJDLmluZnJpbmdlbWVudFNldHRpbmdzIH0sIGRlZmluZSB0aGUgKipXYVhDb2RlKiogbmFtZXNwYWNlIGluXG4gICAgICogKip3aW5kb3cqKiBpZiBub3QgeWV0IGF2YWlsYWJsZSBhbmQgc2V0dGluZyB0aGUgcHJvcGVydHkgKipEQkMqKiBpbiB0aGVyZSB0byB0aGUgaW5zdGFuY2Ugb2YgdGhpcyB7QGxpbmsgREJDIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5mcmluZ2VtZW50U2V0dGluZ3MgXHRTZWUge0BsaW5rIERCQy5pbmZyaW5nZW1lbnRTZXR0aW5ncyB9LlxuICAgICAqIEBwYXJhbSBleGVjdXRpb25TZXR0aW5nc1x0XHRTZWUge0BsaW5rIERCQy5leGVjdXRpb25TZXR0aW5ncyB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGluZnJpbmdlbWVudFNldHRpbmdzID0geyB0aHJvd0V4Y2VwdGlvbjogdHJ1ZSwgbG9nVG9Db25zb2xlOiBmYWxzZSB9LCBleGVjdXRpb25TZXR0aW5ncyA9IHtcbiAgICAgICAgY2hlY2tQcmVjb25kaXRpb25zOiB0cnVlLFxuICAgICAgICBjaGVja1Bvc3Rjb25kaXRpb25zOiB0cnVlLFxuICAgICAgICBjaGVja0ludmFyaWFudHM6IHRydWUsXG4gICAgfSkge1xuICAgICAgICAvLyAjZW5kcmVnaW9uIFByZWNvbmRpdGlvblxuICAgICAgICAvLyAjZW5kcmVnaW9uIERlY29yYXRvclxuICAgICAgICAvLyAjcmVnaW9uIEV4ZWN1dGlvbiBIYW5kbGluZ1xuICAgICAgICAvKiogU3RvcmVzIHNldHRpbmdzIGNvbmNlcm5pbmcgdGhlIGV4ZWN1dGlvbiBvZiBjaGVja3MuICovXG4gICAgICAgIHRoaXMuZXhlY3V0aW9uU2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBjaGVja1ByZWNvbmRpdGlvbnM6IHRydWUsXG4gICAgICAgICAgICBjaGVja1Bvc3Rjb25kaXRpb25zOiB0cnVlLFxuICAgICAgICAgICAgY2hlY2tJbnZhcmlhbnRzOiB0cnVlLFxuICAgICAgICB9O1xuICAgICAgICAvLyAjZW5kcmVnaW9uIEV4ZWN1dGlvbiBIYW5kbGluZ1xuICAgICAgICAvLyAjcmVnaW9uIFdhcm5pbmcgaGFuZGxpbmcuXG4gICAgICAgIC8qKiBTdG9yZXMgc2V0dGluZ3MgY29uY2VybmluZyB3YXJuaW5ncy4gKi9cbiAgICAgICAgdGhpcy53YXJuaW5nU2V0dGluZ3MgPSB7IGxvZ1RvQ29uc29sZTogdHJ1ZSB9O1xuICAgICAgICAvLyAjZW5kcmVnaW9uIFdhcm5pbmcgaGFuZGxpbmcuXG4gICAgICAgIC8vICNyZWdpb24gaW5mcmluZ2VtZW50IGhhbmRsaW5nLlxuICAgICAgICAvKiogU3RvcmVzIHRoZSBzZXR0aW5ncyBjb25jZXJuaW5nIGluZnJpbmdlbWVudHMgKi9cbiAgICAgICAgdGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncyA9IHsgdGhyb3dFeGNlcHRpb246IHRydWUsIGxvZ1RvQ29uc29sZTogZmFsc2UgfTtcbiAgICAgICAgdGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncyA9IGluZnJpbmdlbWVudFNldHRpbmdzO1xuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgaWYgKERCQy5nZXRIb3N0KCkuV2FYQ29kZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgREJDLmdldEhvc3QoKS5XYVhDb2RlID0ge307XG4gICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICBEQkMuZ2V0SG9zdCgpLldhWENvZGUuREJDID0gdGhpcztcbiAgICAgICAgREJDLmRiY0NhY2hlLnNldChcIldhWENvZGUuREJDXCIsIHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXNvbHZlcyB0aGUgZGVzaXJlZCB7QGxpbmsgb2JqZWN0IH0gb3V0IGEgZ2l2ZW4gb25lICoqdG9SZXNvbHZlRnJvbSoqIHVzaW5nIHRoZSBzcGVjaWZpZWQgKipwYXRoKiouXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9SZXNvbHZlRnJvbSBUaGUge0BsaW5rIG9iamVjdCB9IHN0YXJ0aW5nIHRvIHJlc29sdmUgZnJvbS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFRoZSBkb3R0ZWQgcGF0aC17QGxpbmsgc3RyaW5nIH0uXG4gICAgICogXHRcdFx0XHRcdFx0VGhpcyBzdHJpbmcgdXNlcyAuLCBbLi4uXSwgYW5kICgpIHRvIHJlcHJlc2VudCBhY2Nlc3NpbmcgbmVzdGVkIHByb3BlcnRpZXMsXG4gICAgICogXHRcdFx0XHRcdFx0YXJyYXkgZWxlbWVudHMvb2JqZWN0IGtleXMsIGFuZCBjYWxsaW5nIG1ldGhvZHMsIHJlc3BlY3RpdmVseSwgbWltaWNraW5nIEphdmFTY3JpcHQgc3ludGF4IHRvIG5hdmlnYXRlXG4gICAgICogXHRcdFx0XHRcdFx0YW4gb2JqZWN0J3Mgc3RydWN0dXJlLiBDb2RlLCBlLmcuIHNvbWV0aGluZyBsaWtlIGEuYiggMSBhcyBudW1iZXIgKS5jLCB3aWxsIG5vdCBiZSBleGVjdXRlZCBhbmRcbiAgICAgKiBcdFx0XHRcdFx0XHR0aHVzIG1ha2UgdGhlIHJldHJpZXZhbCBmYWlsLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlIHJlcXVlc3RlZCB7QGxpbmsgb2JqZWN0IH0sIE5VTEwgb3IgVU5ERUZJTkVELiAqL1xuICAgIHN0YXRpYyByZXNvbHZlKHRvUmVzb2x2ZUZyb20sIHBhdGgpIHtcbiAgICAgICAgaWYgKCF0b1Jlc29sdmVGcm9tIHx8IHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNhY2hlZFBhcnRzID0gREJDLnBhdGhUb2tlbkNhY2hlLmdldChwYXRoKTtcbiAgICAgICAgY29uc3QgcGFydHMgPSBjYWNoZWRQYXJ0cyAhPT0gbnVsbCAmJiBjYWNoZWRQYXJ0cyAhPT0gdm9pZCAwID8gY2FjaGVkUGFydHMgOiBwYXRoLnJlcGxhY2UoL1xcWyhbJ1wiXT8pKC4qPylcXDFcXF0vZywgXCIuJDJcIikuc3BsaXQoXCIuXCIpO1xuICAgICAgICBpZiAoIWNhY2hlZFBhcnRzKSB7XG4gICAgICAgICAgICBEQkMucGF0aFRva2VuQ2FjaGUuc2V0KHBhdGgsIHBhcnRzKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY3VycmVudCA9IHRvUmVzb2x2ZUZyb207XG4gICAgICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnQgPT09IG51bGwgfHwgdHlwZW9mIGN1cnJlbnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWV0aG9kTWF0Y2ggPSBwYXJ0Lm1hdGNoKC8oXFx3KylcXCgoLiopXFwpLyk7XG4gICAgICAgICAgICBpZiAobWV0aG9kTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRob2ROYW1lID0gbWV0aG9kTWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgY29uc3QgYXJnc1N0ciA9IG1ldGhvZE1hdGNoWzJdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBhcmdzU3RyLnNwbGl0KFwiLFwiKS5tYXAoKGFyZykgPT4gYXJnLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50W21ldGhvZE5hbWVdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbbWV0aG9kTmFtZV0uYXBwbHkoY3VycmVudCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBIVE1MRWxlbWVudCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjdXJyZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgcGFydC5zdGFydHNXaXRoKFwiQFwiKSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5nZXRBdHRyaWJ1dGUocGFydC5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBjdXJyZW50ID09PSBcIm9iamVjdFwiICYmIGN1cnJlbnQgIT09IG51bGwgJiYgcGFydCBpbiBjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhcnRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBIVE1MRWxlbWVudCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjdXJyZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyZW50O1xuICAgIH1cbn1cbi8vICNyZWdpb24gSW50ZXJuYWwgY2FjaGVzLlxuREJDLmRiY0NhY2hlID0gbmV3IE1hcCgpO1xuREJDLnBhdGhUb2tlbkNhY2hlID0gbmV3IE1hcCgpO1xuLy8gI2VuZHJlZ2lvbiBJbnRlcm5hbCBjYWNoZXMuXG4vLyAjcmVnaW9uIFBhcmFtZXRlci12YWx1ZSByZXF1ZXN0cy5cbi8qKiBTdG9yZXMgYWxsIHJlcXVlc3QgZm9yIHBhcmFtZXRlciB2YWx1ZXMgcmVnaXN0ZXJlZCBieSB7QGxpbmsgZGVjUHJlY29uZGl0aW9uIH0uICovXG5EQkMucGFyYW1WYWx1ZVJlcXVlc3RzID0gbmV3IE1hcCgpO1xuLy8gI3JlZ2lvbiBDbGFzc2VzXG4vLyAjcmVnaW9uIEVycm9yc1xuLyoqIEFuIHtAbGluayBFcnJvciB9IHRvIGJlIHRocm93biB3aGVuZXZlciBhbiBpbmZyaW5nZW1lbnQgaXMgZGV0ZWN0ZWQuICovXG5EQkMuSW5mcmluZ2VtZW50ID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyB0aGlzIHtAbGluayBFcnJvciB9IGJ5IHRhZ2dpbmcgdGhlIHNwZWNpZmllZCBtZXNzYWdlLXtAbGluayBzdHJpbmcgfSBhcyBhbiBYREJDLUluZnJpbmdlbWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50LiAqL1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UpIHtcbiAgICAgICAgc3VwZXIoYFsgWERCQyBJbmZyaW5nZW1lbnQgJHttZXNzYWdlfV1gKTtcbiAgICB9XG59O1xuLy8gI2VuZHJlZ2lvbiBFcnJvcnNcbi8vICNlbmRyZWdpb24gQ2xhc3Nlc1xuLy8gI2VuZHJlZ2lvbiBpbmZyaW5nZW1lbnQgaGFuZGxpbmcuXG4vKipcbiAqIFJlc29sdmVzIHRoZSBzcGVjaWZpZWQgZG90dGVkIHtAbGluayBzdHJpbmcgfS1wYXRoIHRvIGEge0BsaW5rIERCQyB9LlxuICpcbiAqIEBwYXJhbSBvYmogXHRUaGUge0BsaW5rIG9iamVjdCB9IHRvIHN0YXJ0IHJlc29sdmluZyBmcm9tLlxuICogQHBhcmFtIHBhdGggXHRUaGUgZG90dGVkIHtAbGluayBzdHJpbmcgfS1wYXRoIGxlYWRpbmcgdG8gdGhlIHtAbGluayBEQkMgfS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgcmVxdWVzdGVkIHtAbGluayBEQkMgfS5cbiAqL1xuREJDLnJlc29sdmVEQkNQYXRoID0gKG9iaiwgcGF0aCkgPT4gcGF0aCA9PT0gbnVsbCB8fCBwYXRoID09PSB2b2lkIDAgPyB2b2lkIDAgOiBwYXRoLnNwbGl0KFwiLlwiKS5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBjdXJyZW50KSA9PiBhY2N1bXVsYXRvcltjdXJyZW50XSwgb2JqKTtcbi8vIFNldCB0aGUgbWFpbiBpbnN0YW5jZSB3aXRoIHN0YW5kYXJkICoqREJDLmluZnJpbmdlbWVudFNldHRpbmdzKiouXG5uZXcgREJDKCk7XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgYWxsIGVsZW1lbnRzIG9mIGFuIHtAbGluayBvYmplY3QgfXMgaGF2ZSB0byBmdWxmaWxsXG4gKiBhIGdpdmVuIHtAbGluayBvYmplY3QgfSdzIGNoZWNrLW1ldGhvZCAoKiooIHRvQ2hlY2sgOiBhbnkgKSA9PiBib29sZWFuIHwgc3RyaW5nKiopLlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgQUUgZXh0ZW5kcyBEQkMge1xuICAgIC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8qKlxuICAgICAqIENoZWNrcyBlYWNoIGVsZW1lbnQgb2YgdGhlICoqdmFsdWUqKi17QGxpbmsgQXJyYXkgPCBhbnkgPn0gYWdhaW5zdCB0aGUgZ2l2ZW4gKipjb25kaXRpb24qKiwgaWYgaXQgaXMgb25lLiBJZiBpdCBpcyBub3RcbiAgICAgKiB0aGUgKip2YWx1ZSoqIGl0c2VsZiB3aWxsIGJlIGNoZWNrZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29uZGl0aW9uXHRUaGUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSAqKnZhbHVlKiogYWdhaW5zdC5cbiAgICAgKiBAcGFyYW0gdmFsdWVcdFx0RWl0aGVyICoqdmFsdWUqKi17QGxpbmsgQXJyYXkgPCBhbnkgPn0sIHdoaWNoJ3MgZWxlbWVudHMgd2lsbCBiZSBjaGVja2VkLCBvciB0aGUgdmFsdWUgdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0Y2hlY2tlZCBpdHNlbGYuXG4gICAgICogQHBhcmFtIGluZGV4XHRcdElmIHNwZWNpZmllZCB3aXRoICoqaWR4RW5kKiogYmVpbmcgdW5kZWZpbmVkLCB0aGlzIHtAbGluayBOdW1iZXIgfSB3aWxsIGJlIHNlZW4gYXMgdGhlIGluZGV4IG9mXG4gICAgICogXHRcdFx0XHRcdHRoZSB2YWx1ZS17QGxpbmsgQXJyYXkgfSdzIGVsZW1lbnQgdG8gY2hlY2suIElmIHZhbHVlIGlzbid0IGFuIHtAbGluayBBcnJheSB9IHRoaXMgcGFyYW1ldGVyXG4gICAgICogXHRcdFx0XHRcdHdpbGwgbm90IGhhdmUgYW55IGVmZmVjdC5cbiAgICAgKiBcdFx0XHRcdFx0V2l0aCAqKmlkeEVuZCoqIG5vdCB1bmRlZmluZWQgdGhpcyBwYXJhbWV0ZXIgaW5kaWNhdGVzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNwYW4gb2YgZWxlbWVudHMgdG9cbiAgICAgKiBcdFx0XHRcdFx0Y2hlY2sgd2l0aGluIHRoZSB2YWx1ZS17QGxpbmsgQXJyYXkgfS5cbiAgICAgKiBAcGFyYW0gaWR4RW5kXHRJbmRpY2F0ZXMgdGhlIGxhc3QgZWxlbWVudCdzIGluZGV4IChpbmNsdWRpbmcpIG9mIHRoZSBzcGFuIG9mIHZhbHVlLXtAbGluayBBcnJheSB9IGVsZW1lbnRzIHRvIGNoZWNrLlxuICAgICAqIFx0XHRcdFx0XHRTZXR0aW5nIHRoaXMgcGFyYW1ldGVyIHRvIC0xIHNwZWNpZmllcyB0aGF0IGFsbCB2YWx1ZS17QGxpbmsgQXJyYXkgfSdzIGVsZW1lbnRzIGJlZ2lubmluZyBmcm9tIHRoZVxuICAgICAqIFx0XHRcdFx0XHRzcGVjaWZpZWQgKippbmRleCoqIHNoYWxsIGJlIGNoZWNrZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBBcyBzb29uIGFzIHRoZSAqKmNvbmRpdGlvbioqIHJldHVybnMgYSB7QGxpbmsgc3RyaW5nIH0sIGluc3RlYWQgb2YgVFJVRSwgdGhlIHJldHVybmVkIHN0cmluZy4gVFJVRSBpZiB0aGVcbiAgICAgKiBcdFx0XHQqKmNvbmRpdGlvbioqIG5ldmVyIHJldHVybnMgYSB7QGxpbmsgc3RyaW5nfS4gKi9cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0oY29uZGl0aW9uLCB2YWx1ZSwgaW5kZXgsIGlkeEVuZCkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkICYmIGlkeEVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEgJiYgaW5kZXggPCB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29uZGl0aW9uLmNoZWNrKHZhbHVlW2luZGV4XSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYFZpb2xhdGluZy1BcnJheWVsZW1lbnQgYXQgaW5kZXggXCIke2luZGV4fVwiIHdpdGggdmFsdWUgXCIke3ZhbHVlW2luZGV4XX1cIi4gJHtyZXN1bHR9YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gSW4gb3JkZXIgZm9yIG9wdGlvbmFsIHBhcmFtZXRlciB0byBub3QgY2F1c2UgYW4gZXJyb3IgaWYgdGhleSBhcmUgb21pdHRlZC5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGVuZGluZyA9IGlkeEVuZCAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgPyBpZHhFbmQgIT09IC0xXG4gICAgICAgICAgICAgICAgICAgID8gaWR4RW5kICsgMVxuICAgICAgICAgICAgICAgICAgICA6IHZhbHVlLmxlbmd0aFxuICAgICAgICAgICAgICAgIDogdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGluZGV4ID8gaW5kZXggOiAwOyBpIDwgZW5kaW5nOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb25kaXRpb24uY2hlY2sodmFsdWVbaV0pO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBWaW9sYXRpbmctQXJyYXllbGVtZW50IGF0IGluZGV4ICR7aX0uICR7cmVzdWx0fWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmRpdGlvbi5jaGVjayh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcbiAgICAgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlIGFnYWluc3Qgd2l0aC5cbiAgICAgKiBXaGVuIHNwZWNpZnlpbmcgYW4gKippbmRleCoqIGFuZCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzICoqdmFsdWUqKiBpcyBhbiB7QGxpbmsgQXJyYXkgfSwgdGhlICoqcmVhbENvbmRpdGlvbnMqKiBhcHBseSB0byB0aGVcbiAgICAgKiBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgKippbmRleCoqLlxuICAgICAqIElmIHRoZSB7QGxpbmsgQXJyYXkgfSBpcyB0b28gc2hvcnQgdGhlIGN1cnJlbnRseSBwcm9jZXNzZWQgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IG9mXG4gICAgICogKipyZWFsQ29uZGl0aW9ucyoqIHdpbGwgYmUgdmVyaWZpZWQgdG8gVFJVRSBhdXRvbWF0aWNhbGx5LCBjb25zaWRlcmluZyBvcHRpb25hbCBwYXJhbWV0ZXJzLlxuICAgICAqIElmIGFuICoqaW5kZXgqKiBpcyBzcGVjaWZpZWQgYnV0IHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgaXNuJ3QgYW4gYXJyYXksIHRoZSAqKmluZGV4KiogaXMgdHJlYXRlZCBhcyBiZWluZyB1bmRlZmluZWQuXG4gICAgICogSWYgKippbmRleCoqIGlzIHVuZGVmaW5lZCBhbmQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBpcyBhbiB7QGxpbmsgQXJyYXkgfSBlYWNoIGVsZW1lbnQgb2YgaXQgd2lsbCBiZSBjaGVja2VkXG4gICAgICogYWdhaW5zdCB0aGUgKipyZWFsQ29uZGl0aW9ucyoqLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXG4gICAgICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXG4gICAgICogQHBhcmFtIGluZGV4XHRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBpZHhFbmRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gaGludFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuc1x0QSB7QGxpbmsgc3RyaW5nIH0gYXMgc29vbiBhcyBvbmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IG9mICoqcmVhbENvbmRpdGlvbnMqKiByZXR1cm5zIG9uZS5cbiAgICAgKiBcdFx0XHRPdGhlcndpc2UgVFJVRS4gKi9cbiAgICBzdGF0aWMgUFJFKHJlYWxDb25kaXRpb25zLCBpbmRleCA9IHVuZGVmaW5lZCwgaWR4RW5kID0gdW5kZWZpbmVkLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZWFsQ29uZGl0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGN1cnJlbnRDb25kaXRpb24gb2YgcmVhbENvbmRpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gQUUuY2hlY2tBbGdvcml0aG0oY3VycmVudENvbmRpdGlvbiwgdmFsdWUsIGluZGV4LCBpZHhFbmQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJib29sZWFuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBBRS5jaGVja0FsZ29yaXRobShyZWFsQ29uZGl0aW9ucywgdmFsdWUsIGluZGV4LCBpZHhFbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIGRiYywgcGF0aCwgaGludCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcbiAgICAgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJuLXZhbHVlIGFnYWluc3Qgd2l0aC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFsQ29uZGl0aW9uc1x0RWl0aGVyIG9uZSBvciBtb3JlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxuICAgICAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxuICAgICAqIEBwYXJhbSBpbmRleFx0XHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gaWR4RW5kXHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGhpbnRcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZiAqKnJlYWxDb25kaXRpb25zKiogcmV0dXJuIG9uZS5cbiAgICAgKiBcdFx0XHRPdGhlcndpc2UgVFJVRS4gKi9cbiAgICBzdGF0aWMgUE9TVChyZWFsQ29uZGl0aW9ucywgaW5kZXggPSB1bmRlZmluZWQsIGlkeEVuZCA9IHVuZGVmaW5lZCwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlYWxDb25kaXRpb25zKSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY3VycmVudENvbmRpdGlvbiBvZiByZWFsQ29uZGl0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBBRS5jaGVja0FsZ29yaXRobShjdXJyZW50Q29uZGl0aW9uLCB2YWx1ZSwgaW5kZXgsIGlkeEVuZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcImJvb2xlYW5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFFLmNoZWNrQWxnb3JpdGhtKFxuICAgICAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgICAgICAgIHJlYWxDb25kaXRpb25zLCB2YWx1ZSwgaW5kZXgsIGlkeEVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgZGJjLCBwYXRoLCBoaW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXG4gICAgICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIGZpZWxkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXG4gICAgICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXG4gICAgICogQHBhcmFtIGluZGV4XHRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBpZHhFbmRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcGFyYW0gaGludFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuc1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChyZWFsQ29uZGl0aW9ucywgaW5kZXggPSB1bmRlZmluZWQsIGlkeEVuZCA9IHVuZGVmaW5lZCwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgQUUocmVhbENvbmRpdGlvbnMsIGluZGV4LCBpZHhFbmQpXSwgcGF0aCwgZGJjLCBoaW50KTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvL1xuICAgIC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSBnbG9iYWwgZnVuY3Rpb25zKS5cbiAgICAvL1xuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9IHdpdGggYWxsIHtAbGluayBBRS5jb25kaXRpb25zIH0gYW5kIHRoZSB7QGxpbmsgb2JqZWN0IH0ge0BsaW5rIHRvQ2hlY2sgfSxcbiAgICAgKiB7QGxpbmsgQUUuaW5kZXggfSAmIHtAbGluayBBRS5pZHhFbmQgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGhpcy5jb25kaXRpb25zKSkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBjdXJyZW50Q29uZGl0aW9uIG9mIHRoaXMuY29uZGl0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEFFLmNoZWNrQWxnb3JpdGhtKGN1cnJlbnRDb25kaXRpb24sIHRvQ2hlY2ssIHRoaXMuaW5kZXgsIHRoaXMuaWR4RW5kKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJib29sZWFuXCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gQUUuY2hlY2tBbGdvcml0aG0oXG4gICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgICAgIHRoaXMuY29uZGl0aW9ucywgdG9DaGVjaywgdGhpcy5pbmRleCwgdGhpcy5pZHhFbmQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoaXMge0BsaW5rIEFFIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBBRS5jb25kaXRpb25zIH0sIHtAbGluayBBRS5pbmRleCB9IGFuZCB7QGxpbmsgQUUuaWR4RW5kIH0gdXNlZCBieSB7QGxpbmsgQUUuY2hlY2sgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50IFNlZSB7QGxpbmsgRVEuY2hlY2sgfS4gKi9cbiAgICBjb25zdHJ1Y3Rvcihjb25kaXRpb25zLCBpbmRleCA9IHVuZGVmaW5lZCwgaWR4RW5kID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY29uZGl0aW9ucyA9IGNvbmRpdGlvbnM7XG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpcy5pZHhFbmQgPSBpZHhFbmQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyBhIGNvbXBhcmlzb24gYmV0d2VlbiB0d28ge0BsaW5rIG9iamVjdCB9cy5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xuZXhwb3J0IGNsYXNzIENPTVBBUklTT04gZXh0ZW5kcyBEQkMge1xuICAgIC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8qKlxuICAgICAqIERvZXMgYSBjb21wYXJpc29uIGJldHdlZW4gdGhlIHtAbGluayBvYmplY3QgfSAqKnRvQ2hlY2sqKiBhbmQgdGhlICoqZXF1aXZhbGVudCoqLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRoYXQgaGFzIHRvIGJlIGVxdWFsIHRvIGl0J3MgcG9zc2libGUgKiplcXVpdmFsZW50KiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudFx0VGhlIHtAbGluayBvYmplY3QgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyB0byBiZSBlcXVhbCB0byBpbiBvcmRlciBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0XHRmdWxmaWxsZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlICoqZXF1aXZhbGVudCoqIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyLCBvdGhlcndpc2UgRkFMU0UuICovXG4gICAgc3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkLCBpbnZlcnQpIHtcbiAgICAgICAgaWYgKGVxdWFsaXR5UGVybWl0dGVkICYmICFpbnZlcnQgJiYgdG9DaGVjayA8IGVxdWl2YWxlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVxdWFsaXR5UGVybWl0dGVkICYmIGludmVydCAmJiB0b0NoZWNrID4gZXF1aXZhbGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gYmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWVxdWFsaXR5UGVybWl0dGVkICYmICFpbnZlcnQgJiYgdG9DaGVjayA8PSBlcXVpdmFsZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBncmVhdGVyIHRoYW4gXCIke2VxdWl2YWxlbnR9XCJgO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZXF1YWxpdHlQZXJtaXR0ZWQgJiYgaW52ZXJ0ICYmIHRvQ2hlY2sgPj0gZXF1aXZhbGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gYmUgbGVzcyB0aGFuIFwiJHtlcXVpdmFsZW50fVwiYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudFx0ICAgIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gaGludFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCwgaW52ZXJ0KTtcbiAgICAgICAgfSwgZGJjLCBwYXRoLCBoaW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gaGludFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0odmFsdWUsIGVxdWFsaXR5UGVybWl0dGVkLCBlcXVpdmFsZW50LCBpbnZlcnQpO1xuICAgICAgICB9LCBkYmMsIHBhdGgsIGhpbnQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudFx0ICAgIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcGFyYW0gaGludFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IENPTVBBUklTT04oZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQsIGludmVydCldLCBkYmMsIHBhdGgsIGhpbnQpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gRHluYW1pYyB1c2FnZS5cbiAgICAvKipcbiAgICAgKiBJbnZva2VzIHRoZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqLCB7QGxpbmsgQ09NUEFSSVNPTi5lcXVpdmFsZW50IH0gYW5kIHtAbGluayBDT01QQVJJU09OLmludmVydCB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy5lcXVpdmFsZW50LCB0aGlzLmVxdWFsaXR5UGVybWl0dGVkLCB0aGlzLmludmVydCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgQ09NUEFSSVNPTiB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgQ09NUEFSSVNPTi5lcXVpdmFsZW50IH0sIHtAbGluayBDT01QQVJJU09OLmVxdWFsaXR5UGVybWl0dGVkIH0gYW5kIHtAbGluayBDT01QQVJJU09OLmludmVydCB9IHVzZWQgYnkge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50ICAgICAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS5cbiAgICAgKiBAcGFyYW0gZXF1YWxpdHlQZXJtaXR0ZWQgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrIH0uXG4gICAgICogQHBhcmFtIGludmVydCAgICAgICAgICAgIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVjayB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZXF1aXZhbGVudCA9IGVxdWl2YWxlbnQ7XG4gICAgICAgIHRoaXMuZXF1YWxpdHlQZXJtaXR0ZWQgPSBlcXVhbGl0eVBlcm1pdHRlZDtcbiAgICAgICAgdGhpcy5pbnZlcnQgPSBpbnZlcnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ09NUEFSSVNPTiB9IGZyb20gXCIuLi9DT01QQVJJU09OXCI7XG4vKiogU2VlIHtAbGluayBDT01QQVJJU09OIH0uICovXG5leHBvcnQgY2xhc3MgR1JFQVRFUiBleHRlbmRzIENPTVBBUklTT04ge1xuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUFJFIH0uICovXG4gICAgc3RhdGljIFBSRShlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLlBSRShlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UsIHBhdGgsIGhpbnQsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUE9TVCB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uUE9TVChlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UsIHBhdGgsIGhpbnQsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uSU5WQVJJQU5UIH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLklOVkFSSUFOVChlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UsIHBhdGgsIGhpbnQsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uY29uc3RydWN0b3IgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihlcXVpdmFsZW50KSB7XG4gICAgICAgIHN1cGVyKGVxdWl2YWxlbnQsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXF1aXZhbGVudCA9IGVxdWl2YWxlbnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ09NUEFSSVNPTiB9IGZyb20gXCIuLi9DT01QQVJJU09OXCI7XG4vKiogU2VlIHtAbGluayBDT01QQVJJU09OIH0uICovXG5leHBvcnQgY2xhc3MgR1JFQVRFUl9PUl9FUVVBTCBleHRlbmRzIENPTVBBUklTT04ge1xuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUFJFIH0uICovXG4gICAgc3RhdGljIFBSRShlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLlBSRShlcXVpdmFsZW50LCB0cnVlLCBmYWxzZSwgcGF0aCwgZGJjLCBoaW50KTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QT1NUIH0uICovXG4gICAgc3RhdGljIFBPU1QoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QT1NUKGVxdWl2YWxlbnQsIHRydWUsIGZhbHNlLCBwYXRoLCBkYmMsIGhpbnQpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLklOVkFSSUFOVCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5JTlZBUklBTlQoZXF1aXZhbGVudCwgdHJ1ZSwgZmFsc2UsIHBhdGgsIGRiYywgaGludCk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uY29uc3RydWN0b3IgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihlcXVpdmFsZW50KSB7XG4gICAgICAgIHN1cGVyKGVxdWl2YWxlbnQsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lcXVpdmFsZW50ID0gZXF1aXZhbGVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDT01QQVJJU09OIH0gZnJvbSBcIi4uL0NPTVBBUklTT05cIjtcbi8qKiBTZWUge0BsaW5rIENPTVBBUklTT04gfS4gKi9cbmV4cG9ydCBjbGFzcyBMRVNTIGV4dGVuZHMgQ09NUEFSSVNPTiB7XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QUkUgfS4gKi9cbiAgICBzdGF0aWMgUFJFKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uUFJFKGVxdWl2YWxlbnQsIGZhbHNlLCB0cnVlLCBwYXRoLCBkYmMsIGhpbnQpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBPU1QgfS4gKi9cbiAgICBzdGF0aWMgUE9TVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLlBPU1QoZXF1aXZhbGVudCwgZmFsc2UsIHRydWUsIHBhdGgsIGRiYywgaGludCk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uSU5WQVJJQU5UIH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLklOVkFSSUFOVChlcXVpdmFsZW50LCBmYWxzZSwgdHJ1ZSwgcGF0aCwgZGJjLCBoaW50KTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jb25zdHJ1Y3RvciB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGVxdWl2YWxlbnQpIHtcbiAgICAgICAgc3VwZXIoZXF1aXZhbGVudCwgZmFsc2UsIHRydWUpO1xuICAgICAgICB0aGlzLmVxdWl2YWxlbnQgPSBlcXVpdmFsZW50O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENPTVBBUklTT04gfSBmcm9tIFwiLi4vQ09NUEFSSVNPTlwiO1xuLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTiB9LiAqL1xuZXhwb3J0IGNsYXNzIExFU1NfT1JfRVFVQUwgZXh0ZW5kcyBDT01QQVJJU09OIHtcbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBSRSB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QUkUoZXF1aXZhbGVudCwgdHJ1ZSwgdHJ1ZSwgcGF0aCwgZGJjLCBoaW50KTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QT1NUIH0uICovXG4gICAgc3RhdGljIFBPU1QoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QT1NUKGVxdWl2YWxlbnQsIHRydWUsIHRydWUsIHBhdGgsIGRiYywgaGludCk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uSU5WQVJJQU5UIH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLklOVkFSSUFOVChlcXVpdmFsZW50LCB0cnVlLCB0cnVlLCBwYXRoLCBkYmMsIGhpbnQpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLmNvbnN0cnVjdG9yIH0uICovXG4gICAgY29uc3RydWN0b3IoZXF1aXZhbGVudCkge1xuICAgICAgICBzdXBlcihlcXVpdmFsZW50LCB0cnVlLCB0cnVlKTtcbiAgICAgICAgdGhpcy5lcXVpdmFsZW50ID0gZXF1aXZhbGVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdHdvIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgZXF1YWwuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBFUSBleHRlbmRzIERCQyB7XG4gICAgLy8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBlcXVhbCB0byB0aGUgc3BlY2lmaWVkICoqZXF1aXZhbGVudCoqLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRoYXQgaGFzIHRvIGJlIGVxdWFsIHRvIGl0J3MgcG9zc2libGUgKiplcXVpdmFsZW50KiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudFx0VGhlIHtAbGluayBvYmplY3QgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyB0byBiZSBlcXVhbCB0byBpbiBvcmRlciBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0XHRmdWxmaWxsZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlICoqZXF1aXZhbGVudCoqIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyLCBvdGhlcndpc2UgRkFMU0UuICovXG4gICAgc3RhdGljIGNoZWNrQWxnb3JpdGhtKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIHRvQ2hlY2ssIGVxdWl2YWxlbnQsIGludmVydCkge1xuICAgICAgICBpZiAoIWludmVydCAmJiBlcXVpdmFsZW50ICE9PSB0b0NoZWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGludmVydCAmJiBlcXVpdmFsZW50ID09PSB0b0NoZWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIG11c3Qgbm90IHRvIGJlIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUoXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBjaGVjayBmb3IgVU5ERUZJTkVEIGFuZCBOVUxMLlxuICAgIGVxdWl2YWxlbnQsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gRVEuY2hlY2tBbGdvcml0aG0odmFsdWUsIGVxdWl2YWxlbnQsIGludmVydCk7XG4gICAgICAgIH0sIGRiYywgcGF0aCwgaGludCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXF1aXZhbGVudCwgaW52ZXJ0KTtcbiAgICAgICAgfSwgZGJjLCBwYXRoLCBoaW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgRVEoZXF1aXZhbGVudCwgaW52ZXJ0KV0sIHBhdGgsIGRiYywgaGludCk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy9cbiAgICAvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxuICAgIC8vXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiosIHtAbGluayBFUS5lcXVpdmFsZW50IH0gYW5kIHtAbGluayBFUS5pbnZlcnQgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGNoZWNrIGFnYWluc3QgTlVMTCAmIFVOREVGSU5FRC5cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmVxdWl2YWxlbnQsIHRoaXMuaW52ZXJ0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSBzcGVjaWZpZWQgKip0eXBlKiogLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lc24ndCBmdWxmaWxsIHRoaXMge0BsaW5rIEVRIH0uXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2VzIG5vdCBmdWxmaWxsIHRoaXMge0BsaW5rIEVRIH0uKi9cbiAgICBzdGF0aWMgdHNDaGVjayh0b0NoZWNrLCBlcXVpdmFsZW50LCBoaW50ID0gdW5kZWZpbmVkLCBpZCA9IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBFUS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCBlcXVpdmFsZW50LCBmYWxzZSk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0b0NoZWNrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoYCR7aWQgPyBgKCR7aWR9KSBgIDogXCJcIn0ke3Jlc3VsdH0gJHtoaW50ID8gYOKcqCAke2hpbnR9IOKcqGAgOiBcIlwifWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgRVEgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIEVRLmVxdWl2YWxlbnQgfSB1c2VkIGJ5IHtAbGluayBFUS5jaGVjayB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnQgU2VlIHtAbGluayBFUS5jaGVjayB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gYmUgYWJsZSB0byBtYXRjaCBVTkRFRklORUQgYW5kIE5VTEwuXG4gICAgZXF1aXZhbGVudCwgaW52ZXJ0ID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5lcXVpdmFsZW50ID0gZXF1aXZhbGVudDtcbiAgICAgICAgdGhpcy5pbnZlcnQgPSBpbnZlcnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgRVEgfSBmcm9tIFwiLi4vRVFcIjtcbi8qKlxuICogRElGRkVSRU5UIGNsYXNzIGZvciBpbmVxdWFsaXR5IGNvbXBhcmlzb25zLlxuICpcbiAqIFRoaXMgY2xhc3MgZXh0ZW5kcyBFUSBhbmQgcHJvdmlkZXMgbWV0aG9kcyB0byBjaGVjayBpZiBhIHZhbHVlIGlzIGRpZmZlcmVudCAobm90IGVxdWFsKVxuICogZnJvbSBhIHNwZWNpZmllZCBlcXVpdmFsZW50IHZhbHVlLiBJdCBpbnZlcnRzIHRoZSBlcXVhbGl0eSBjaGVjayBieSBhbHdheXMgcGFzc2luZ1xuICogYHRydWVgIGZvciB0aGUgaW52ZXJ0IHBhcmFtZXRlciB0byB0aGUgcGFyZW50IEVRIGNsYXNzIG1ldGhvZHMuXG4gKlxuICogQHJlbWFya3NcbiAqIFRoZSBjbGFzcyBwcm92aWRlcyBwcmVjb25kaXRpb24gKFBSRSksIHBvc3Rjb25kaXRpb24gKFBPU1QpLCBhbmQgaW52YXJpYW50IChJTlZBUklBTlQpXG4gKiBjaGVja3MgZm9yIERlc2lnbiBieSBDb250cmFjdCBwcm9ncmFtbWluZyBwYXR0ZXJucy5cbiAqXG4gKiBAc2VlIHtAbGluayBDT01QQVJJU09OfVxuICogQHNlZSB7QGxpbmsgRVF9XG4gKi9cbmV4cG9ydCBjbGFzcyBESUZGRVJFTlQgZXh0ZW5kcyBFUSB7XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QUkUgfS4gKi9cbiAgICBzdGF0aWMgUFJFKGVxdWl2YWxlbnQsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIEVRLlBSRShlcXVpdmFsZW50LCB0cnVlLCBwYXRoLCBkYmMsIGhpbnQpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBPU1QgfS4gKi9cbiAgICBzdGF0aWMgUE9TVChlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBFUS5QT1NUKGVxdWl2YWxlbnQsIHRydWUsIHBhdGgsIGRiYywgaGludCk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uSU5WQVJJQU5UIH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBFUS5JTlZBUklBTlQoZXF1aXZhbGVudCwgdHJ1ZSwgcGF0aCwgZGJjLCBoaW50KTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jb25zdHJ1Y3RvciB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGVxdWl2YWxlbnQpIHtcbiAgICAgICAgc3VwZXIoZXF1aXZhbGVudCwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuZXF1aXZhbGVudCA9IGVxdWl2YWxlbnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IHRoZSBhbiB7QGxpbmsgb2JqZWN0IH1zIGdvdHRhIGJlIGFuIGluc3RhbmNlIG9mIGEgY2VydGFpbiB7QGxpbmsgSU5TVEFOQ0UucmVmZXJlbmNlIH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IFNhbHZhdG9yZSBDYWxsYXJpIChYREJDQFdhWENvZGUubmV0KSAqL1xuZXhwb3J0IGNsYXNzIElOU1RBTkNFIGV4dGVuZHMgREJDIHtcbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBzcGVjaWZpZWQgKipyZWZlcmVuY2UqKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrXHRUaGUgdmFsdWUgdGhhdCBoYXMgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgdGhlICoqcmVmZXJlbmNlKiogaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9XG4gICAgICogXHRcdFx0XHRcdHRvIGJlIGZ1bGZpbGxlZC5cbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlXHRUaGUge0BsaW5rIG9iamVjdCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIHRvIGJlIGFuIGluc3RhbmNlIG9mLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlICpyZWZlcmVuY2UqKiwgKip1bmRlZmluZWQqKiBvciAqKm51bGwqKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgLi4ucmVmZXJlbmNlcykge1xuICAgICAgICBpZiAodG9DaGVjayA9PT0gbnVsbCB8fCB0b0NoZWNrID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgcmVmIG9mIHJlZmVyZW5jZXMpIHtcbiAgICAgICAgICAgIGlmICh0b0NoZWNrIGluc3RhbmNlb2YgcmVmKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgXCIke3JlZmVyZW5jZXMubWFwKHJlZiA9PiByZWYubmFtZSB8fCByZWYpLmpvaW4oJywgJyl9XCIgYnV0IGlzIG9mIHR5cGUgXCIke3R5cGVvZiB0b0NoZWNrfVwiYDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUoXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBJbiBvcmRlciB0byBwZXJmb3JtIGFuIFwiaW5zdGFuY2VvZlwiIGNoZWNrLlxuICAgIHJlZmVyZW5jZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocmVmZXJlbmNlKSA/IElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCAuLi5yZWZlcmVuY2UpIDogSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odmFsdWUsIHJlZmVyZW5jZSk7XG4gICAgICAgIH0sIGRiYywgcGF0aCwgaGludCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICByZWZlcmVuY2UsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShyZWZlcmVuY2UpID8gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odmFsdWUsIC4uLnJlZmVyZW5jZSkgOiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoLCBoaW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICByZWZlcmVuY2UsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IElOU1RBTkNFKHJlZmVyZW5jZSldLCBwYXRoLCBkYmMsIGhpbnQpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cbiAgICAvL1xuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodGhpcy5yZWZlcmVuY2UpID8gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgLi4udGhpcy5yZWZlcmVuY2UpIDogSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy5yZWZlcmVuY2UpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUeXBlLXNhZmUgY2hlY2sgdGhhdCB2YWxpZGF0ZXMgaWYgYSB2YWx1ZSBpcyBhbiBpbnN0YW5jZSBvZiBhIHNwZWNpZmllZCByZWZlcmVuY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVjayBcdFRoZSB2YWx1ZSB0byBjaGVjayBmb3IgaW5zdGFuY2UgdmFsaWRpdHkuXG4gICAgICogQHBhcmFtIHJlZmVyZW5jZVx0VGhlIHtAbGluayBvYmplY3QgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZi5cbiAgICAgKiBAcGFyYW0gaGludFx0XHRBbiBvcHRpb25hbCB7QGxpbmsgc3RyaW5nIH0gcHJvdmlkaW5nIGV4dHJhIGluZm9ybWF0aW9uIGluIGNhc2Ugb2YgYW4gaW5mcmluZ2VtZW50LlxuICAgICAqIEBwYXJhbSBpZFx0XHRBIHtAbGluayBzdHJpbmcgfSBpZGVudGlmeWluZyB0aGlzIHtAbGluayBJTlNUQU5DRSB9IHZpYSB0aGUge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfS1NZXNzYWdlLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogaWYgaXQgZnVsZmlsbHMgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfS5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgQSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IGlmIHRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXMgbm90IGZ1bGZpbGwgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfS4gKi9cbiAgICBzdGF0aWMgdHNDaGVjayh0b0NoZWNrLCByZWZlcmVuY2UsIGhpbnQgPSB1bmRlZmluZWQsIGlkID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBJTlNUQU5DRS50c0NoZWNrTXVsdGkodG9DaGVjaywgW3JlZmVyZW5jZV0sIGhpbnQsIGlkKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSB7QGxpbmsgSU5TVEFOQ0UucmVmZXJlbmNlIH0gLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBoaW50XHRcdEFuIG9wdGlvbmFsIHtAbGluayBzdHJpbmcgfSBwcm92aWRpbmcgZXh0cmEgaW5mb3JtYXRpb24gaW4gY2FzZSBvZiBhbiBpbmZyaW5nZW1lbnQuXG4gICAgICogQHBhcmFtIGlkXHRcdEEge0BsaW5rIHN0cmluZyB9IGlkZW50aWZ5aW5nIHRoaXMge0BsaW5rIElOU1RBTkNFIH0gdmlhIHRoZSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9LU1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2Vzbid0IGZ1bGZpbGwgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfS5cbiAgICAgKlxuICAgICAqIEB0aHJvd3MgQSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IGlmIHRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXMgbm90IGZ1bGZpbGwgdGhpcyB7QGxpbmsgREVGSU5FRCB9LiAqL1xuICAgIHN0YXRpYyB0c0NoZWNrTXVsdGkodG9DaGVjaywgcmVmZXJlbmNlcywgaGludCA9IHVuZGVmaW5lZCwgaWQgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgLi4ucmVmZXJlbmNlcyk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0b0NoZWNrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoYCR7aWQgPyBgKCR7aWR9KSBgIDogXCJcIn0ke3Jlc3VsdH0gJHtoaW50ID8gYOKcqCAke2hpbnR9IOKcqGAgOiBcIlwifWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IHVzZWQgYnkge0BsaW5rIElOU1RBTkNFLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2sgfS4gKi9cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICBjb25zdHJ1Y3RvcihyZWZlcmVuY2UpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2UgPSByZWZlcmVuY2U7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBwcm92aWRpbmcge0BsaW5rIFJFR0VYIH0tY29udHJhY3RzIGFuZCBzdGFuZGFyZCB7QGxpbmsgUmVnRXhwIH0gZm9yIGNvbW1vbiB1c2UgY2FzZXMgaW4ge0BsaW5rIFJFR0VYLnN0ZEV4cCB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgUkVHRVggZXh0ZW5kcyBEQkMge1xuICAgIC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgY29tcGxpZXMgdG8gdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrXHRcdFRoZSB2YWx1ZSB0aGF0IGhhcyBjb21wbHkgdG8gdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKiBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmUgZnVsZmlsbGVkLlxuICAgICAqIEBwYXJhbSBleHByZXNzaW9uXHRUaGUge0BsaW5rIFJlZ0V4cCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIGNvbXBseSB0byBpbiBvcmRlciBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0XHRmdWxmaWxsZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBjb21wbGllcyB3aXRoIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiosIG90aGVyd2lzZSBGQUxTRS4gKi9cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXhwcmVzc2lvbikge1xuICAgICAgICBpZiAodG9DaGVjayA9PT0gdW5kZWZpbmVkIHx8IHRvQ2hlY2sgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKCFleHByZXNzaW9uLnRlc3QodG9DaGVjaykpIHtcbiAgICAgICAgICAgIHJldHVybiBgVmFsdWUgaGFzIHRvIGNvbXBseSB0byByZWd1bGFyIGV4cHJlc3Npb24gXCIke2V4cHJlc3Npb259XCJgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXG4gICAgc3RhdGljIFBSRShleHByZXNzaW9uLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gUkVHRVguY2hlY2tBbGdvcml0aG0odmFsdWUsIGV4cHJlc3Npb24pO1xuICAgICAgICB9LCBkYmMsIHBhdGgsIGhpbnQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHByZXNzaW9uXHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gaGludFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUE9TVChleHByZXNzaW9uLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFJFR0VYLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBleHByZXNzaW9uKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoLCBoaW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHByZXNzaW9uXHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGhpbnRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKGV4cHJlc3Npb24sIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IFJFR0VYKGV4cHJlc3Npb24pXSwgcGF0aCwgZGJjLCBoaW50KTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvL1xuICAgIC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXG4gICAgLy9cbiAgICAvKipcbiAgICAgKiBJbnZva2VzIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQge0BsaW5rIFJFR0VYLmVxdWl2YWxlbnQgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgcmV0dXJuIFJFR0VYLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMuZXhwcmVzc2lvbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFR5cGUtc2FmZSBjaGVjayB0aGF0IHZhbGlkYXRlcyBhIHZhbHVlIGFnYWluc3QgYSByZWd1bGFyIGV4cHJlc3Npb24gYW5kIHJldHVybnMgaXQgYXMgdGhlIHNwZWNpZmllZCB0eXBlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRvIGNoZWNrIGFnYWluc3QgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0VGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byB2YWxpZGF0ZSBhZ2FpbnN0LlxuICAgICAqIEBwYXJhbSBoaW50XHRcdFx0T3B0aW9uYWwgaGludCBtZXNzYWdlIHRvIGluY2x1ZGUgaW4gdGhlIGVycm9yIGlmIHZhbGlkYXRpb24gZmFpbHMuXG4gICAgICogQHBhcmFtIGlkXHRcdFx0T3B0aW9uYWwgaWRlbnRpZmllciB0byBpbmNsdWRlIGluIHRoZSBlcnJvciBtZXNzYWdlLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlIHZhbGlkYXRlZCB2YWx1ZSBjYXN0IHRvIHRoZSBDQU5ESURBVEUgdHlwZS5cbiAgICAgKlxuICAgICAqIEB0aHJvd3Mge0BsaW5rIERCQy5JbmZyaW5nZW1lbnR9IGlmIHRoZSB2YWx1ZSBkb2VzIG5vdCBtYXRjaCB0aGUgcmVndWxhciBleHByZXNzaW9uLiAqL1xuICAgIHN0YXRpYyB0c0NoZWNrKHRvQ2hlY2ssIGV4cHJlc3Npb24sIGhpbnQgPSB1bmRlZmluZWQsIGlkID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFJFR0VYLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIGV4cHJlc3Npb24pO1xuICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gdG9DaGVjaztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGAke2lkID8gYCgke2lkfSkgYCA6IFwiXCJ9JHtyZXN1bHR9JHtoaW50ID8gYCDinKggJHtoaW50fSDinKhgIDogXCJcIn1gKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoaXMge0BsaW5rIFJFR0VYIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0gdXNlZCBieSB7QGxpbmsgUkVHRVguY2hlY2sgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHByZXNzaW9uIFNlZSB7QGxpbmsgUkVHRVguY2hlY2sgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihleHByZXNzaW9uKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvbiA9IGV4cHJlc3Npb247XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBJbi1NZXRob2QgY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVja1x0XHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtfS5cbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobX0uXG4gICAgICovXG4gICAgc3RhdGljIGNoZWNrKHRvQ2hlY2ssIGV4cHJlc3Npb24pIHtcbiAgICAgICAgY29uc3QgY2hlY2tSZXN1bHQgPSBSRUdFWC5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCBleHByZXNzaW9uKTtcbiAgICAgICAgaWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoY2hlY2tSZXN1bHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqIFN0b3JlcyBvZnRlbiB1c2VkIHtAbGluayBSZWdFeHAgfXMuICovXG5SRUdFWC5zdGRFeHAgPSB7XG4gICAgaHRtbEF0dHJpYnV0ZU5hbWU6IC9eW2EtekEtWl86XVthLXpBLVowLTlfLjotXSokLyxcbiAgICBlTWFpbDogL15bYS16QS1aMC05Ll8lKy1dK0BbYS16QS1aMC05Li1dK1xcLlthLXpBLVpdezIsfSQvaSxcbiAgICBwcm9wZXJ0eTogL15bJF9BLVphLXpdWyRfQS1aYS16MC05XSokLyxcbiAgICB1cmw6IC9eKD86KD86aHR0cDp8aHR0cHM/fGZ0cCk6XFwvXFwvKT8oPzpcXFMrKD86OlxcUyopP0ApPyg/OmxvY2FsaG9zdHwoPzpbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT9cXC4pK1thLXpBLVpdezIsfSkoPzo6XFxkezIsNX0pPyg/OlxcLyg/OltcXHdcXC1cXC5dKlxcLykqW1xcd1xcLVxcLl0rKD86XFw/XFxTKik/KD86I1xcUyopPyk/JC9pLFxuICAgIGtleVBhdGg6IC9eKFthLXpBLVpfJF1bYS16QS1aMC05XyRdKlxcLikqW2EtekEtWl8kXVthLXpBLVowLTlfJF0qJC8sXG4gICAgZGF0ZTogL15cXGR7MSw0fVsuXFwvLV1cXGR7MSwyfVsuXFwvLV1cXGR7MSw0fSQvaSxcbiAgICBkYXRlRm9ybWF0OiAvXigoRHsxLDJ9Wy4vLV1NezEsMn1bLi8tXVl7MSw0fSl8KE17MSwyfVsuLy1dRHsxLDJ9Wy4vLV1ZezEsNH0pfFl7MSw0fVsuLy1dRHsxLDJ9Wy4vLV1NezEsMn18KFl7MSw0fVsuLy1dTXsxLDJ9Wy4vLV1EezEsMn0pKSQvaSxcbiAgICBjc3NTZWxlY3RvcjogL14oPzpcXCp8I1tcXHctXSt8XFwuW1xcdy1dK3woPzpbXFx3LV0rfFxcKikoPzo6KD86W1xcdy1dKyg/OlxcKFtcXHctXStcXCkpPykrKT8oPzpcXFsoPzpbXFx3LV0rKD86KD86PXx+PXxcXHw9fFxcKj18XFwkPXxcXF49KVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqKT8pP1xcXSkrfFxcW1xccypbXFx3LV0rXFxzKj1cXHMqKD86XCJbXlwiXSpcInwnW14nXSonfFtcXHctXSspXFxzKlxcXSkoPzosXFxzKig/OlxcKnwjW1xcdy1dK3xcXC5bXFx3LV0rfCg/OltcXHctXSt8XFwqKSg/OjooPzpbXFx3LV0rKD86XFwoW1xcdy1dK1xcKSk/KSspPyg/OlxcWyg/OltcXHctXSsoPzooPzo9fH49fFxcfD18XFwqPXxcXCQ9fFxcXj0pXFxzKig/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXFx3LV0rKVxccyopPyk/XFxdKSt8XFxbXFxzKltcXHctXStcXHMqPVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqXFxdKSkqJC8sXG4gICAgYm9vbGVhbjogL14oVFJVRXxGQUxTRSkkL2ksXG4gICAgY29sb3JDb2RlSEVYOiAvXiMoW0EtRmEtZlxcZF17Myw0fXxbQS1GYS1mXFxkXXs2fXxbQS1GYS1mXFxkXXs4fSkkL2ksXG4gICAgc2ltcGxlSG90a2V5OiAvXigoQWx0fEN0cmx8U2hpZnR8TWV0YSlcXCspK1thLXpcXGRdJC9pLFxuICAgIGJjcDQ3OiAvXig/OlthLXpdezIsM30oPzotW2Etel17M30pezAsM318W2Etel17NH18W2Etel17NSw4fSkoPzotW2Etel17NH0pPyg/Oi1bYS16XXsyfXwtWzAtOV17M30pPyg/Oi1bYS16MC05XXs1LDh9fC1bMC05XVthLXowLTldezN9KSooPzotWzAtOWEtd3ktel0oPzotW2EtejAtOV17Miw4fSkrKSooPzoteCg/Oi1bYS16MC05XXsxLDh9KSspPyR8XngoPzotW2EtejAtOV17MSw4fSkrJC9pXG59O1xuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgb2YgY2VydGFpbiB7QGxpbmsgVFlQRS50eXBlIH0uXG4gKlxuICogQHJlbWFya3NcbiAqIEF1dGhvcjogXHRcdFNhbHZhdG9yZSBDYWxsYXJpIChDYWxsYXJpQFdhWENvZGUubmV0KSAvIDIwMjVcbiAqIE1haW50YWluZXI6XHRTYWx2YXRvcmUgQ2FsbGFyaSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBUWVBFIGV4dGVuZHMgREJDIHtcbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIG9mIHRoZSAqKnR5cGUqKiBzcGVjaWZpZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVja1x0VGhlIHtAbGluayBPYmplY3QgfSB3aGljaCdzICoqdHlwZSoqIHRvIGNoZWNrLlxuICAgICAqIEBwYXJhbSB0eXBlXHRcdFRoZSB0eXBlIHRoZSB7QGxpbmsgb2JqZWN0fSAqKnRvQ2hlY2sqKiBoYXMgdG8gYmUgb2YuIENhbiBiZSBhIHNpbmdsZSB0eXBlIG9yIG11bHRpcGxlIHR5cGVzIHNlcGFyYXRlZCBieSBcInxcIi5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIG9mIHRoZSBzcGVjaWZpZWQgKip0eXBlKiosIG90aGVyd2lzZSBGQUxTRS4gKi9cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSBmb3IgZHluYW1pYyB0eXBlIGNoZWNraW5nIG9mIGFsc28gVU5ERUZJTkVELlxuICAgIHN0YXRpYyBjaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0eXBlKSB7XG4gICAgICAgIGlmICh0b0NoZWNrID09PSB1bmRlZmluZWQgfHwgdG9DaGVjayA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjb25zdCB0eXBlcyA9IHR5cGUuc3BsaXQoXCJ8XCIpLm1hcCh0ID0+IHQudHJpbSgpKTtcbiAgICAgICAgY29uc3QgYWN0dWFsVHlwZSA9IHR5cGVvZiB0b0NoZWNrO1xuICAgICAgICAvLyAjcmVnaW9uIENoZWNrIGlmIHRoZSBhY3R1YWwgdHlwZSBtYXRjaGVzIGF0IGxlYXN0IG9uZSBvZiB0aGUgc3BlY2lmaWVkIHR5cGVzXG4gICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvdXNlVmFsaWRUeXBlb2Y6IE5lY2Vzc2FyeVxuICAgICAgICBjb25zdCBpc1ZhbGlkID0gdHlwZXMuc29tZSh0ID0+IGFjdHVhbFR5cGUgPT09IHQpO1xuICAgICAgICBpZiAoIWlzVmFsaWQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBvZiB0eXBlIFwiJHt0eXBlfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHthY3R1YWxUeXBlfVwiYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIG9mIHR5cGUgXCIke3R5cGVzLmpvaW4oXCIgfCBcIil9XCIgYnV0IGlzIG9mIHR5cGUgXCIke2FjdHVhbFR5cGV9XCJgO1xuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgdGhlIGFjdHVhbCB0eXBlIG1hdGNoZXMgYXQgbGVhc3Qgb25lIG9mIHRoZSBzcGVjaWZpZWQgdHlwZXNcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHR5cGVcdFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRBIDo6LXNlcGFyYXRlZCBsaXN0IG9mIGRvdHRlZCBwYXRocyB0byBjaGVjay4gRWFjaCBwYXRoIHBvaW50cyB0byBhIHByb3BlcnR5IHdpdGhpbiB0aGUgcGFyYW1ldGVyIHZhbHVlLlxuICAgICAqIFx0XHRcdFx0VW5kZWZpbmVkIHByb3BlcnRpZXMgYXJlIHNraXBwZWQuIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXG4gICAgc3RhdGljIFBSRSh0eXBlLCBwYXRoID0gdW5kZWZpbmVkLCBoaW50ID0gdW5kZWZpbmVkLCBkYmMgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgdHlwZSk7XG4gICAgICAgIH0sIGRiYywgcGF0aCwgaGludCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdEEgOjotc2VwYXJhdGVkIGxpc3Qgb2YgZG90dGVkIHBhdGhzIHRvIGNoZWNrLiBFYWNoIHBhdGggcG9pbnRzIHRvIGEgcHJvcGVydHkgd2l0aGluIHRoZSBwYXJhbWV0ZXIgdmFsdWUuXG4gICAgICogXHRcdFx0XHRVbmRlZmluZWQgcHJvcGVydGllcyBhcmUgc2tpcHBlZC4gU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKHR5cGUsIHBhdGggPSB1bmRlZmluZWQsIGhpbnQgPSB1bmRlZmluZWQsIGRiYyA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgdHlwZSk7XG4gICAgICAgIH0sIGRiYywgcGF0aCwgaGludCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0QSA6Oi1zZXBhcmF0ZWQgbGlzdCBvZiBkb3R0ZWQgcGF0aHMgdG8gY2hlY2suIEVhY2ggcGF0aCBwb2ludHMgdG8gYSBwcm9wZXJ0eSB3aXRoaW4gdGhlIHBhcmFtZXRlciB2YWx1ZS5cbiAgICAgKiBcdFx0XHRcdFVuZGVmaW5lZCBwcm9wZXJ0aWVzIGFyZSBza2lwcGVkLiBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQodHlwZSwgcGF0aCA9IHVuZGVmaW5lZCwgaGludCA9IHVuZGVmaW5lZCwgZGJjID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgVFlQRSh0eXBlKV0sIHBhdGgsIGRiYywgaGludCk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy9cbiAgICAvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxuICAgIC8vXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBUWVBFLnR5cGUgfSAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobX0uICovXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgY2hlY2sodG9DaGVjaykge1xuICAgICAgICByZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLnR5cGUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbnZva2VzIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIFRZUEUudHlwZSB9IC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gdHlwZVx0XHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gaGludFx0XHRBbiBvcHRpb25hbCB7QGxpbmsgc3RyaW5nIH0gcHJvdmlkaW5nIGV4dHJhIGluZm9ybWF0aW9uIGluIGNhc2Ugb2YgYW4gaW5mcmluZ2VtZW50LlxuICAgICAqIEBwYXJhbSBpZFx0XHRBIHtAbGluayBzdHJpbmcgfSBpZGVudGlmeWluZyB0aGlzIHtAbGluayBUWVBFIH0gdmlhIHRoZSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9LU1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2Vzbid0IGZ1bGZpbGwgdGhpcyB7QGxpbmsgVFlQRSB9LlxuICAgICAqXG4gICAgICogQHRocm93cyBBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gaWYgdGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lcyBub3QgZnVsZmlsbCB0aGlzIHtAbGluayBERUZJTkVEIH0uICovXG4gICAgc3RhdGljIHRzQ2hlY2sodG9DaGVjaywgdHlwZSwgaGludCA9IHVuZGVmaW5lZCwgaWQgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gVFlQRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0eXBlKTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRvQ2hlY2s7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudChgJHtpZCA/IGAoJHtpZH0pIGAgOiBcIlwifSR7cmVzdWx0fSR7aGludCA/IGAg4pyoICR7aGludH0g4pyoYCA6IFwiXCJ9YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBUWVBFIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBUWVBFLnR5cGUgfSB1c2VkIGJ5IHtAbGluayBUWVBFLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHlwZSBTZWUge0BsaW5rIFRZUEUuY2hlY2sgfS4gKi9cbiAgICBjb25zdHJ1Y3Rvcih0eXBlKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgfVxufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJ2YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xudmFyIF9fcGFyYW0gPSAodGhpcyAmJiB0aGlzLl9fcGFyYW0pIHx8IGZ1bmN0aW9uIChwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cbn07XG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi9EQkNcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcIi4vREJDL1JFR0VYXCI7XG5pbXBvcnQgeyBFUSB9IGZyb20gXCIuL0RCQy9FUVwiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCIuL0RCQy9UWVBFXCI7XG5pbXBvcnQgeyBBRSB9IGZyb20gXCIuL0RCQy9BRVwiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwiLi9EQkMvSU5TVEFOQ0VcIjtcbmltcG9ydCB7IEdSRUFURVIgfSBmcm9tIFwiLi9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSXCI7XG5pbXBvcnQgeyBHUkVBVEVSX09SX0VRVUFMIH0gZnJvbSBcIi4vREJDL0NPTVBBUklTT04vR1JFQVRFUl9PUl9FUVVBTFwiO1xuaW1wb3J0IHsgTEVTUyB9IGZyb20gXCIuL0RCQy9DT01QQVJJU09OL0xFU1NcIjtcbmltcG9ydCB7IExFU1NfT1JfRVFVQUwgfSBmcm9tIFwiLi9EQkMvQ09NUEFSSVNPTi9MRVNTX09SX0VRVUFMXCI7XG5pbXBvcnQgeyBESUZGRVJFTlQgfSBmcm9tIFwiLi9EQkMvRVEvRElGRkVSRU5UXCI7XG4vKiogRGVtb25zdHJhdGl2ZSB1c2Ugb2YgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IERlY29yYXRvcnMgKi9cbmV4cG9ydCBjbGFzcyBEZW1vIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLy8gI3JlZ2lvbiBDaGVjayBQcm9wZXJ0eSBEZWNvcmF0b3JcbiAgICAgICAgdGhpcy50ZXN0UHJvcGVydHkgPSBcImFcIjtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBTdGF0aWMgTWV0aG9kIHdpdGggUGFyYW12YWx1ZVByb3ZpZGVyXG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgUHJvcGVydHkgRGVjb3JhdG9yXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBQYXJhbWV0ZXIuICYgUmV0dXJudmFsdWUgRGVjb3JhdG9yXG4gICAgdGVzdFBhcmFtdmFsdWVBbmRSZXR1cm52YWx1ZShhKSB7XG4gICAgICAgIHJldHVybiBgeHh4eCR7YX1gO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFBhcmFtZXRlci4gJiBSZXR1cm52YWx1ZSBEZWNvcmF0b3JcbiAgICAvLyAjcmVnaW9uIENoZWNrIFJldHVybnZhbHVlIERlY29yYXRvclxuICAgIHRlc3RSZXR1cm52YWx1ZShhKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFJldHVybnZhbHVlIERlY29yYXRvclxuICAgIC8vICNyZWdpb24gQ2hlY2sgRVEtREJDICYgUGF0aCB0byBwcm9wZXJ0eSBvZiBQYXJhbWV0ZXItdmFsdWVcbiAgICB0ZXN0RVFBbmRQYXRoKG8pIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgRVEtREJDICYgUGF0aCB0byBwcm9wZXJ0eSBvZiBQYXJhbWV0ZXItdmFsdWVcbiAgICAvLyAjcmVnaW9uIENoZWNrIEVRLURCQyAmIFBhdGggdG8gcHJvcGVydHkgb2YgUGFyYW1ldGVyLXZhbHVlIHdpdGggSW52ZXJzaW9uXG4gICAgdGVzdEVRQW5kUGF0aFdpdGhJbnZlcnNpb24obykgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBFUS1EQkMgJiBQYXRoIHRvIHByb3BlcnR5IG9mIFBhcmFtZXRlci12YWx1ZSB3aXRoIEludmVyc2lvblxuICAgIC8vICNyZWdpb24gQ2hlY2sgVFlQRVxuICAgIHRlc3RUWVBFKG8pIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgVFlQRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgQUVcbiAgICB0ZXN0QUUoeCkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBBRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgUkVHRVggd2l0aCBBRVxuICAgIHRlc3RSRUdFWFdpdGhBRSh4KSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFJFR0VYIHdpdGggQUVcbiAgICAvLyAjcmVnaW9uIENoZWNrIElOU1RBTkNFXG4gICAgdGVzdElOU1RBTkNFKGNhbmRpZGF0ZSkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBJTlNUQU5DRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgQUUgUmFuZ2VcbiAgICB0ZXN0QUVSYW5nZSh4KSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIEFFIFJhbmdlXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBBRSBJbmRleFxuICAgIHRlc3RBRUluZGV4KHgpIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgQUUgSW5kZXhcbiAgICAvLyAjcmVnaW9uIENoZWNrIENvbXBhcmlzb25cbiAgICB0ZXN0R1JFQVRFUihpbnB1dCkgeyB9XG4gICAgdGVzdEdSRUFURVJfT1JfRVFVQUwoaW5wdXQpIHsgfVxuICAgIHRlc3RMRVNTKGlucHV0KSB7IH1cbiAgICB0ZXN0TEVTU19PUl9FUVVBTChpbnB1dCkgeyB9XG4gICAgdGVzdERJRkZFUkVOVChpbnB1dCkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBDb21wYXJpc29uXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBTdGF0aWMgTWV0aG9kIHdpdGggUGFyYW12YWx1ZVByb3ZpZGVyXG4gICAgc3RhdGljIHRlc3RTdGF0aWNNZXRob2QobWVzc2FnZSwgY291bnQpIHtcbiAgICAgICAgcmV0dXJuIGAke21lc3NhZ2V9IHJlcGVhdGVkICR7Y291bnR9IHRpbWVzYDtcbiAgICB9XG59XG5fX2RlY29yYXRlKFtcbiAgICBSRUdFWC5JTlZBUklBTlQoL15hJC8pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBPYmplY3QpXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0UHJvcGVydHlcIiwgdm9pZCAwKTtcbl9fZGVjb3JhdGUoW1xuICAgIFJFR0VYLlBPU1QoL154eHh4LiokLyksXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIFJFR0VYLlBSRSgvaG9sbGEqL2cpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbU3RyaW5nXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIFN0cmluZylcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RQYXJhbXZhbHVlQW5kUmV0dXJudmFsdWVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBSRUdFWC5QT1NUKC9eeHh4eC4qJC8pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtTdHJpbmddKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgU3RyaW5nKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdFJldHVybnZhbHVlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEVRLlBSRShcIlNFTEVDVFwiLCBmYWxzZSwgXCJ0YWdOYW1lXCIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbSFRNTEVsZW1lbnRdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdEVRQW5kUGF0aFwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBFUS5QUkUoXCJTRUxFQ1RcIiwgdHJ1ZSwgXCJ0YWdOYW1lXCIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbSFRNTEVsZW1lbnRdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdEVRQW5kUGF0aFdpdGhJbnZlcnNpb25cIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgVFlQRS5QUkUoXCJzdHJpbmdcIikpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtPYmplY3RdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdFRZUEVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgQUUuUFJFKFtuZXcgVFlQRShcInN0cmluZ1wiKV0pKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbQXJyYXldKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdEFFXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEFFLlBSRShuZXcgUkVHRVgoL14oP2k6KE5PVyl8KFsrLV1cXGQrW2RteV0pKSQvaSkpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbQXJyYXldKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdFJFR0VYV2l0aEFFXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVGVzdFxuICAgICxcbiAgICBfX3BhcmFtKDAsIElOU1RBTkNFLlBSRShEYXRlKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW09iamVjdF0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0SU5TVEFOQ0VcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgQUUuUFJFKFtuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eYWJjJC8pXSwgMSwgMikpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtBcnJheV0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0QUVSYW5nZVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBBRS5QUkUoW25ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoL15hYmMkLyldLCAxKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RBRUluZGV4XCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEdSRUFURVIuUFJFKDIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbTnVtYmVyXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RHUkVBVEVSXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEdSRUFURVJfT1JfRVFVQUwuUFJFKDIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbTnVtYmVyXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RHUkVBVEVSX09SX0VRVUFMXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIExFU1MuUFJFKDIwKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW051bWJlcl0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0TEVTU1wiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBMRVNTX09SX0VRVUFMLlBSRSgyMCkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtOdW1iZXJdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdExFU1NfT1JfRVFVQUxcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgRElGRkVSRU5ULlBSRSgyMCkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtOdW1iZXJdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdERJRkZFUkVOVFwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBUWVBFLlBSRShcInN0cmluZ1wiKSksXG4gICAgX19wYXJhbSgxLCBUWVBFLlBSRShcIm51bWJlclwiKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW1N0cmluZywgTnVtYmVyXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIFN0cmluZylcbl0sIERlbW8sIFwidGVzdFN0YXRpY01ldGhvZFwiLCBudWxsKTtcbmNvbnN0IGRlbW8gPSBuZXcgRGVtbygpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RQcm9wZXJ0eSA9IFwiYWJkXCI7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5WQVJJQU5UIEluZnJpbmdlbWVudFwiLCBcIk9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0UHJvcGVydHkgPSBcImFcIjtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJJTlZBUklBTlQgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbmRlbW8udGVzdFBhcmFtdmFsdWVBbmRSZXR1cm52YWx1ZShcImhvbGxhXCIpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIlBBUkFNRVRFUi0gJiBSRVRVUk5WQUxVRSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RQYXJhbXZhbHVlQW5kUmV0dXJudmFsdWUoXCJ5eXl5XCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlBBUkFNRVRFUi0gJiBSRVRVUk5WQUxVRSBJbmZyaW5nZW1lbnRcIiwgXCJPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdFJldHVybnZhbHVlKFwieHh4eFwiKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJSRVRVUk5WQUxVRSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RSZXR1cm52YWx1ZShcInl5eXlcIik7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiUkVUVVJOVkFMVUUgSW5mcmluZ2VtZW50XCIsIFwiT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RFUUFuZFBhdGgoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiRVEgd2l0aCBQYXRoIEluZnJpbmdlbWVudCBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RFUUFuZFBhdGhXaXRoSW52ZXJzaW9uKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIikpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkVRIHdpdGggUGF0aCBhbmQgSW52ZXJzaW9uIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdFRZUEUoXCJ4XCIpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIlRZUEUgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0VFlQRSgwKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJUWVBFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdEFFKFtcIjExXCIsIFwiMTBcIiwgXCJiXCJdKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJBRSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RBRShbXCIxMVwiLCAxMSwgXCJiXCJdKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJBRSBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RSRUdFWFdpdGhBRShbXCIrMWRcIiwgXCJOT1dcIiwgXCItMTB5XCJdKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJSRUdFWCB3aXRoIEFFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdFJFR0VYV2l0aEFFKFtcIisxZFwiLCBcIis1ZFwiLCBcIi14MTB5XCJdKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJSRUdFWCB3aXRoIEFFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdElOU1RBTkNFKG5ldyBEYXRlKCkpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIklOU1RBTkNFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdElOU1RBTkNFKGRlbW8pO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOU1RBTkNFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdEFFUmFuZ2UoWzExLCBcImFiY1wiLCBcImFiY1wiXSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiQUUgUmFuZ2UgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0QUVSYW5nZShbMTEsIFwiYWJjXCIsIC9hL2ddKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJBRSBSYW5nZSBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RBRUluZGV4KFsxMSwgXCJhYmNcIiwgXCJhYmNcIl0pO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIkFFIEluZGV4IE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEFFSW5kZXgoW1wiMTFcIiwgMTIsIFwiL2EvZ1wiXSk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiQUUgSW5kZXggSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0R1JFQVRFUigxMSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiR1JFQVRFUiBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RHUkVBVEVSKDIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkdSRUFURVIgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0R1JFQVRFUl9PUl9FUVVBTCgyKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJHUkVBVEVSX09SX0VRVUFMIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEdSRUFURVJfT1JfRVFVQUwoMSk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiR1JFQVRFUl9PUl9FUVVBTCBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RMRVNTKDEwKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJMRVNTIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdExFU1MoMjApO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkxFU1MgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0TEVTU19PUl9FUVVBTCgyMCk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiTEVTUyBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RMRVNTX09SX0VRVUFMKDIxKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJMRVNTX09SX0VRVUFMIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdERJRkZFUkVOVCgyMSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiRElGRkVSRU5UIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdERJRkZFUkVOVCgyMCk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiRElGRkVSRU5UIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbi8vICNyZWdpb24gSW5hY3Rpdml0eSBDaGVja3NcbndpbmRvdy5XYVhDb2RlLkRCQy5leGVjdXRpb25TZXR0aW5ncy5jaGVja1ByZWNvbmRpdGlvbnMgPSBmYWxzZTtcbnRyeSB7XG4gICAgZGVtby50ZXN0TEVTU19PUl9FUVVBTCgyMSk7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJJTkFDVElWRSBQUkVDT05ESVRJT05TIE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIFBSRUNPTkRJVElPTlMgRkFJTEVEXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxud2luZG93LldhWENvZGUuREJDLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrUG9zdGNvbmRpdGlvbnMgPSBmYWxzZTtcbnRyeSB7XG4gICAgZGVtby50ZXN0UmV0dXJudmFsdWUoXCJxcXFxcVwiKTtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIFBPU1RDT05ESVRJT05TIE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIFBPU1RDT05ESVRJT05TIEZBSUxFRFwiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbndpbmRvdy5XYVhDb2RlLkRCQy5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHMgPSBmYWxzZTtcbnRyeSB7XG4gICAgZGVtby50ZXN0UHJvcGVydHkgPSBcImJcIjtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIElOVkFSSUFOVFMgT0tcIik7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5BQ1RJVkUgSU5WQVJJQU5UUyBGQUlMRURcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG4vLyAjZW5kcmVnaW9uIEluYWN0aXZpdHkgQ2hlY2tzXG4vLyBSZS1lbmFibGUgYWxsIGNoZWNrcyBmb3Igc3Vic2VxdWVudCB0ZXN0c1xud2luZG93LldhWENvZGUuREJDLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrUHJlY29uZGl0aW9ucyA9IHRydWU7XG53aW5kb3cuV2FYQ29kZS5EQkMuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tQb3N0Y29uZGl0aW9ucyA9IHRydWU7XG53aW5kb3cuV2FYQ29kZS5EQkMuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzID0gdHJ1ZTtcbi8vICNyZWdpb24gU3RhdGljIE1ldGhvZCBUZXN0XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiVEVTVElORyBTVEFUSUMgTUVUSE9EIFdJVEggUEFSQU1WQUxVRVBST1ZJREVSXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG5EZW1vLnRlc3RTdGF0aWNNZXRob2QoXCJIZWxsb1wiLCAzKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJTVEFUSUMgTUVUSE9EIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIERlbW8udGVzdFN0YXRpY01ldGhvZChcIkhlbGxvXCIsIFwibm90IGEgbnVtYmVyXCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlNUQVRJQyBNRVRIT0QgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxudHJ5IHtcbiAgICBEZW1vLnRlc3RTdGF0aWNNZXRob2QoMTIzLCA1KTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJTVEFUSUMgTUVUSE9EIEluZnJpbmdlbWVudCAoZmlyc3QgcGFyYW0pIE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuLy8gI2VuZHJlZ2lvbiBTdGF0aWMgTWV0aG9kIFRlc3RcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==