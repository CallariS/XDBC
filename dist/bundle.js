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
            if (!DBC.resolveDBCPath(window, dbc).executionSettings.checkInvariants) {
                return;
            }
            // biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
            let value;
            // #region Replace original property.
            Object.defineProperty(target, propertyKey, {
                set(newValue) {
                    if (!DBC.resolveDBCPath(window, dbc).executionSettings.checkInvariants) {
                        return;
                    }
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
                if (!DBC.resolveDBCPath(window, dbc).executionSettings.checkPostconditions) {
                    return;
                }
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
                if (!DBC.resolveDBCPath(window, dbc).executionSettings
                    .checkPreconditions) {
                    return;
                }
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
        if (window.WaXCode === undefined)
            window.WaXCode = {};
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        window.WaXCode.DBC = this;
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
     * @param dbc			    See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return COMPARISON.checkAlgorithm(value, equivalent, equalityPermitted, invert);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
     * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
     * @param path			    See {@link DBC.Postcondition }.
     * @param dbc			    See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decPostcondition((value, target, propertyKey) => {
            return COMPARISON.checkAlgorithm(value, equalityPermitted, equivalent, invert);
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
     * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
     * @param path			    See {@link DBC.decInvariant }.
     * @param dbc			    See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _DBC__WEBPACK_IMPORTED_MODULE_0__.DBC.decInvariant([new COMPARISON(equivalent, equalityPermitted, invert)], path, dbc);
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
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.PRE(equivalent, false, false, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.POST(equivalent, false, false, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.INVARIANT(equivalent, false, false, path, dbc);
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
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.PRE(equivalent, true, false, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.POST(equivalent, true, false, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.INVARIANT(equivalent, true, false, path, dbc);
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
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.PRE(equivalent, false, true, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.POST(equivalent, false, true, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.INVARIANT(equivalent, false, true, path, dbc);
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
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.PRE(equivalent, true, true, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.POST(equivalent, true, true, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _COMPARISON__WEBPACK_IMPORTED_MODULE_0__.COMPARISON.INVARIANT(equivalent, true, true, path, dbc);
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

/** See {@link COMPARISON }. */
class DIFFERENT extends _EQ__WEBPACK_IMPORTED_MODULE_0__.EQ {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _EQ__WEBPACK_IMPORTED_MODULE_0__.EQ.PRE(equivalent, true, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _EQ__WEBPACK_IMPORTED_MODULE_0__.EQ.POST(equivalent, true, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return _EQ__WEBPACK_IMPORTED_MODULE_0__.EQ.INVARIANT(equivalent, true, path, dbc);
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
    testGREATER_OR_EQUAL(input) { }
    testLESS(input) { }
    testLESS_OR_EQUAL(input) { }
    testDIFFERENT(input) { }
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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9BRS50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9DT01QQVJJU09OLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0NPTVBBUklTT04vR1JFQVRFUi50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9DT01QQVJJU09OL0dSRUFURVJfT1JfRVFVQUwudHMiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EQkMvQ09NUEFSSVNPTi9MRVNTLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0NPTVBBUklTT04vTEVTU19PUl9FUVVBTC50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9FUS50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9FUS9ESUZGRVJFTlQudHMiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EQkMvSU5TVEFOQ0UudHMiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EQkMvUkVHRVgudHMiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EQkMvVFlQRS50cyIsIndlYnBhY2s6Ly94ZGJjL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3hkYmMvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3hkYmMvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly94ZGJjL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EZW1vLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHJvdmlkZXMgYSAqKkQqKmVzaWduICoqQioqeSAqKkMqKm9udHJhY3QgRnJhbWV3b3JrIHVzaW5nIGRlY29yYXRvcnMuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBEQkMge1xuICAgIC8qKlxuICAgICAqIE1ha2UgYSByZXF1ZXN0IHRvIGdldCB0aGUgdmFsdWUgb2YgYSBjZXJ0YWluIHBhcmFtZXRlciBvZiBzcGVjaWZpYyBtZXRob2QgaW4gYSBzcGVjaWZpYyB7QGxpbmsgb2JqZWN0IH0uXG4gICAgICogVGhhdCByZXF1ZXN0IGdldHMgZW5saXN0ZWQgaW4ge0BsaW5rIHBhcmFtVmFsdWVSZXF1ZXN0cyB9IHdoaWNoIGlzIHVzZWQgYnkge0BsaW5rIFBhcmFtdmFsdWVQcm92aWRlcn0gdG8gaW52b2tlIHRoZVxuICAgICAqIGdpdmVuIFwicmVjZXB0b3JcIiB3aXRoIHRoZSBwYXJhbWV0ZXIgdmFsdWUgc3RvcmVkIGluIHRoZXJlLiBUaHVzIGEgcGFyYW1ldGVyIGRlY29yYXRvciB1c2luZyB0aGlzIG1ldGhvZCB3aWxsXG4gICAgICogbm90IHJlY2VpdmUgYW55IHZhbHVlIG9mIHRoZSB0b3AgbWV0aG9kIGlzIG5vdCB0YWdnZWQgd2l0aCB7QGxpbmsgUGFyYW12YWx1ZVByb3ZpZGVyfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YXJnZXRcdFx0VGhlIHtAbGluayBvYmplY3QgfSBjb250YWluaW5nIHRoZSBtZXRob2Qgd2l0aCB0aGUgcGFyYW1ldGVyIHdoaWNoJ3MgdmFsdWUgaXMgcmVxdWVzdGVkLlxuICAgICAqIEBwYXJhbSBtZXRob2ROYW1lXHRUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHdpdGggdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0XHRUaGUgaW5kZXggb2YgdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cbiAgICAgKiBAcGFyYW0gcmVjZXB0b3JcdFx0VGhlIG1ldGhvZCB0aGUgcmVxdWVzdGVkIHBhcmFtZXRlci12YWx1ZSBzaGFsbCBiZSBwYXNzZWQgdG8gd2hlbiBpdCBiZWNvbWVzIGF2YWlsYWJsZS4gKi9cbiAgICBzdGF0aWMgcmVxdWVzdFBhcmFtVmFsdWUodGFyZ2V0LCBtZXRob2ROYW1lLCBpbmRleCwgXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBHb3R0YSBiZSBhbnkgc2luY2UgcGFyYW1ldGVyLXZhbHVlcyBtYXkgYmUgdW5kZWZpbmVkLlxuICAgIHJlY2VwdG9yKSB7XG4gICAgICAgIGlmIChEQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmhhcyh0YXJnZXQpKSB7XG4gICAgICAgICAgICBpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQodGFyZ2V0KS5oYXMobWV0aG9kTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQodGFyZ2V0KS5nZXQobWV0aG9kTmFtZSkuaGFzKGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICBEQkMucGFyYW1WYWx1ZVJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KHRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQobWV0aG9kTmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQoaW5kZXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAucHVzaChyZWNlcHRvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBEQkMucGFyYW1WYWx1ZVJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KHRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQobWV0aG9kTmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXQoaW5kZXgsIG5ldyBBcnJheShyZWNlcHRvcikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIERCQy5wYXJhbVZhbHVlUmVxdWVzdHNcbiAgICAgICAgICAgICAgICAgICAgLmdldCh0YXJnZXQpXG4gICAgICAgICAgICAgICAgICAgIC5zZXQobWV0aG9kTmFtZSwgbmV3IE1hcChbXG4gICAgICAgICAgICAgICAgICAgIFtpbmRleCwgbmV3IEFycmF5KHJlY2VwdG9yKV0sXG4gICAgICAgICAgICAgICAgXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5zZXQodGFyZ2V0LCBuZXcgTWFwKFtcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIG5ldyBNYXAoW1xuICAgICAgICAgICAgICAgICAgICAgICAgW2luZGV4LCBuZXcgQXJyYXkocmVjZXB0b3IpXSxcbiAgICAgICAgICAgICAgICAgICAgXSksXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIF0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSBjaGVja2luZyB0aGUge0BsaW5rIHBhcmFtVmFsdWVSZXF1ZXN0cyB9IGZvciB2YWx1ZS1yZXF1ZXN0cyBvZiB0aGUgbWV0aG9kJ3MgcGFyYW1ldGVyIHRodXNcbiAgICAgKiBhbHNvIHVzYWJsZSBvbiBzZXR0ZXJzLlxuICAgICAqIFdoZW4gZm91bmQgaXQgd2lsbCBpbnZva2UgdGhlIFwicmVjZXB0b3JcIiByZWdpc3RlcmVkIHRoZXJlLCBpbnRlciBhbGlhIGJ5IHtAbGluayByZXF1ZXN0UGFyYW1WYWx1ZSB9LCB3aXRoIHRoZVxuICAgICAqIHBhcmFtZXRlcidzIHZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRhcmdldCBcdFx0VGhlIHtAbGluayBvYmplY3QgfSBob3N0aW5nIHRoZSB0YWdnZWQgbWV0aG9kIGFzIHByb3ZpZGVkIGJ5IHRoZSBydW50aW1lLlxuICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSBcdFRoZSB0YWdnZWQgbWV0aG9kJ3MgbmFtZSBhcyBwcm92aWRlZCBieSB0aGUgcnVudGltZS5cbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRvciBcdFRoZSB7QGxpbmsgUHJvcGVydHlEZXNjcmlwdG9yIH0gYXMgcHJvdmlkZWQgYnkgdGhlIHJ1bnRpbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUge0BsaW5rIFByb3BlcnR5RGVzY3JpcHRvciB9IHRoYXQgd2FzIHBhc3NlZCBieSB0aGUgcnVudGltZS4gKi9cbiAgICBzdGF0aWMgUGFyYW12YWx1ZVByb3ZpZGVyKHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpIHtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEdvdHRhIGJlIGFueSBzaW5jZSBwYXJhbWV0ZXItdmFsdWVzIG1heSBiZSB1bmRlZmluZWQuXG4gICAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgLy8gI3JlZ2lvblx0Q2hlY2sgaWYgYSB2YWx1ZSBvZiBvbmUgb2YgdGhlIG1ldGhvZCdzIHBhcmFtZXRlciBoYXMgYmVlbiByZXF1ZXN0ZWQgYW5kIHBhc3MgaXQgdG8gdGhlXG4gICAgICAgICAgICAvL1x0XHRcdHJlY2VwdG9yLCBpZiBzby5cbiAgICAgICAgICAgIGlmIChEQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmhhcyh0YXJnZXQpICYmXG4gICAgICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQodGFyZ2V0KS5oYXMocHJvcGVydHlLZXkpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBEQkMucGFyYW1WYWx1ZVJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgIC5nZXQodGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAuZ2V0KHByb3BlcnR5S2V5KVxuICAgICAgICAgICAgICAgICAgICAua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHJlY2VwdG9yIG9mIERCQy5wYXJhbVZhbHVlUmVxdWVzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KHRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KHByb3BlcnR5S2V5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXQoaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjZXB0b3IoYXJnc1tpbmRleF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBcdENoZWNrIGlmIGEgdmFsdWUgb2Ygb25lIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgaGFzIGJlZW4gcmVxdWVzdGVkIGFuZCBwYXNzIGl0IHRvIHRoZVxuICAgICAgICAgICAgLy8gXHRcdFx0XHRyZWNlcHRvciwgaWYgc28uXG4gICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vVGhpc0luU3RhdGljOiBOZWNlc3NhcnkuXG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxNZXRob2QuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkZXNjcmlwdG9yO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIFBhcmFtZXRlci12YWx1ZSByZXF1ZXN0cy5cbiAgICAvLyAjcmVnaW9uIEludmFyaWFudFxuICAgIC8qKlxuICAgICAqIEEgcHJvcGVydHktZGVjb3JhdG9yIGZhY3Rvcnkgc2VydmluZyBhcyBhICoqRCoqZXNpZ24gKipCKip5ICoqQyoqb250cmFjdCBJbnZhcmlhbnQuXG4gICAgICogU2luY2UgdGhlIHZhbHVlIG11c3QgYmUgaW5pdGlhbGl6ZWQgb3Igc2V0IGFjY29yZGluZyB0byB0aGUgc3BlY2lmaWVkICoqY29udHJhY3RzKiogdGhlIHZhbHVlIHdpbGwgb25seSBiZSBjaGVja2VkXG4gICAgICogd2hlbiBhc3NpZ25pbmcgaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29udHJhY3RzIFRoZSB7QGxpbmsgREJDIH0tQ29udHJhY3RzIHRoZSB2YWx1ZSBzaGFsbCB1cGhvbGQuXG4gICAgICpcbiAgICAgKiBAdGhyb3dzIFx0QSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IHdoZW5ldmVyIHRoZSBwcm9wZXJ0eSBpcyB0cmllZCB0byBiZSBzZXQgdG8gYSB2YWx1ZSB0aGF0IGRvZXMgbm90IGNvbXBseSB0byB0aGVcbiAgICAgKiBcdFx0XHRzcGVjaWZpZWQgKipjb250cmFjdHMqKiwgYnkgdGhlIHJldHVybmVkIG1ldGhvZC4qL1xuICAgIHN0YXRpYyBkZWNJbnZhcmlhbnQoY29udHJhY3RzLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuICh0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICBpZiAoIURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICAgICAgICAgIGxldCB2YWx1ZTtcbiAgICAgICAgICAgIC8vICNyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5S2V5LCB7XG4gICAgICAgICAgICAgICAgc2V0KG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWFsVmFsdWUgPSBwYXRoID8gREJDLnJlc29sdmUobmV3VmFsdWUsIHBhdGgpIDogbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykucmVwb3J0RmllbGRJbmZyaW5nZW1lbnQocmVzdWx0LCB0YXJnZXQsIHBhdGgsIHByb3BlcnR5S2V5LCByZWFsVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFJlcGxhY2Ugb3JpZ2luYWwgcHJvcGVydHkuXG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gSW52YXJpYW50XG4gICAgLy8gI3JlZ2lvbiBQb3N0Y29uZGl0aW9uXG4gICAgLyoqXG4gICAgICogQSBtZXRob2QgZGVjb3JhdG9yIGZhY3RvcnkgY2hlY2tpbmcgdGhlIHJlc3VsdCBvZiBhIG1ldGhvZCB3aGVuZXZlciBpdCBpcyBpbnZva2VkIHRodXMgYWxzbyB1c2FibGUgb24gZ2V0dGVycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGVja1x0VGhlICoqKHRvQ2hlY2s6IGFueSwgb2JqZWN0LCBzdHJpbmcpID0+IGJvb2xlYW4gfCBzdHJpbmcqKiB0byB1c2UgZm9yIGNoZWNraW5nLlxuICAgICAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLnJlc29sdmVEQkNQYXRoIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFRoZSBkb3R0ZWQgcGF0aCByZWZlcnJpbmcgdG8gdGhlIGFjdHVhbCB2YWx1ZSB0byBjaGVjaywgc3RhcnRpbmcgZm9ybSB0aGUgc3BlY2lmaWVkIG9uZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRoZSAqKiggdGFyZ2V0IDogb2JqZWN0LCBwcm9wZXJ0eUtleSA6IHN0cmluZywgZGVzY3JpcHRvciA6IFByb3BlcnR5RGVzY3JpcHRvciApIDogUHJvcGVydHlEZXNjcmlwdG9yKipcbiAgICAgKiBcdFx0XHRpbnZva2VkIGJ5IFR5cGVzY3JpcHQuXG4gICAgICovXG4gICAgc3RhdGljIGRlY1Bvc3Rjb25kaXRpb24oXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBjaGVjaywgZGJjLCBwYXRoID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAodGFyZ2V0LCBwcm9wZXJ0eUtleSwgZGVzY3JpcHRvcikgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xuICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICAgICAgICAgIGRlc2NyaXB0b3IudmFsdWUgPSAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja1Bvc3Rjb25kaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1RoaXNJblN0YXRpYzogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZShyZXN1bHQsIHBhdGgpIDogcmVzdWx0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrUmVzdWx0ID0gY2hlY2socmVhbFZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNoZWNrUmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIERCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykucmVwb3J0UmV0dXJudmFsdWVJbmZyaW5nZW1lbnQoY2hlY2tSZXN1bHQsIHRhcmdldCwgcGF0aCwgcHJvcGVydHlLZXksIHJlYWxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3I7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUG9zdGNvbmRpdGlvblxuICAgIC8vICNyZWdpb24gRGVjb3JhdG9yXG4gICAgLy8gI3JlZ2lvbiBQcmVjb25kaXRpb25cbiAgICAvKipcbiAgICAgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB0aGF0IHJlcXVlc3RzIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgcGFzc2luZyBpdCB0byB0aGUgcHJvdmlkZWRcbiAgICAgKiBcImNoZWNrXCItbWV0aG9kIHdoZW4gdGhlIHZhbHVlIGJlY29tZXMgYXZhaWxhYmxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoZWNrXHRUaGUgXCIoIHVua25vd24gKSA9PiB2b2lkXCIgdG8gYmUgaW52b2tlZCBhbG9uZyB3aXRoIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgYXMgc29vblxuICAgICAqIFx0XHRcdFx0YXMgaXQgYmVjb21lcyBhdmFpbGFibGUuXG4gICAgICogQHBhcmFtIGRiYyAgXHRTZWUge0BsaW5rIERCQy5yZXNvbHZlREJDUGF0aCB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRUaGUgZG90dGVkIHBhdGggcmVmZXJyaW5nIHRvIHRoZSBhY3R1YWwgdmFsdWUgdG8gY2hlY2ssIHN0YXJ0aW5nIGZvcm0gdGhlIHNwZWNpZmllZCBvbmUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgKioodGFyZ2V0OiBvYmplY3QsIG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCwgcGFyYW1ldGVySW5kZXg6IG51bWJlciApID0+IHZvaWQqKiBpbnZva2VkIGJ5IFR5cGVzY3JpcHQtICovXG4gICAgc3RhdGljIGRlY1ByZWNvbmRpdGlvbihjaGVjaywgZGJjLCBwYXRoID0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAodGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgREJDLnJlcXVlc3RQYXJhbVZhbHVlKHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5nc1xuICAgICAgICAgICAgICAgICAgICAuY2hlY2tQcmVjb25kaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKHZhbHVlLCBwYXRoKSA6IHZhbHVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNoZWNrKHJlYWxWYWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5yZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQocmVzdWx0LCB0YXJnZXQsIHBhdGgsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4LCByZWFsVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXBvcnRzIGEgd2FybmluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIGNvbnRhaW5pbmcgdGhlIHdhcm5pbmcuICovXG4gICAgcmVwb3J0V2FybmluZyhtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0aGlzLndhcm5pbmdTZXR0aW5ncy5sb2dUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXBvcnRzIGFuIGluZnJpbmdlbWVudCBhY2NvcmRpbmcgdG8gdGhlIHtAbGluayBpbmZyaW5nZW1lbnRTZXR0aW5ncyB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxuICAgICAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIgJiB2aW9sYXRvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cbiAgICAgKiBAcGFyYW0gdmlvbGF0b3IgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci4gKi9cbiAgICByZXBvcnRJbmZyaW5nZW1lbnQobWVzc2FnZSwgdmlvbGF0b3IsIHRhcmdldCwgcGF0aCkge1xuICAgICAgICBjb25zdCBmaW5hbE1lc3NhZ2UgPSBgWyBGcm9tIFwiJHt2aW9sYXRvcn1cIiR7cGF0aCA/IGAncyBtZW1iZXIgXCIke3BhdGh9XCJgIDogXCJcIn0ke3R5cGVvZiB0YXJnZXQgPT09IFwiZnVuY3Rpb25cIiA/IGAgaW4gXCIke3RhcmdldC5uYW1lfVwiYCA6IHR5cGVvZiB0YXJnZXQgPT09IFwib2JqZWN0XCIgJiYgdGFyZ2V0ICE9PSBudWxsICYmIHR5cGVvZiB0YXJnZXQuY29uc3RydWN0b3IgPT09IFwiZnVuY3Rpb25cIiA/IGAgaW4gXCIke3RhcmdldC5jb25zdHJ1Y3Rvci5uYW1lfVwiYCA6IFwiXCJ9OiAke21lc3NhZ2V9XWA7XG4gICAgICAgIGlmICh0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzLnRocm93RXhjZXB0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudChmaW5hbE1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzLmxvZ1RvQ29uc29sZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZmluYWxNZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXBvcnRzIGEgcGFyYW1ldGVyLWluZnJpbmdlbWVudCB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxuICAgICAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIsXCJtZXRob2RcIiwgcGFyYW1ldGVyLVwiaW5kZXhcIiAmIHZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxuICAgICAqIEBwYXJhbSBtZXRob2QgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0VGhlIGluZGV4IG9mIHRoZSBwYXJhbWV0ZXIgd2l0aGluIHRoZSBhcmd1bWVudCBsaXN0aW5nLlxuICAgICAqIEBwYXJhbSB2YWx1ZSBcdFRoZSBwYXJhbWV0ZXIncyB2YWx1ZS4gKi9cbiAgICByZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQobWVzc2FnZSwgdGFyZ2V0LCBwYXRoLCBtZXRob2QsIGluZGV4LCB2YWx1ZSkge1xuICAgICAgICBjb25zdCBwcm9wZXJJbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgdGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoYFsgUGFyYW1ldGVyLXZhbHVlIFwiJHt2YWx1ZX1cIiBvZiB0aGUgJHtwcm9wZXJJbmRleH0ke3Byb3BlckluZGV4ID09PSAxID8gXCJzdFwiIDogcHJvcGVySW5kZXggPT09IDIgPyBcIm5kXCIgOiBwcm9wZXJJbmRleCA9PT0gMyA/IFwicmRcIiA6IFwidGhcIn0gcGFyYW1ldGVyIGRpZCBub3QgZnVsZmlsbCBvbmUgb2YgaXQncyBjb250cmFjdHM6ICR7bWVzc2FnZX1dYCwgbWV0aG9kLCB0YXJnZXQsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXBvcnRzIGEgZmllbGQtaW5mcmluZ2VtZW50IHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXG4gICAgICogZm9yIHRoZSBnaXZlbiAqKm1lc3NhZ2UqKiAmICoqbmFtZSoqLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2VcdEEge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cbiAgICAgKiBAcGFyYW0ga2V5IFx0XHRUaGUgcHJvcGVydHkga2V5LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFRoZSBkb3R0ZWQtcGF0aCB7QGxpbmsgc3RyaW5nIH0gdGhhdCBsZWFkcyB0byB0aGUgdmFsdWUgbm90IGZ1bGZpbGxpbmcgdGhlIGNvbnRyYWN0IHN0YXJ0aW5nIGZyb21cbiAgICAgKiBcdFx0XHRcdFx0dGhlIHRhZ2dlZCBvbmUuXG4gICAgICogQHBhcmFtIHZhbHVlXHRcdFRoZSB2YWx1ZSBub3QgZnVsZmlsbGluZyBhIGNvbnRyYWN0LiAqL1xuICAgIHJlcG9ydEZpZWxkSW5mcmluZ2VtZW50KG1lc3NhZ2UsIHRhcmdldCwgcGF0aCwga2V5LCB2YWx1ZSkge1xuICAgICAgICB0aGlzLnJlcG9ydEluZnJpbmdlbWVudChgWyBOZXcgdmFsdWUgZm9yIFwiJHtrZXl9XCIke3BhdGggPT09IHVuZGVmaW5lZCA/IFwiXCIgOiBgLiR7cGF0aH1gfSB3aXRoIHZhbHVlIFwiJHt2YWx1ZX1cIiBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9XWAsIGtleSwgdGFyZ2V0LCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhIHJldHVybnZhbHVlLWluZnJpbmdlbWVudCBhY2NvcmRpbmcgdmlhIHtAbGluayByZXBvcnRJbmZyaW5nZW1lbnQgfSBhbHNvIGdlbmVyYXRpbmcgYSBwcm9wZXIge0BsaW5rIHN0cmluZyB9LXdyYXBwZXJcbiAgICAgKiBmb3IgdGhlIGdpdmVuIFwibWVzc2FnZVwiLFwibWV0aG9kXCIgJiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cbiAgICAgKiBAcGFyYW0gbWV0aG9kIFx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIG9yIG5hbWluZyB0aGUgdmlvbGF0b3IuXG4gICAgICogQHBhcmFtIHZhbHVlXHRcdFRoZSBwYXJhbWV0ZXIncyB2YWx1ZS4gKi9cbiAgICByZXBvcnRSZXR1cm52YWx1ZUluZnJpbmdlbWVudChtZXNzYWdlLCB0YXJnZXQsIHBhdGgsIG1ldGhvZCwgXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoYFsgUmV0dXJuLXZhbHVlIFwiJHt2YWx1ZX1cIiBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9XWAsIG1ldGhvZCwgdGFyZ2V0LCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyB0aGlzIHtAbGluayBEQkMgfSBieSBzZXR0aW5nIHRoZSB7QGxpbmsgREJDLmluZnJpbmdlbWVudFNldHRpbmdzIH0sIGRlZmluZSB0aGUgKipXYVhDb2RlKiogbmFtZXNwYWNlIGluXG4gICAgICogKip3aW5kb3cqKiBpZiBub3QgeWV0IGF2YWlsYWJsZSBhbmQgc2V0dGluZyB0aGUgcHJvcGVydHkgKipEQkMqKiBpbiB0aGVyZSB0byB0aGUgaW5zdGFuY2Ugb2YgdGhpcyB7QGxpbmsgREJDIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5mcmluZ2VtZW50U2V0dGluZ3MgXHRTZWUge0BsaW5rIERCQy5pbmZyaW5nZW1lbnRTZXR0aW5ncyB9LlxuICAgICAqIEBwYXJhbSBleGVjdXRpb25TZXR0aW5nc1x0XHRTZWUge0BsaW5rIERCQy5leGVjdXRpb25TZXR0aW5ncyB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGluZnJpbmdlbWVudFNldHRpbmdzID0geyB0aHJvd0V4Y2VwdGlvbjogdHJ1ZSwgbG9nVG9Db25zb2xlOiBmYWxzZSB9LCBleGVjdXRpb25TZXR0aW5ncyA9IHtcbiAgICAgICAgY2hlY2tQcmVjb25kaXRpb25zOiB0cnVlLFxuICAgICAgICBjaGVja1Bvc3Rjb25kaXRpb25zOiB0cnVlLFxuICAgICAgICBjaGVja0ludmFyaWFudHM6IHRydWUsXG4gICAgfSkge1xuICAgICAgICAvLyAjZW5kcmVnaW9uIFByZWNvbmRpdGlvblxuICAgICAgICAvLyAjZW5kcmVnaW9uIERlY29yYXRvclxuICAgICAgICAvLyAjcmVnaW9uIEV4ZWN1dGlvbiBIYW5kbGluZ1xuICAgICAgICAvKiogU3RvcmVzIHNldHRpbmdzIGNvbmNlcm5pbmcgdGhlIGV4ZWN1dGlvbiBvZiBjaGVja3MuICovXG4gICAgICAgIHRoaXMuZXhlY3V0aW9uU2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBjaGVja1ByZWNvbmRpdGlvbnM6IHRydWUsXG4gICAgICAgICAgICBjaGVja1Bvc3Rjb25kaXRpb25zOiB0cnVlLFxuICAgICAgICAgICAgY2hlY2tJbnZhcmlhbnRzOiB0cnVlLFxuICAgICAgICB9O1xuICAgICAgICAvLyAjZW5kcmVnaW9uIEV4ZWN1dGlvbiBIYW5kbGluZ1xuICAgICAgICAvLyAjcmVnaW9uIFdhcm5pbmcgaGFuZGxpbmcuXG4gICAgICAgIC8qKiBTdG9yZXMgc2V0dGluZ3MgY29uY2VybmluZyB3YXJuaW5ncy4gKi9cbiAgICAgICAgdGhpcy53YXJuaW5nU2V0dGluZ3MgPSB7IGxvZ1RvQ29uc29sZTogdHJ1ZSB9O1xuICAgICAgICAvLyAjZW5kcmVnaW9uIFdhcm5pbmcgaGFuZGxpbmcuXG4gICAgICAgIC8vICNyZWdpb24gaW5mcmluZ2VtZW50IGhhbmRsaW5nLlxuICAgICAgICAvKiogU3RvcmVzIHRoZSBzZXR0aW5ncyBjb25jZXJuaW5nIGluZnJpbmdlbWVudHMgKi9cbiAgICAgICAgdGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncyA9IHsgdGhyb3dFeGNlcHRpb246IHRydWUsIGxvZ1RvQ29uc29sZTogZmFsc2UgfTtcbiAgICAgICAgdGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncyA9IGluZnJpbmdlbWVudFNldHRpbmdzO1xuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgaWYgKHdpbmRvdy5XYVhDb2RlID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICB3aW5kb3cuV2FYQ29kZSA9IHt9O1xuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgd2luZG93LldhWENvZGUuREJDID0gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVzb2x2ZXMgdGhlIGRlc2lyZWQge0BsaW5rIG9iamVjdCB9IG91dCBhIGdpdmVuIG9uZSAqKnRvUmVzb2x2ZUZyb20qKiB1c2luZyB0aGUgc3BlY2lmaWVkICoqcGF0aCoqLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvUmVzb2x2ZUZyb20gVGhlIHtAbGluayBvYmplY3QgfSBzdGFydGluZyB0byByZXNvbHZlIGZyb20uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRUaGUgZG90dGVkIHBhdGgte0BsaW5rIHN0cmluZyB9LlxuICAgICAqIFx0XHRcdFx0XHRcdFRoaXMgc3RyaW5nIHVzZXMgLiwgWy4uLl0sIGFuZCAoKSB0byByZXByZXNlbnQgYWNjZXNzaW5nIG5lc3RlZCBwcm9wZXJ0aWVzLFxuICAgICAqIFx0XHRcdFx0XHRcdGFycmF5IGVsZW1lbnRzL29iamVjdCBrZXlzLCBhbmQgY2FsbGluZyBtZXRob2RzLCByZXNwZWN0aXZlbHksIG1pbWlja2luZyBKYXZhU2NyaXB0IHN5bnRheCB0byBuYXZpZ2F0ZVxuICAgICAqIFx0XHRcdFx0XHRcdGFuIG9iamVjdCdzIHN0cnVjdHVyZS4gQ29kZSwgZS5nLiBzb21ldGhpbmcgbGlrZSBhLmIoIDEgYXMgbnVtYmVyICkuYywgd2lsbCBub3QgYmUgZXhlY3V0ZWQgYW5kXG4gICAgICogXHRcdFx0XHRcdFx0dGh1cyBtYWtlIHRoZSByZXRyaWV2YWwgZmFpbC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRoZSByZXF1ZXN0ZWQge0BsaW5rIG9iamVjdCB9LCBOVUxMIG9yIFVOREVGSU5FRC4gKi9cbiAgICBzdGF0aWMgcmVzb2x2ZSh0b1Jlc29sdmVGcm9tLCBwYXRoKSB7XG4gICAgICAgIGlmICghdG9SZXNvbHZlRnJvbSB8fCB0eXBlb2YgcGF0aCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYXJ0cyA9IHBhdGgucmVwbGFjZSgvXFxbKFsnXCJdPykoLio/KVxcMVxcXS9nLCBcIi4kMlwiKS5zcGxpdChcIi5cIik7IC8vIEhhbmRsZSBpbmRleGVyc1xuICAgICAgICBsZXQgY3VycmVudCA9IHRvUmVzb2x2ZUZyb207XG4gICAgICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnQgPT09IG51bGwgfHwgdHlwZW9mIGN1cnJlbnQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWV0aG9kTWF0Y2ggPSBwYXJ0Lm1hdGNoKC8oXFx3KylcXCgoLiopXFwpLyk7XG4gICAgICAgICAgICBpZiAobWV0aG9kTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtZXRob2ROYW1lID0gbWV0aG9kTWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgY29uc3QgYXJnc1N0ciA9IG1ldGhvZE1hdGNoWzJdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBhcmdzU3RyLnNwbGl0KFwiLFwiKS5tYXAoKGFyZykgPT4gYXJnLnRyaW0oKSk7IC8vIFNpbXBsZSBhcmd1bWVudCBwYXJzaW5nXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50W21ldGhvZE5hbWVdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbbWV0aG9kTmFtZV0uYXBwbHkoY3VycmVudCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkOyAvLyBNZXRob2Qgbm90IGZvdW5kIG9yIG5vdCBhIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRbcGFydF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XG4gICAgfVxufVxuLy8gI3JlZ2lvbiBQYXJhbWV0ZXItdmFsdWUgcmVxdWVzdHMuXG4vKiogU3RvcmVzIGFsbCByZXF1ZXN0IGZvciBwYXJhbWV0ZXIgdmFsdWVzIHJlZ2lzdGVyZWQgYnkge0BsaW5rIGRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuREJDLnBhcmFtVmFsdWVSZXF1ZXN0cyA9IG5ldyBNYXAoKTtcbi8vICNyZWdpb24gQ2xhc3Nlc1xuLy8gI3JlZ2lvbiBFcnJvcnNcbi8qKiBBbiB7QGxpbmsgRXJyb3IgfSB0byBiZSB0aHJvd24gd2hlbmV2ZXIgYW4gaW5mcmluZ2VtZW50IGlzIGRldGVjdGVkLiAqL1xuREJDLkluZnJpbmdlbWVudCA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgdGhpcyB7QGxpbmsgRXJyb3IgfSBieSB0YWdnaW5nIHRoZSBzcGVjaWZpZWQgbWVzc2FnZS17QGxpbmsgc3RyaW5nIH0gYXMgYW4gWERCQy1JbmZyaW5nZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudC4gKi9cbiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlKSB7XG4gICAgICAgIHN1cGVyKGBbIFhEQkMgSW5mcmluZ2VtZW50ICR7bWVzc2FnZX1dYCk7XG4gICAgfVxufTtcbi8vICNlbmRyZWdpb24gRXJyb3JzXG4vLyAjZW5kcmVnaW9uIENsYXNzZXNcbi8vICNlbmRyZWdpb24gaW5mcmluZ2VtZW50IGhhbmRsaW5nLlxuLyoqXG4gKiBSZXNvbHZlcyB0aGUgc3BlY2lmaWVkIGRvdHRlZCB7QGxpbmsgc3RyaW5nIH0tcGF0aCB0byBhIHtAbGluayBEQkMgfS5cbiAqXG4gKiBAcGFyYW0gb2JqIFx0VGhlIHtAbGluayBvYmplY3QgfSB0byBzdGFydCByZXNvbHZpbmcgZnJvbS5cbiAqIEBwYXJhbSBwYXRoIFx0VGhlIGRvdHRlZCB7QGxpbmsgc3RyaW5nIH0tcGF0aCBsZWFkaW5nIHRvIHRoZSB7QGxpbmsgREJDIH0uXG4gKlxuICogQHJldHVybnMgVGhlIHJlcXVlc3RlZCB7QGxpbmsgREJDIH0uXG4gKi9cbkRCQy5yZXNvbHZlREJDUGF0aCA9IChvYmosIHBhdGgpID0+IHBhdGggPT09IG51bGwgfHwgcGF0aCA9PT0gdm9pZCAwID8gdm9pZCAwIDogcGF0aC5zcGxpdChcIi5cIikucmVkdWNlKChhY2N1bXVsYXRvciwgY3VycmVudCkgPT4gYWNjdW11bGF0b3JbY3VycmVudF0sIG9iaik7XG4vLyBTZXQgdGhlIG1haW4gaW5zdGFuY2Ugd2l0aCBzdGFuZGFyZCAqKkRCQy5pbmZyaW5nZW1lbnRTZXR0aW5ncyoqLlxubmV3IERCQygpO1xuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGFsbCBlbGVtZW50cyBvZiBhbiB7QGxpbmsgb2JqZWN0IH1zIGhhdmUgdG8gZnVsZmlsbFxuICogYSBnaXZlbiB7QGxpbmsgb2JqZWN0IH0ncyBjaGVjay1tZXRob2QgKCoqKCB0b0NoZWNrIDogYW55ICkgPT4gYm9vbGVhbiB8IHN0cmluZyoqKS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xuZXhwb3J0IGNsYXNzIEFFIGV4dGVuZHMgREJDIHtcbiAgICAvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvKipcbiAgICAgKiBDaGVja3MgZWFjaCBlbGVtZW50IG9mIHRoZSAqKnZhbHVlKiote0BsaW5rIEFycmF5IDwgYW55ID59IGFnYWluc3QgdGhlIGdpdmVuICoqY29uZGl0aW9uKiosIGlmIGl0IGlzIG9uZS4gSWYgaXQgaXMgbm90XG4gICAgICogdGhlICoqdmFsdWUqKiBpdHNlbGYgd2lsbCBiZSBjaGVja2VkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbmRpdGlvblx0VGhlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgKip2YWx1ZSoqIGFnYWluc3QuXG4gICAgICogQHBhcmFtIHZhbHVlXHRcdEVpdGhlciAqKnZhbHVlKiote0BsaW5rIEFycmF5IDwgYW55ID59LCB3aGljaCdzIGVsZW1lbnRzIHdpbGwgYmUgY2hlY2tlZCwgb3IgdGhlIHZhbHVlIHRvIGJlXG4gICAgICogXHRcdFx0XHRcdGNoZWNrZWQgaXRzZWxmLlxuICAgICAqIEBwYXJhbSBpbmRleFx0XHRJZiBzcGVjaWZpZWQgd2l0aCAqKmlkeEVuZCoqIGJlaW5nIHVuZGVmaW5lZCwgdGhpcyB7QGxpbmsgTnVtYmVyIH0gd2lsbCBiZSBzZWVuIGFzIHRoZSBpbmRleCBvZlxuICAgICAqIFx0XHRcdFx0XHR0aGUgdmFsdWUte0BsaW5rIEFycmF5IH0ncyBlbGVtZW50IHRvIGNoZWNrLiBJZiB2YWx1ZSBpc24ndCBhbiB7QGxpbmsgQXJyYXkgfSB0aGlzIHBhcmFtZXRlclxuICAgICAqIFx0XHRcdFx0XHR3aWxsIG5vdCBoYXZlIGFueSBlZmZlY3QuXG4gICAgICogXHRcdFx0XHRcdFdpdGggKippZHhFbmQqKiBub3QgdW5kZWZpbmVkIHRoaXMgcGFyYW1ldGVyIGluZGljYXRlcyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzcGFuIG9mIGVsZW1lbnRzIHRvXG4gICAgICogXHRcdFx0XHRcdGNoZWNrIHdpdGhpbiB0aGUgdmFsdWUte0BsaW5rIEFycmF5IH0uXG4gICAgICogQHBhcmFtIGlkeEVuZFx0SW5kaWNhdGVzIHRoZSBsYXN0IGVsZW1lbnQncyBpbmRleCAoaW5jbHVkaW5nKSBvZiB0aGUgc3BhbiBvZiB2YWx1ZS17QGxpbmsgQXJyYXkgfSBlbGVtZW50cyB0byBjaGVjay5cbiAgICAgKiBcdFx0XHRcdFx0U2V0dGluZyB0aGlzIHBhcmFtZXRlciB0byAtMSBzcGVjaWZpZXMgdGhhdCBhbGwgdmFsdWUte0BsaW5rIEFycmF5IH0ncyBlbGVtZW50cyBiZWdpbm5pbmcgZnJvbSB0aGVcbiAgICAgKiBcdFx0XHRcdFx0c3BlY2lmaWVkICoqaW5kZXgqKiBzaGFsbCBiZSBjaGVja2VkLlxuICAgICAqXG4gICAgICogQHJldHVybnMgQXMgc29vbiBhcyB0aGUgKipjb25kaXRpb24qKiByZXR1cm5zIGEge0BsaW5rIHN0cmluZyB9LCBpbnN0ZWFkIG9mIFRSVUUsIHRoZSByZXR1cm5lZCBzdHJpbmcuIFRSVUUgaWYgdGhlXG4gICAgICogXHRcdFx0Kipjb25kaXRpb24qKiBuZXZlciByZXR1cm5zIGEge0BsaW5rIHN0cmluZ30uICovXG4gICAgc3RhdGljIGNoZWNrQWxnb3JpdGhtKGNvbmRpdGlvbiwgdmFsdWUsIGluZGV4LCBpZHhFbmQpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCAmJiBpZHhFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IC0xICYmIGluZGV4IDwgdmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbmRpdGlvbi5jaGVjayh2YWx1ZVtpbmRleF0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBWaW9sYXRpbmctQXJyYXllbGVtZW50IGF0IGluZGV4IFwiJHtpbmRleH1cIiB3aXRoIHZhbHVlIFwiJHt2YWx1ZVtpbmRleF19XCIuICR7cmVzdWx0fWA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIEluIG9yZGVyIGZvciBvcHRpb25hbCBwYXJhbWV0ZXIgdG8gbm90IGNhdXNlIGFuIGVycm9yIGlmIHRoZXkgYXJlIG9taXR0ZWQuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBlbmRpbmcgPSBpZHhFbmQgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgID8gaWR4RW5kICE9PSAtMVxuICAgICAgICAgICAgICAgICAgICA/IGlkeEVuZCArIDFcbiAgICAgICAgICAgICAgICAgICAgOiB2YWx1ZS5sZW5ndGhcbiAgICAgICAgICAgICAgICA6IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBpbmRleCA/IGluZGV4IDogMDsgaSA8IGVuZGluZzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gY29uZGl0aW9uLmNoZWNrKHZhbHVlW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgVmlvbGF0aW5nLUFycmF5ZWxlbWVudCBhdCBpbmRleCAke2l9LiAke3Jlc3VsdH1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjb25kaXRpb24uY2hlY2sodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXG4gICAgICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZSBhZ2FpbnN0IHdpdGguXG4gICAgICogV2hlbiBzcGVjaWZ5aW5nIGFuICoqaW5kZXgqKiBhbmQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyAqKnZhbHVlKiogaXMgYW4ge0BsaW5rIEFycmF5IH0sIHRoZSAqKnJlYWxDb25kaXRpb25zKiogYXBwbHkgdG8gdGhlXG4gICAgICogZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkICoqaW5kZXgqKi5cbiAgICAgKiBJZiB0aGUge0BsaW5rIEFycmF5IH0gaXMgdG9vIHNob3J0IHRoZSBjdXJyZW50bHkgcHJvY2Vzc2VkIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZlxuICAgICAqICoqcmVhbENvbmRpdGlvbnMqKiB3aWxsIGJlIHZlcmlmaWVkIHRvIFRSVUUgYXV0b21hdGljYWxseSwgY29uc2lkZXJpbmcgb3B0aW9uYWwgcGFyYW1ldGVycy5cbiAgICAgKiBJZiBhbiAqKmluZGV4KiogaXMgc3BlY2lmaWVkIGJ1dCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIGlzbid0IGFuIGFycmF5LCB0aGUgKippbmRleCoqIGlzIHRyZWF0ZWQgYXMgYmVpbmcgdW5kZWZpbmVkLlxuICAgICAqIElmICoqaW5kZXgqKiBpcyB1bmRlZmluZWQgYW5kIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgaXMgYW4ge0BsaW5rIEFycmF5IH0gZWFjaCBlbGVtZW50IG9mIGl0IHdpbGwgYmUgY2hlY2tlZFxuICAgICAqIGFnYWluc3QgdGhlICoqcmVhbENvbmRpdGlvbnMqKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFsQ29uZGl0aW9uc1x0RWl0aGVyIG9uZSBvciBtb3JlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxuICAgICAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxuICAgICAqIEBwYXJhbSBpbmRleFx0XHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gaWR4RW5kXHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuc1x0QSB7QGxpbmsgc3RyaW5nIH0gYXMgc29vbiBhcyBvbmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IG9mICoqcmVhbENvbmRpdGlvbnMqKiByZXR1cm5zIG9uZS5cbiAgICAgKiBcdFx0XHRPdGhlcndpc2UgVFJVRS4gKi9cbiAgICBzdGF0aWMgUFJFKHJlYWxDb25kaXRpb25zLCBpbmRleCA9IHVuZGVmaW5lZCwgaWR4RW5kID0gdW5kZWZpbmVkLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZWFsQ29uZGl0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGN1cnJlbnRDb25kaXRpb24gb2YgcmVhbENvbmRpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gQUUuY2hlY2tBbGdvcml0aG0oY3VycmVudENvbmRpdGlvbiwgdmFsdWUsIGluZGV4LCBpZHhFbmQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJib29sZWFuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBBRS5jaGVja0FsZ29yaXRobShyZWFsQ29uZGl0aW9ucywgdmFsdWUsIGluZGV4LCBpZHhFbmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcbiAgICAgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJuLXZhbHVlIGFnYWluc3Qgd2l0aC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFsQ29uZGl0aW9uc1x0RWl0aGVyIG9uZSBvciBtb3JlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxuICAgICAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxuICAgICAqIEBwYXJhbSBpbmRleFx0XHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gaWR4RW5kXHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuc1x0QSB7QGxpbmsgc3RyaW5nIH0gYXMgc29vbiBhcyBvbmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IG9mICoqcmVhbENvbmRpdGlvbnMqKiByZXR1cm4gb25lLlxuICAgICAqIFx0XHRcdE90aGVyd2lzZSBUUlVFLiAqL1xuICAgIHN0YXRpYyBQT1NUKHJlYWxDb25kaXRpb25zLCBpbmRleCA9IHVuZGVmaW5lZCwgaWR4RW5kID0gdW5kZWZpbmVkLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVhbENvbmRpdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjdXJyZW50Q29uZGl0aW9uIG9mIHJlYWxDb25kaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEFFLmNoZWNrQWxnb3JpdGhtKGN1cnJlbnRDb25kaXRpb24sIHZhbHVlLCBpbmRleCwgaWR4RW5kKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT09IFwiYm9vbGVhblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQUUuY2hlY2tBbGdvcml0aG0oXG4gICAgICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgICAgICAgICAgcmVhbENvbmRpdGlvbnMsIHZhbHVlLCBpbmRleCwgaWR4RW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCBkYmMsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcbiAgICAgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgZmllbGQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWVcbiAgICAgKiBcdFx0XHRcdFx0XHRcdGFnYWluc3Qgd2l0aC5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGlkeEVuZFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqXG4gICAgICogQHJldHVybnNcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQocmVhbENvbmRpdGlvbnMsIGluZGV4ID0gdW5kZWZpbmVkLCBpZHhFbmQgPSB1bmRlZmluZWQsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IEFFKHJlYWxDb25kaXRpb25zLCBpbmRleCwgaWR4RW5kKV0sIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy9cbiAgICAvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2UgZ2xvYmFsIGZ1bmN0aW9ucykuXG4gICAgLy9cbiAgICAvKipcbiAgICAgKiBJbnZva2VzIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGFsbCB7QGxpbmsgQUUuY29uZGl0aW9ucyB9IGFuZCB0aGUge0BsaW5rIG9iamVjdCB9IHtAbGluayB0b0NoZWNrIH0sXG4gICAgICoge0BsaW5rIEFFLmluZGV4IH0gJiB7QGxpbmsgQUUuaWR4RW5kIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtfS4gKi9cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuY29uZGl0aW9ucykpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY3VycmVudENvbmRpdGlvbiBvZiB0aGlzLmNvbmRpdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBBRS5jaGVja0FsZ29yaXRobShjdXJyZW50Q29uZGl0aW9uLCB0b0NoZWNrLCB0aGlzLmluZGV4LCB0aGlzLmlkeEVuZCk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT09IFwiYm9vbGVhblwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEFFLmNoZWNrQWxnb3JpdGhtKFxuICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgICAgICB0aGlzLmNvbmRpdGlvbnMsIHRvQ2hlY2ssIHRoaXMuaW5kZXgsIHRoaXMuaWR4RW5kKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBBRSB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgQUUuY29uZGl0aW9ucyB9LCB7QGxpbmsgQUUuaW5kZXggfSBhbmQge0BsaW5rIEFFLmlkeEVuZCB9IHVzZWQgYnkge0BsaW5rIEFFLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudCBTZWUge0BsaW5rIEVRLmNoZWNrIH0uICovXG4gICAgY29uc3RydWN0b3IoY29uZGl0aW9ucywgaW5kZXggPSB1bmRlZmluZWQsIGlkeEVuZCA9IHVuZGVmaW5lZCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmNvbmRpdGlvbnMgPSBjb25kaXRpb25zO1xuICAgICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIHRoaXMuaWR4RW5kID0gaWR4RW5kO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcbi8qKlxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgYSBjb21wYXJpc29uIGJldHdlZW4gdHdvIHtAbGluayBvYmplY3QgfXMuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBDT01QQVJJU09OIGV4dGVuZHMgREJDIHtcbiAgICAvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvKipcbiAgICAgKiBEb2VzIGEgY29tcGFyaXNvbiBiZXR3ZWVuIHRoZSB7QGxpbmsgb2JqZWN0IH0gKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrXHRcdFRoZSB2YWx1ZSB0aGF0IGhhcyB0byBiZSBlcXVhbCB0byBpdCdzIHBvc3NpYmxlICoqZXF1aXZhbGVudCoqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdGhlIG9uZSAqKnRvQ2hlY2sqKiBoYXMgdG8gYmUgZXF1YWwgdG8gaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlXG4gICAgICogXHRcdFx0XHRcdFx0ZnVsZmlsbGVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKiBhcmUgZXF1YWwgdG8gZWFjaCBvdGhlciwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuICAgIHN0YXRpYyBjaGVja0FsZ29yaXRobSh0b0NoZWNrLCBlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCwgaW52ZXJ0KSB7XG4gICAgICAgIGlmIChlcXVhbGl0eVBlcm1pdHRlZCAmJiAhaW52ZXJ0ICYmIHRvQ2hlY2sgPCBlcXVpdmFsZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gXCIke2VxdWl2YWxlbnR9XCJgO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcXVhbGl0eVBlcm1pdHRlZCAmJiBpbnZlcnQgJiYgdG9DaGVjayA+IGVxdWl2YWxlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBgVmFsdWUgaGFzIHRvIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlcXVhbGl0eVBlcm1pdHRlZCAmJiAhaW52ZXJ0ICYmIHRvQ2hlY2sgPD0gZXF1aXZhbGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgZ3JlYXRlciB0aGFuIFwiJHtlcXVpdmFsZW50fVwiYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWVxdWFsaXR5UGVybWl0dGVkICYmIGludmVydCAmJiB0b0NoZWNrID49IGVxdWl2YWxlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBgVmFsdWUgaGFzIHRvIGJlIGxlc3MgdGhhbiBcIiR7ZXF1aXZhbGVudH1cImA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdCAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gZXF1YWxpdHlQZXJtaXR0ZWQgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCwgaW52ZXJ0KTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUE9TVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBlcXVhbGl0eVBlcm1pdHRlZCwgZXF1aXZhbGVudCwgaW52ZXJ0KTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIGZpZWxkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdCAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gZXF1YWxpdHlQZXJtaXR0ZWQgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IENPTVBBUklTT04oZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQsIGludmVydCldLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gRHluYW1pYyB1c2FnZS5cbiAgICAvKipcbiAgICAgKiBJbnZva2VzIHRoZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqLCB7QGxpbmsgQ09NUEFSSVNPTi5lcXVpdmFsZW50IH0gYW5kIHtAbGluayBDT01QQVJJU09OLmludmVydCB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy5lcXVpdmFsZW50LCB0aGlzLmVxdWFsaXR5UGVybWl0dGVkLCB0aGlzLmludmVydCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgQ09NUEFSSVNPTiB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgQ09NUEFSSVNPTi5lcXVpdmFsZW50IH0sIHtAbGluayBDT01QQVJJU09OLmVxdWFsaXR5UGVybWl0dGVkIH0gYW5kIHtAbGluayBDT01QQVJJU09OLmludmVydCB9IHVzZWQgYnkge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50ICAgICAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS5cbiAgICAgKiBAcGFyYW0gZXF1YWxpdHlQZXJtaXR0ZWQgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrIH0uXG4gICAgICogQHBhcmFtIGludmVydCAgICAgICAgICAgIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVjayB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZXF1aXZhbGVudCA9IGVxdWl2YWxlbnQ7XG4gICAgICAgIHRoaXMuZXF1YWxpdHlQZXJtaXR0ZWQgPSBlcXVhbGl0eVBlcm1pdHRlZDtcbiAgICAgICAgdGhpcy5pbnZlcnQgPSBpbnZlcnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ09NUEFSSVNPTiB9IGZyb20gXCIuLi9DT01QQVJJU09OXCI7XG4vKiogU2VlIHtAbGluayBDT01QQVJJU09OIH0uICovXG5leHBvcnQgY2xhc3MgR1JFQVRFUiBleHRlbmRzIENPTVBBUklTT04ge1xuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUFJFIH0uICovXG4gICAgc3RhdGljIFBSRShlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLlBSRShlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUE9TVCB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uUE9TVChlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uSU5WQVJJQU5UIH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLklOVkFSSUFOVChlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uY29uc3RydWN0b3IgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihlcXVpdmFsZW50KSB7XG4gICAgICAgIHN1cGVyKGVxdWl2YWxlbnQsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXF1aXZhbGVudCA9IGVxdWl2YWxlbnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ09NUEFSSVNPTiB9IGZyb20gXCIuLi9DT01QQVJJU09OXCI7XG4vKiogU2VlIHtAbGluayBDT01QQVJJU09OIH0uICovXG5leHBvcnQgY2xhc3MgR1JFQVRFUl9PUl9FUVVBTCBleHRlbmRzIENPTVBBUklTT04ge1xuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUFJFIH0uICovXG4gICAgc3RhdGljIFBSRShlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLlBSRShlcXVpdmFsZW50LCB0cnVlLCBmYWxzZSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QT1NUIH0uICovXG4gICAgc3RhdGljIFBPU1QoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QT1NUKGVxdWl2YWxlbnQsIHRydWUsIGZhbHNlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLklOVkFSSUFOVCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5JTlZBUklBTlQoZXF1aXZhbGVudCwgdHJ1ZSwgZmFsc2UsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uY29uc3RydWN0b3IgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihlcXVpdmFsZW50KSB7XG4gICAgICAgIHN1cGVyKGVxdWl2YWxlbnQsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lcXVpdmFsZW50ID0gZXF1aXZhbGVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDT01QQVJJU09OIH0gZnJvbSBcIi4uL0NPTVBBUklTT05cIjtcbi8qKiBTZWUge0BsaW5rIENPTVBBUklTT04gfS4gKi9cbmV4cG9ydCBjbGFzcyBMRVNTIGV4dGVuZHMgQ09NUEFSSVNPTiB7XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QUkUgfS4gKi9cbiAgICBzdGF0aWMgUFJFKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uUFJFKGVxdWl2YWxlbnQsIGZhbHNlLCB0cnVlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBPU1QgfS4gKi9cbiAgICBzdGF0aWMgUE9TVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLlBPU1QoZXF1aXZhbGVudCwgZmFsc2UsIHRydWUsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uSU5WQVJJQU5UIH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLklOVkFSSUFOVChlcXVpdmFsZW50LCBmYWxzZSwgdHJ1ZSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jb25zdHJ1Y3RvciB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGVxdWl2YWxlbnQpIHtcbiAgICAgICAgc3VwZXIoZXF1aXZhbGVudCwgZmFsc2UsIHRydWUpO1xuICAgICAgICB0aGlzLmVxdWl2YWxlbnQgPSBlcXVpdmFsZW50O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENPTVBBUklTT04gfSBmcm9tIFwiLi4vQ09NUEFSSVNPTlwiO1xuLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTiB9LiAqL1xuZXhwb3J0IGNsYXNzIExFU1NfT1JfRVFVQUwgZXh0ZW5kcyBDT01QQVJJU09OIHtcbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBSRSB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QUkUoZXF1aXZhbGVudCwgdHJ1ZSwgdHJ1ZSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QT1NUIH0uICovXG4gICAgc3RhdGljIFBPU1QoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QT1NUKGVxdWl2YWxlbnQsIHRydWUsIHRydWUsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uSU5WQVJJQU5UIH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLklOVkFSSUFOVChlcXVpdmFsZW50LCB0cnVlLCB0cnVlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLmNvbnN0cnVjdG9yIH0uICovXG4gICAgY29uc3RydWN0b3IoZXF1aXZhbGVudCkge1xuICAgICAgICBzdXBlcihlcXVpdmFsZW50LCB0cnVlLCB0cnVlKTtcbiAgICAgICAgdGhpcy5lcXVpdmFsZW50ID0gZXF1aXZhbGVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdHdvIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgZXF1YWwuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBFUSBleHRlbmRzIERCQyB7XG4gICAgLy8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBlcXVhbCB0byB0aGUgc3BlY2lmaWVkICoqZXF1aXZhbGVudCoqLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRoYXQgaGFzIHRvIGJlIGVxdWFsIHRvIGl0J3MgcG9zc2libGUgKiplcXVpdmFsZW50KiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudFx0VGhlIHtAbGluayBvYmplY3QgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyB0byBiZSBlcXVhbCB0byBpbiBvcmRlciBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0XHRmdWxmaWxsZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlICoqZXF1aXZhbGVudCoqIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyLCBvdGhlcndpc2UgRkFMU0UuICovXG4gICAgc3RhdGljIGNoZWNrQWxnb3JpdGhtKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIHRvQ2hlY2ssIGVxdWl2YWxlbnQsIGludmVydCkge1xuICAgICAgICBpZiAoIWludmVydCAmJiBlcXVpdmFsZW50ICE9PSB0b0NoZWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGludmVydCAmJiBlcXVpdmFsZW50ID09PSB0b0NoZWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIG11c3Qgbm90IHRvIGJlIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUoXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBjaGVjayBmb3IgVU5ERUZJTkVEIGFuZCBOVUxMLlxuICAgIGVxdWl2YWxlbnQsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gRVEuY2hlY2tBbGdvcml0aG0odmFsdWUsIGVxdWl2YWxlbnQsIGludmVydCk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXF1aXZhbGVudCwgaW52ZXJ0KTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgRVEoZXF1aXZhbGVudCwgaW52ZXJ0KV0sIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy9cbiAgICAvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxuICAgIC8vXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiosIHtAbGluayBFUS5lcXVpdmFsZW50IH0gYW5kIHtAbGluayBFUS5pbnZlcnQgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGNoZWNrIGFnYWluc3QgTlVMTCAmIFVOREVGSU5FRC5cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmVxdWl2YWxlbnQsIHRoaXMuaW52ZXJ0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBFUSB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgRVEuZXF1aXZhbGVudCB9IHVzZWQgYnkge0BsaW5rIEVRLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudCBTZWUge0BsaW5rIEVRLmNoZWNrIH0uICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBiZSBhYmxlIHRvIG1hdGNoIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmVxdWl2YWxlbnQgPSBlcXVpdmFsZW50O1xuICAgICAgICB0aGlzLmludmVydCA9IGludmVydDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBFUSB9IGZyb20gXCIuLi9FUVwiO1xuLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTiB9LiAqL1xuZXhwb3J0IGNsYXNzIERJRkZFUkVOVCBleHRlbmRzIEVRIHtcbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBSRSB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXF1aXZhbGVudCwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gRVEuUFJFKGVxdWl2YWxlbnQsIHRydWUsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUE9TVCB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKGVxdWl2YWxlbnQsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIEVRLlBPU1QoZXF1aXZhbGVudCwgdHJ1ZSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5JTlZBUklBTlQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKGVxdWl2YWxlbnQsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIEVRLklOVkFSSUFOVChlcXVpdmFsZW50LCB0cnVlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLmNvbnN0cnVjdG9yIH0uICovXG4gICAgY29uc3RydWN0b3IoZXF1aXZhbGVudCkge1xuICAgICAgICBzdXBlcihlcXVpdmFsZW50LCB0cnVlKTtcbiAgICAgICAgdGhpcy5lcXVpdmFsZW50ID0gZXF1aXZhbGVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdGhlIGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgYW4gaW5zdGFuY2Ugb2YgYSBjZXJ0YWluIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogU2FsdmF0b3JlIENhbGxhcmkgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgSU5TVEFOQ0UgZXh0ZW5kcyBEQkMge1xuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgY29tcGxpZXMgdG8gdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrXHRUaGUgdmFsdWUgdGhhdCBoYXMgY29tcGx5IHRvIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlXHRUaGUge0BsaW5rIFJlZ0V4cCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIGNvbXBseSB0byBpbiBvcmRlciBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0ZnVsZmlsbGVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgb2YgdGhlIHNwZWNpZmllZCAqKnR5cGUqKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgcmVmZXJlbmNlKSB7XG4gICAgICAgIGlmICghKHRvQ2hlY2sgaW5zdGFuY2VvZiByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7cmVmZXJlbmNlfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHt0eXBlb2YgdG9DaGVja31cImA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUFJFKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICByZWZlcmVuY2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXG4gICAgc3RhdGljIFBPU1QoXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBJbiBvcmRlciB0byBwZXJmb3JtIGFuIFwiaW5zdGFuY2VvZlwiIGNoZWNrLlxuICAgIHJlZmVyZW5jZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICByZWZlcmVuY2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IElOU1RBTkNFKHJlZmVyZW5jZSldLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cbiAgICAvL1xuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgcmV0dXJuIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMucmVmZXJlbmNlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBJTlNUQU5DRSB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgSU5TVEFOQ0UucmVmZXJlbmNlIH0gdXNlZCBieSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2sgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWZlcmVuY2UgU2VlIHtAbGluayBJTlNUQU5DRS5jaGVjayB9LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIGNvbnN0cnVjdG9yKHJlZmVyZW5jZSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnJlZmVyZW5jZSA9IHJlZmVyZW5jZTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IHByb3ZpZGluZyB7QGxpbmsgUkVHRVggfS1jb250cmFjdHMgYW5kIHN0YW5kYXJkIHtAbGluayBSZWdFeHAgfSBmb3IgY29tbW9uIHVzZSBjYXNlcyBpbiB7QGxpbmsgUkVHRVguc3RkRXhwIH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBSRUdFWCBleHRlbmRzIERCQyB7XG4gICAgLy8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBjb21wbGllcyB0byB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRoYXQgaGFzIGNvbXBseSB0byB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb25cdFRoZSB7QGxpbmsgUmVnRXhwIH0gdGhlIG9uZSAqKnRvQ2hlY2sqKiBoYXMgY29tcGx5IHRvIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZVxuICAgICAqIFx0XHRcdFx0XHRcdGZ1bGZpbGxlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGNvbXBsaWVzIHdpdGggdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuICAgIHN0YXRpYyBjaGVja0FsZ29yaXRobSh0b0NoZWNrLCBleHByZXNzaW9uKSB7XG4gICAgICAgIGlmICghZXhwcmVzc2lvbi50ZXN0KHRvQ2hlY2spKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byBjb21wbHkgdG8gcmVndWxhciBleHByZXNzaW9uIFwiJHtleHByZXNzaW9ufVwiYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXhwcmVzc2lvbiwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFJFR0VYLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBleHByZXNzaW9uKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXG4gICAgc3RhdGljIFBPU1QoZXhwcmVzc2lvbiwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXhwcmVzc2lvbik7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChleHByZXNzaW9uLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBSRUdFWChleHByZXNzaW9uKV0sIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy9cbiAgICAvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxuICAgIC8vXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHtAbGluayBSRUdFWC5lcXVpdmFsZW50IH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtfS4gKi9cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmV4cHJlc3Npb24pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoaXMge0BsaW5rIFJFR0VYIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0gdXNlZCBieSB7QGxpbmsgUkVHRVguY2hlY2sgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHByZXNzaW9uIFNlZSB7QGxpbmsgUkVHRVguY2hlY2sgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihleHByZXNzaW9uKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvbiA9IGV4cHJlc3Npb247XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBJbi1NZXRob2QgY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVja1x0XHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtfS5cbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobX0uXG4gICAgICovXG4gICAgc3RhdGljIGNoZWNrKHRvQ2hlY2ssIGV4cHJlc3Npb24pIHtcbiAgICAgICAgY29uc3QgY2hlY2tSZXN1bHQgPSBSRUdFWC5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCBleHByZXNzaW9uKTtcbiAgICAgICAgaWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoY2hlY2tSZXN1bHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqIFN0b3JlcyBvZnRlbiB1c2VkIHtAbGluayBSZWdFeHAgfXMuICovXG5SRUdFWC5zdGRFeHAgPSB7XG4gICAgaHRtbEF0dHJpYnV0ZU5hbWU6IC9eW2EtekEtWl86XVthLXpBLVowLTlfLjotXSokLyxcbiAgICBlTWFpbDogL15bYS16QS1aMC05Ll8lKy1dK0BbYS16QS1aMC05Li1dK1xcLlthLXpBLVpdezIsfSQvaSxcbiAgICBwcm9wZXJ0eTogL15bJF9BLVphLXpdWyRfQS1aYS16MC05XSokLyxcbiAgICB1cmw6IC9eKD86KD86aHR0cDp8aHR0cHM/fGZ0cCk6XFwvXFwvKT8oPzpcXFMrKD86OlxcUyopP0ApPyg/OmxvY2FsaG9zdHwoPzpbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT9cXC4pK1thLXpBLVpdezIsfSkoPzo6XFxkezIsNX0pPyg/OlxcLyg/OltcXHdcXC1cXC5dKlxcLykqW1xcd1xcLVxcLl0rKD86XFw/XFxTKik/KD86I1xcUyopPyk/JC9pLFxuICAgIGtleVBhdGg6IC9eKFthLXpBLVpfJF1bYS16QS1aMC05XyRdKlxcLikqW2EtekEtWl8kXVthLXpBLVowLTlfJF0qJC8sXG4gICAgZGF0ZTogL15cXGR7MSw0fVsuXFwvLV1cXGR7MSwyfVsuXFwvLV1cXGR7MSw0fSQvaSxcbiAgICBkYXRlRm9ybWF0OiAvXigoRHsxLDJ9Wy4vLV1NezEsMn1bLi8tXVl7MSw0fSl8KE17MSwyfVsuLy1dRHsxLDJ9Wy4vLV1ZezEsNH0pfFl7MSw0fVsuLy1dRHsxLDJ9Wy4vLV1NezEsMn18KFl7MSw0fVsuLy1dTXsxLDJ9Wy4vLV1EezEsMn0pKSQvaSxcbiAgICBjc3NTZWxlY3RvcjogL14oPzpcXCp8I1tcXHctXSt8XFwuW1xcdy1dK3woPzpbXFx3LV0rfFxcKikoPzo6KD86W1xcdy1dKyg/OlxcKFtcXHctXStcXCkpPykrKT8oPzpcXFsoPzpbXFx3LV0rKD86KD86PXx+PXxcXHw9fFxcKj18XFwkPXxcXF49KVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqKT8pP1xcXSkrfFxcW1xccypbXFx3LV0rXFxzKj1cXHMqKD86XCJbXlwiXSpcInwnW14nXSonfFtcXHctXSspXFxzKlxcXSkoPzosXFxzKig/OlxcKnwjW1xcdy1dK3xcXC5bXFx3LV0rfCg/OltcXHctXSt8XFwqKSg/OjooPzpbXFx3LV0rKD86XFwoW1xcdy1dK1xcKSk/KSspPyg/OlxcWyg/OltcXHctXSsoPzooPzo9fH49fFxcfD18XFwqPXxcXCQ9fFxcXj0pXFxzKig/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXFx3LV0rKVxccyopPyk/XFxdKSt8XFxbXFxzKltcXHctXStcXHMqPVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqXFxdKSkqJC8sXG59O1xuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgb2YgY2VydGFpbiB7QGxpbmsgVFlQRS50eXBlIH0uXG4gKlxuICogQHJlbWFya3NcbiAqIEF1dGhvcjogXHRcdFNhbHZhdG9yZSBDYWxsYXJpIChDYWxsYXJpQFdhWENvZGUubmV0KSAvIDIwMjVcbiAqIE1haW50YWluZXI6XHRTYWx2YXRvcmUgQ2FsbGFyaSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBUWVBFIGV4dGVuZHMgREJDIHtcbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIG9mIHRoZSAqKnR5cGUqKiBzcGVjaWZpZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVja1x0VGhlIHtAbGluayBPYmplY3QgfSB3aGljaCdzICoqdHlwZSoqIHRvIGNoZWNrLlxuICAgICAqIEBwYXJhbSB0eXBlXHRcdFRoZSB0eXBlIHRoZSB7QGxpbmsgb2JqZWN0fSAqKnRvQ2hlY2sqKiBoYXMgdG8gYmUgb2YuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBvZiB0aGUgc3BlY2lmaWVkICoqdHlwZSoqLCBvdGhlcndpc2UgRkFMU0UuICovXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgZm9yIGR5bmFtaWMgdHlwZSBjaGVja2luZyBvZiBhbHNvIFVOREVGSU5FRC5cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdHlwZSkge1xuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL3VzZVZhbGlkVHlwZW9mOiBOZWNlc3NhcnlcbiAgICAgICAgaWYgKHR5cGVvZiB0b0NoZWNrICE9PSB0eXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBvZiB0eXBlIFwiJHt0eXBlfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHt0eXBlb2YgdG9DaGVja31cImA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHR5cGVcdFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQUkUodHlwZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFRZUEUuY2hlY2tBbGdvcml0aG0odmFsdWUsIHR5cGUpO1xuICAgICAgICB9LCBkYmMsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHR5cGVcdFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKHR5cGUsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgdHlwZSk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKHR5cGUsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IFRZUEUodHlwZSldLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cbiAgICAvL1xuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSB7QGxpbmsgVFlQRS50eXBlIH0gLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG19LiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIGNoZWNrKHRvQ2hlY2spIHtcbiAgICAgICAgcmV0dXJuIFRZUEUuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy50eXBlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBUWVBFIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBUWVBFLnR5cGUgfSB1c2VkIGJ5IHtAbGluayBUWVBFLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHlwZSBTZWUge0BsaW5rIFRZUEUuY2hlY2sgfS4gKi9cbiAgICBjb25zdHJ1Y3Rvcih0eXBlKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgfVxufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJ2YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcbn07XG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XG59O1xudmFyIF9fcGFyYW0gPSAodGhpcyAmJiB0aGlzLl9fcGFyYW0pIHx8IGZ1bmN0aW9uIChwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cbn07XG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi9EQkNcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcIi4vREJDL1JFR0VYXCI7XG5pbXBvcnQgeyBFUSB9IGZyb20gXCIuL0RCQy9FUVwiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCIuL0RCQy9UWVBFXCI7XG5pbXBvcnQgeyBBRSB9IGZyb20gXCIuL0RCQy9BRVwiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwiLi9EQkMvSU5TVEFOQ0VcIjtcbmltcG9ydCB7IEdSRUFURVIgfSBmcm9tIFwiLi9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSXCI7XG5pbXBvcnQgeyBHUkVBVEVSX09SX0VRVUFMIH0gZnJvbSBcIi4vREJDL0NPTVBBUklTT04vR1JFQVRFUl9PUl9FUVVBTFwiO1xuaW1wb3J0IHsgTEVTUyB9IGZyb20gXCIuL0RCQy9DT01QQVJJU09OL0xFU1NcIjtcbmltcG9ydCB7IExFU1NfT1JfRVFVQUwgfSBmcm9tIFwiLi9EQkMvQ09NUEFSSVNPTi9MRVNTX09SX0VRVUFMXCI7XG5pbXBvcnQgeyBESUZGRVJFTlQgfSBmcm9tIFwiLi9EQkMvRVEvRElGRkVSRU5UXCI7XG4vKiogRGVtb25zdHJhdGl2ZSB1c2Ugb2YgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IERlY29yYXRvcnMgKi9cbmV4cG9ydCBjbGFzcyBEZW1vIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLy8gI3JlZ2lvbiBDaGVjayBQcm9wZXJ0eSBEZWNvcmF0b3JcbiAgICAgICAgdGhpcy50ZXN0UHJvcGVydHkgPSBcImFcIjtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBDb21wYXJpc29uXG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgUHJvcGVydHkgRGVjb3JhdG9yXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBQYXJhbWV0ZXIuICYgUmV0dXJudmFsdWUgRGVjb3JhdG9yXG4gICAgdGVzdFBhcmFtdmFsdWVBbmRSZXR1cm52YWx1ZShhKSB7XG4gICAgICAgIHJldHVybiBgeHh4eCR7YX1gO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFBhcmFtZXRlci4gJiBSZXR1cm52YWx1ZSBEZWNvcmF0b3JcbiAgICAvLyAjcmVnaW9uIENoZWNrIFJldHVybnZhbHVlIERlY29yYXRvclxuICAgIHRlc3RSZXR1cm52YWx1ZShhKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFJldHVybnZhbHVlIERlY29yYXRvclxuICAgIC8vICNyZWdpb24gQ2hlY2sgRVEtREJDICYgUGF0aCB0byBwcm9wZXJ0eSBvZiBQYXJhbWV0ZXItdmFsdWVcbiAgICB0ZXN0RVFBbmRQYXRoKG8pIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgRVEtREJDICYgUGF0aCB0byBwcm9wZXJ0eSBvZiBQYXJhbWV0ZXItdmFsdWVcbiAgICAvLyAjcmVnaW9uIENoZWNrIEVRLURCQyAmIFBhdGggdG8gcHJvcGVydHkgb2YgUGFyYW1ldGVyLXZhbHVlIHdpdGggSW52ZXJzaW9uXG4gICAgdGVzdEVRQW5kUGF0aFdpdGhJbnZlcnNpb24obykgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBFUS1EQkMgJiBQYXRoIHRvIHByb3BlcnR5IG9mIFBhcmFtZXRlci12YWx1ZSB3aXRoIEludmVyc2lvblxuICAgIC8vICNyZWdpb24gQ2hlY2sgVFlQRVxuICAgIHRlc3RUWVBFKG8pIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgVFlQRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgQUVcbiAgICB0ZXN0QUUoeCkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBBRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgUkVHRVggd2l0aCBBRVxuICAgIHRlc3RSRUdFWFdpdGhBRSh4KSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFJFR0VYIHdpdGggQUVcbiAgICAvLyAjcmVnaW9uIENoZWNrIElOU1RBTkNFXG4gICAgdGVzdElOU1RBTkNFKGNhbmRpZGF0ZSkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBJTlNUQU5DRVxuICAgIC8vICNyZWdpb24gQ2hlY2sgQUUgUmFuZ2VcbiAgICB0ZXN0QUVSYW5nZSh4KSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIEFFIFJhbmdlXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBBRSBJbmRleFxuICAgIHRlc3RBRUluZGV4KHgpIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgQUUgSW5kZXhcbiAgICAvLyAjcmVnaW9uIENoZWNrIENvbXBhcmlzb25cbiAgICB0ZXN0R1JFQVRFUihpbnB1dCkgeyB9XG4gICAgdGVzdEdSRUFURVJfT1JfRVFVQUwoaW5wdXQpIHsgfVxuICAgIHRlc3RMRVNTKGlucHV0KSB7IH1cbiAgICB0ZXN0TEVTU19PUl9FUVVBTChpbnB1dCkgeyB9XG4gICAgdGVzdERJRkZFUkVOVChpbnB1dCkgeyB9XG59XG5fX2RlY29yYXRlKFtcbiAgICBSRUdFWC5JTlZBUklBTlQoL15hJC8pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBPYmplY3QpXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0UHJvcGVydHlcIiwgdm9pZCAwKTtcbl9fZGVjb3JhdGUoW1xuICAgIFJFR0VYLlBPU1QoL154eHh4LiokLyksXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIFJFR0VYLlBSRSgvaG9sbGEqL2cpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbU3RyaW5nXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIFN0cmluZylcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RQYXJhbXZhbHVlQW5kUmV0dXJudmFsdWVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBSRUdFWC5QT1NUKC9eeHh4eC4qJC8pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtTdHJpbmddKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgU3RyaW5nKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdFJldHVybnZhbHVlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEVRLlBSRShcIlNFTEVDVFwiLCBmYWxzZSwgXCJ0YWdOYW1lXCIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbSFRNTEVsZW1lbnRdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdEVRQW5kUGF0aFwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBFUS5QUkUoXCJTRUxFQ1RcIiwgdHJ1ZSwgXCJ0YWdOYW1lXCIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbSFRNTEVsZW1lbnRdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdEVRQW5kUGF0aFdpdGhJbnZlcnNpb25cIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgVFlQRS5QUkUoXCJzdHJpbmdcIikpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtPYmplY3RdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdFRZUEVcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgQUUuUFJFKFtuZXcgVFlQRShcInN0cmluZ1wiKV0pKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbQXJyYXldKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdEFFXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEFFLlBSRShuZXcgUkVHRVgoL14oP2k6KE5PVyl8KFsrLV1cXGQrW2RteV0pKSQvaSkpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbQXJyYXldKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdFJFR0VYV2l0aEFFXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVGVzdFxuICAgICxcbiAgICBfX3BhcmFtKDAsIElOU1RBTkNFLlBSRShEYXRlKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW09iamVjdF0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0SU5TVEFOQ0VcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgQUUuUFJFKFtuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eYWJjJC8pXSwgMSwgMikpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtBcnJheV0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0QUVSYW5nZVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBBRS5QUkUoW25ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoL15hYmMkLyldLCAxKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RBRUluZGV4XCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEdSRUFURVIuUFJFKDIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbTnVtYmVyXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RHUkVBVEVSXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEdSRUFURVJfT1JfRVFVQUwuUFJFKDIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbTnVtYmVyXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RHUkVBVEVSX09SX0VRVUFMXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIExFU1MuUFJFKDIwKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW051bWJlcl0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0TEVTU1wiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBMRVNTX09SX0VRVUFMLlBSRSgyMCkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtOdW1iZXJdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdExFU1NfT1JfRVFVQUxcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgRElGRkVSRU5ULlBSRSgyMCkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtOdW1iZXJdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdERJRkZFUkVOVFwiLCBudWxsKTtcbmNvbnN0IGRlbW8gPSBuZXcgRGVtbygpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RQcm9wZXJ0eSA9IFwiYWJkXCI7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5WQVJJQU5UIEluZnJpbmdlbWVudFwiLCBcIk9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0UHJvcGVydHkgPSBcImFcIjtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJJTlZBUklBTlQgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbmRlbW8udGVzdFBhcmFtdmFsdWVBbmRSZXR1cm52YWx1ZShcImhvbGxhXCIpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIlBBUkFNRVRFUi0gJiBSRVRVUk5WQUxVRSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RQYXJhbXZhbHVlQW5kUmV0dXJudmFsdWUoXCJ5eXl5XCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlBBUkFNRVRFUi0gJiBSRVRVUk5WQUxVRSBJbmZyaW5nZW1lbnRcIiwgXCJPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdFJldHVybnZhbHVlKFwieHh4eFwiKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJSRVRVUk5WQUxVRSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RSZXR1cm52YWx1ZShcInl5eXlcIik7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiUkVUVVJOVkFMVUUgSW5mcmluZ2VtZW50XCIsIFwiT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RFUUFuZFBhdGgoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiRVEgd2l0aCBQYXRoIEluZnJpbmdlbWVudCBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RFUUFuZFBhdGhXaXRoSW52ZXJzaW9uKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIikpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkVRIHdpdGggUGF0aCBhbmQgSW52ZXJzaW9uIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdFRZUEUoXCJ4XCIpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIlRZUEUgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0VFlQRSgwKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJUWVBFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdEFFKFtcIjExXCIsIFwiMTBcIiwgXCJiXCJdKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJBRSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RBRShbXCIxMVwiLCAxMSwgXCJiXCJdKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJBRSBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RSRUdFWFdpdGhBRShbXCIrMWRcIiwgXCJOT1dcIiwgXCItMTB5XCJdKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJSRUdFWCB3aXRoIEFFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdFJFR0VYV2l0aEFFKFtcIisxZFwiLCBcIis1ZFwiLCBcIi14MTB5XCJdKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJSRUdFWCB3aXRoIEFFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdElOU1RBTkNFKG5ldyBEYXRlKCkpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIklOU1RBTkNFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdElOU1RBTkNFKGRlbW8pO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOU1RBTkNFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdEFFUmFuZ2UoWzExLCBcImFiY1wiLCBcImFiY1wiXSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiQUUgUmFuZ2UgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0QUVSYW5nZShbMTEsIFwiYWJjXCIsIC9hL2ddKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJBRSBSYW5nZSBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RBRUluZGV4KFsxMSwgXCJhYmNcIiwgXCJhYmNcIl0pO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIkFFIEluZGV4IE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEFFSW5kZXgoW1wiMTFcIiwgMTIsIFwiL2EvZ1wiXSk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiQUUgSW5kZXggSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0R1JFQVRFUigxMSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiR1JFQVRFUiBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RHUkVBVEVSKDIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkdSRUFURVIgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0R1JFQVRFUl9PUl9FUVVBTCgyKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJHUkVBVEVSX09SX0VRVUFMIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEdSRUFURVJfT1JfRVFVQUwoMSk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiR1JFQVRFUl9PUl9FUVVBTCBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RMRVNTKDEwKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJMRVNTIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdExFU1MoMjApO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkxFU1MgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0TEVTU19PUl9FUVVBTCgyMCk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiTEVTUyBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RMRVNTX09SX0VRVUFMKDIxKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJMRVNTX09SX0VRVUFMIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdERJRkZFUkVOVCgyMSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiRElGRkVSRU5UIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdERJRkZFUkVOVCgyMCk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiRElGRkVSRU5UIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbi8vICNyZWdpb24gSW5hY3Rpdml0eSBDaGVja3NcbndpbmRvdy5XYVhDb2RlLkRCQy5leGVjdXRpb25TZXR0aW5ncy5jaGVja1ByZWNvbmRpdGlvbnMgPSBmYWxzZTtcbnRyeSB7XG4gICAgZGVtby50ZXN0TEVTU19PUl9FUVVBTCgyMSk7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJJTkFDVElWRSBQUkVDT05ESVRJT05TIE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIFBSRUNPTkRJVElPTlMgRkFJTEVEXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxud2luZG93LldhWENvZGUuREJDLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrUG9zdGNvbmRpdGlvbnMgPSBmYWxzZTtcbnRyeSB7XG4gICAgZGVtby50ZXN0UmV0dXJudmFsdWUoXCJxcXFxcVwiKTtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIFBPU1RDT05ESVRJT05TIE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIFBPU1RDT05ESVRJT05TIEZBSUxFRFwiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbndpbmRvdy5XYVhDb2RlLkRCQy5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHMgPSBmYWxzZTtcbnRyeSB7XG4gICAgZGVtby50ZXN0UHJvcGVydHkgPSBcImJcIjtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIElOVkFSSUFOVFMgT0tcIik7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5BQ1RJVkUgSU5WQVJJQU5UUyBGQUlMRURcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG4vLyAjZW5kcmVnaW9uIEluYWN0aXZpdHkgQ2hlY2tzXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=