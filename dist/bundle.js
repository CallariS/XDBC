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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQSxnR0FBZ0csY0FBYztBQUM5RyxzQ0FBc0MsMkJBQTJCLGtCQUFrQiwwQkFBMEI7QUFDN0c7QUFDQSxtRUFBbUUseUJBQXlCO0FBQzVGO0FBQ0EsMkJBQTJCLGVBQWU7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsMkJBQTJCO0FBQzNFO0FBQ0EsaUZBQWlGLHlCQUF5QjtBQUMxRztBQUNBO0FBQ0EsNEJBQTRCLGVBQWU7QUFDM0M7QUFDQSwrQkFBK0IsMkJBQTJCO0FBQzFEO0FBQ0EscUJBQXFCLDJCQUEyQjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsV0FBVztBQUN4QztBQUNBLG1CQUFtQix5QkFBeUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLDBCQUEwQjtBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUIsMEJBQTBCO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBaUQsNkJBQTZCLDBCQUEwQixjQUFjO0FBQ3RIO0FBQ0E7QUFDQSwyQkFBMkIsZUFBZTtBQUMxQyw2QkFBNkIsZUFBZTtBQUM1QztBQUNBLHdDQUF3QyxTQUFTLEdBQUcscUJBQXFCLEtBQUssUUFBUSxFQUFFLHVDQUF1QyxZQUFZLHlHQUF5Ryx3QkFBd0IsUUFBUSxJQUFJLFFBQVE7QUFDaFM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QywyQkFBMkIsMEJBQTBCLGNBQWM7QUFDaEg7QUFDQTtBQUNBLDJCQUEyQixlQUFlO0FBQzFDLDJCQUEyQixlQUFlO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0RBQXNELE1BQU0sV0FBVyxZQUFZLEVBQUUsdUZBQXVGLG1EQUFtRCxRQUFRO0FBQ3ZPO0FBQ0E7QUFDQSx5Q0FBeUMsMkJBQTJCLDBCQUEwQixjQUFjO0FBQzVHO0FBQ0E7QUFDQSx5QkFBeUIsZUFBZTtBQUN4QztBQUNBLHFDQUFxQyxlQUFlO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBLG9EQUFvRCxJQUFJLEdBQUcsOEJBQThCLEtBQUssR0FBRyxjQUFjLE1BQU0sMkNBQTJDLFFBQVE7QUFDeEs7QUFDQTtBQUNBLHlEQUF5RCwyQkFBMkIsMEJBQTBCLGNBQWM7QUFDNUg7QUFDQTtBQUNBLDJCQUEyQixlQUFlO0FBQzFDLDJCQUEyQixlQUFlO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbURBQW1ELE1BQU0sMkNBQTJDLFFBQVE7QUFDNUc7QUFDQTtBQUNBLHdCQUF3QixZQUFZLGdCQUFnQixnQ0FBZ0M7QUFDcEYsMEdBQTBHLFdBQVc7QUFDckg7QUFDQSx5Q0FBeUMsZ0NBQWdDO0FBQ3pFLHNDQUFzQyw2QkFBNkI7QUFDbkUseUNBQXlDLDJDQUEyQztBQUNwRjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLGVBQWU7QUFDNUM7QUFDQSxpQ0FBaUMsZUFBZTtBQUNoRCxzQ0FBc0MsY0FBYztBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0JBQStCLGNBQWM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2RUFBNkU7QUFDN0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEVBQTBFO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkRBQTJELHVCQUF1QjtBQUNsRjtBQUNBO0FBQ0E7QUFDQSxRQUFRLGNBQWM7QUFDdEI7QUFDQTtBQUNBLHdCQUF3QixjQUFjLGtDQUFrQyxlQUFlO0FBQ3ZGO0FBQ0EsMkJBQTJCLGVBQWU7QUFDMUM7QUFDQSxxQ0FBcUMsUUFBUTtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQ0FBa0MsY0FBYyxZQUFZLFdBQVc7QUFDdkU7QUFDQSxvQkFBb0IsZUFBZTtBQUNuQyw0QkFBNEIsY0FBYyxzQkFBc0IsV0FBVztBQUMzRTtBQUNBLDJCQUEyQixXQUFXO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDelc2QjtBQUM3QjtBQUNBLE1BQU0sWUFBWSxrQ0FBa0MsY0FBYztBQUNsRSxZQUFZLGNBQWM7QUFDMUI7QUFDQTtBQUNBO0FBQ08saUJBQWlCLHFDQUFHO0FBQzNCO0FBQ0E7QUFDQSw2Q0FBNkMscUJBQXFCO0FBQ2xFO0FBQ0E7QUFDQSw4QkFBOEIsNENBQTRDO0FBQzFFLHVDQUF1QyxvQkFBb0I7QUFDM0Q7QUFDQSx5RUFBeUUsZUFBZTtBQUN4Rix1QkFBdUIsYUFBYSx3Q0FBd0MsY0FBYztBQUMxRjtBQUNBO0FBQ0Esb0NBQW9DLGFBQWE7QUFDakQsMEZBQTBGLGNBQWM7QUFDeEcsbUVBQW1FLGFBQWE7QUFDaEY7QUFDQTtBQUNBLHdEQUF3RCxjQUFjO0FBQ3RFLHlDQUF5QyxhQUFhO0FBQ3REO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRSxNQUFNLGdCQUFnQixhQUFhLEtBQUssT0FBTztBQUNsSDtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRDQUE0QyxZQUFZO0FBQ3hEO0FBQ0E7QUFDQSw4REFBOEQsRUFBRSxJQUFJLE9BQU87QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELDBCQUEwQjtBQUMxRTtBQUNBLGdGQUFnRixhQUFhO0FBQzdGO0FBQ0EsZUFBZSxjQUFjLHVDQUF1Qyw0Q0FBNEM7QUFDaEg7QUFDQTtBQUNBLHlFQUF5RSxjQUFjO0FBQ3ZGO0FBQ0E7QUFDQSxrREFBa0QsNENBQTRDO0FBQzlGO0FBQ0EsZ0NBQWdDLHlCQUF5QjtBQUN6RCxnQ0FBZ0MseUJBQXlCO0FBQ3pELDJCQUEyQiwyQkFBMkI7QUFDdEQsMEJBQTBCLDJCQUEyQjtBQUNyRDtBQUNBLG1CQUFtQixlQUFlLGlCQUFpQiw0Q0FBNEM7QUFDL0Y7QUFDQTtBQUNBLGVBQWUscUNBQUc7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsNkNBQTZDLDBCQUEwQjtBQUN2RTtBQUNBO0FBQ0Esa0RBQWtELDRDQUE0QztBQUM5RjtBQUNBLGdDQUFnQyx5QkFBeUI7QUFDekQsZ0NBQWdDLHlCQUF5QjtBQUN6RCwyQkFBMkIsMkJBQTJCO0FBQ3RELDBCQUEwQiwyQkFBMkI7QUFDckQ7QUFDQSxtQkFBbUIsZUFBZSxpQkFBaUIsNENBQTRDO0FBQy9GO0FBQ0E7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw0Q0FBNEMsMEJBQTBCO0FBQ3RFO0FBQ0E7QUFDQSxrREFBa0QsNENBQTRDO0FBQzlGO0FBQ0EsZ0NBQWdDLHlCQUF5QjtBQUN6RCxnQ0FBZ0MseUJBQXlCO0FBQ3pELDJCQUEyQix3QkFBd0I7QUFDbkQsMEJBQTBCLHdCQUF3QjtBQUNsRDtBQUNBLHFCQUFxQix3QkFBd0I7QUFDN0M7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDBCQUEwQixVQUFVLHNCQUFzQixTQUFTLGdCQUFnQixlQUFlO0FBQ3RILFFBQVEsaUJBQWlCLEdBQUcsaUJBQWlCO0FBQzdDO0FBQ0EsMkJBQTJCLHlCQUF5QjtBQUNwRDtBQUNBLHFCQUFxQix3QkFBd0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsV0FBVyxtQ0FBbUMscUJBQXFCLEdBQUcsaUJBQWlCLEtBQUssa0JBQWtCLFNBQVMsZ0JBQWdCO0FBQzVKO0FBQ0EsOEJBQThCLGdCQUFnQjtBQUM5QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQzVLNkI7QUFDN0I7QUFDQSxNQUFNLFlBQVksbUNBQW1DLGNBQWM7QUFDbkU7QUFDQTtBQUNBO0FBQ08seUJBQXlCLHFDQUFHO0FBQ25DO0FBQ0E7QUFDQSxzQ0FBc0MsZUFBZTtBQUNyRDtBQUNBLGdHQUFnRyxZQUFZO0FBQzVHLDhCQUE4QixlQUFlLDBEQUEwRCxZQUFZO0FBQ25IO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUUsV0FBVztBQUM5RTtBQUNBO0FBQ0EsNkRBQTZELFdBQVc7QUFDeEU7QUFDQTtBQUNBLHVEQUF1RCxXQUFXO0FBQ2xFO0FBQ0E7QUFDQSxpREFBaUQsV0FBVztBQUM1RDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxrQ0FBa0MsMkJBQTJCLFlBQVk7QUFDekg7QUFDQTtBQUNBLGtDQUFrQyxpQ0FBaUM7QUFDbkUscUNBQXFDLGlDQUFpQztBQUN0RSw4QkFBOEIsMkJBQTJCO0FBQ3pELDZCQUE2QiwyQkFBMkI7QUFDeEQ7QUFDQSxxQkFBcUIsMkJBQTJCO0FBQ2hEO0FBQ0EsZUFBZSxxQ0FBRztBQUNsQjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsNkNBQTZDLGtDQUFrQywyQkFBMkIsWUFBWTtBQUN0SDtBQUNBO0FBQ0Esa0NBQWtDLGlDQUFpQztBQUNuRSxxQ0FBcUMsaUNBQWlDO0FBQ3RFLDhCQUE4Qix5QkFBeUI7QUFDdkQsNkJBQTZCLDRCQUE0QjtBQUN6RDtBQUNBLHFCQUFxQiw0QkFBNEI7QUFDakQ7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw0Q0FBNEMsa0NBQWtDLDJCQUEyQixZQUFZO0FBQ3JIO0FBQ0E7QUFDQSxrQ0FBa0MsaUNBQWlDO0FBQ25FLHFDQUFxQyxpQ0FBaUM7QUFDdEUsOEJBQThCLHdCQUF3QjtBQUN0RCw2QkFBNkIsd0JBQXdCO0FBQ3JEO0FBQ0EscUJBQXFCLHdCQUF3QjtBQUM3QztBQUNBLGVBQWUscUNBQUc7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixrQ0FBa0MsZ0NBQWdDLDhCQUE4QixLQUFLLHlCQUF5QjtBQUNsSjtBQUNBLDJCQUEyQixpQ0FBaUM7QUFDNUQ7QUFDQSxxQkFBcUIsZ0NBQWdDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCLG1CQUFtQixtQ0FBbUMsNkJBQTZCLEdBQUcscUNBQXFDLEtBQUssMEJBQTBCLFNBQVMsd0JBQXdCO0FBQ2hOO0FBQ0EscUNBQXFDLHdCQUF3QjtBQUM3RCxxQ0FBcUMsd0JBQXdCO0FBQzdELHFDQUFxQyx3QkFBd0I7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUNsRzJDO0FBQzNDLFNBQVMsa0JBQWtCO0FBQ3BCLHNCQUFzQixtREFBVTtBQUN2QyxhQUFhLHNCQUFzQjtBQUNuQztBQUNBLGVBQWUsbURBQVU7QUFDekI7QUFDQSxhQUFhLHVCQUF1QjtBQUNwQztBQUNBLGVBQWUsbURBQVU7QUFDekI7QUFDQSxhQUFhLDRCQUE0QjtBQUN6QztBQUNBLGVBQWUsbURBQVU7QUFDekI7QUFDQSxhQUFhLDhCQUE4QjtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDcEIyQztBQUMzQyxTQUFTLGtCQUFrQjtBQUNwQiwrQkFBK0IsbURBQVU7QUFDaEQsYUFBYSxzQkFBc0I7QUFDbkM7QUFDQSxlQUFlLG1EQUFVO0FBQ3pCO0FBQ0EsYUFBYSx1QkFBdUI7QUFDcEM7QUFDQSxlQUFlLG1EQUFVO0FBQ3pCO0FBQ0EsYUFBYSw0QkFBNEI7QUFDekM7QUFDQSxlQUFlLG1EQUFVO0FBQ3pCO0FBQ0EsYUFBYSw4QkFBOEI7QUFDM0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQ3BCMkM7QUFDM0MsU0FBUyxrQkFBa0I7QUFDcEIsbUJBQW1CLG1EQUFVO0FBQ3BDLGFBQWEsc0JBQXNCO0FBQ25DO0FBQ0EsZUFBZSxtREFBVTtBQUN6QjtBQUNBLGFBQWEsdUJBQXVCO0FBQ3BDO0FBQ0EsZUFBZSxtREFBVTtBQUN6QjtBQUNBLGFBQWEsNEJBQTRCO0FBQ3pDO0FBQ0EsZUFBZSxtREFBVTtBQUN6QjtBQUNBLGFBQWEsOEJBQThCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUNwQjJDO0FBQzNDLFNBQVMsa0JBQWtCO0FBQ3BCLDRCQUE0QixtREFBVTtBQUM3QyxhQUFhLHNCQUFzQjtBQUNuQztBQUNBLGVBQWUsbURBQVU7QUFDekI7QUFDQSxhQUFhLHVCQUF1QjtBQUNwQztBQUNBLGVBQWUsbURBQVU7QUFDekI7QUFDQSxhQUFhLDRCQUE0QjtBQUN6QztBQUNBLGVBQWUsbURBQVU7QUFDekI7QUFDQSxhQUFhLDhCQUE4QjtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDcEI2QjtBQUM3QjtBQUNBLE1BQU0sWUFBWSxtQkFBbUIsY0FBYztBQUNuRDtBQUNBO0FBQ0E7QUFDTyxpQkFBaUIscUNBQUc7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnR0FBZ0csWUFBWTtBQUM1Ryw4QkFBOEIsZUFBZSwwREFBMEQsWUFBWTtBQUNuSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRCxXQUFXO0FBQzlEO0FBQ0E7QUFDQSxxREFBcUQsV0FBVztBQUNoRTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCwwQkFBMEIsMkJBQTJCLFlBQVk7QUFDakg7QUFDQTtBQUNBLDhCQUE4Qix5QkFBeUI7QUFDdkQsMEJBQTBCLDJCQUEyQjtBQUNyRCx5QkFBeUIsMkJBQTJCO0FBQ3BEO0FBQ0EscUJBQXFCLDJCQUEyQjtBQUNoRDtBQUNBO0FBQ0E7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw2Q0FBNkMsMEJBQTBCLDJCQUEyQixZQUFZO0FBQzlHO0FBQ0E7QUFDQSw4QkFBOEIseUJBQXlCO0FBQ3ZELDBCQUEwQix5QkFBeUI7QUFDbkQseUJBQXlCLDRCQUE0QjtBQUNyRDtBQUNBLHFCQUFxQiw0QkFBNEI7QUFDakQ7QUFDQTtBQUNBO0FBQ0EsZUFBZSxxQ0FBRztBQUNsQjtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsNENBQTRDLDBCQUEwQiwyQkFBMkIsWUFBWTtBQUM3RztBQUNBO0FBQ0EsOEJBQThCLHlCQUF5QjtBQUN2RCwwQkFBMEIsd0JBQXdCO0FBQ2xELHlCQUF5Qix3QkFBd0I7QUFDakQ7QUFDQSxxQkFBcUIsd0JBQXdCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBLGVBQWUscUNBQUc7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsMEJBQTBCLGdDQUFnQyxzQkFBc0IsS0FBSyxpQkFBaUI7QUFDMUg7QUFDQSwyQkFBMkIseUJBQXlCO0FBQ3BEO0FBQ0EscUJBQXFCLHdCQUF3QjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCLFdBQVcsbUNBQW1DLHNCQUFzQixTQUFTLGdCQUFnQjtBQUNsSDtBQUNBLDhCQUE4QixnQkFBZ0I7QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQ25HNkI7QUFDN0I7QUFDQSxNQUFNLFlBQVksc0JBQXNCLGNBQWMscUNBQXFDLDBCQUEwQjtBQUNySDtBQUNBO0FBQ0E7QUFDTyx1QkFBdUIscUNBQUc7QUFDakM7QUFDQSwyREFBMkQsZUFBZTtBQUMxRTtBQUNBLHdEQUF3RCxlQUFlLHlCQUF5QixZQUFZO0FBQzVHLDZCQUE2QixlQUFlLHFEQUFxRCxZQUFZO0FBQzdHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNEQUFzRCxVQUFVLG9CQUFvQixlQUFlO0FBQ25HO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELGdDQUFnQywyQkFBMkIsWUFBWTtBQUN2SDtBQUNBO0FBQ0EsNkJBQTZCLCtCQUErQjtBQUM1RCx3QkFBd0IsMkJBQTJCO0FBQ25ELHVCQUF1QiwyQkFBMkI7QUFDbEQ7QUFDQSxxQkFBcUIsMkJBQTJCO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBLGVBQWUscUNBQUc7QUFDbEI7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLDZDQUE2QyxnQ0FBZ0MsMkJBQTJCLFlBQVk7QUFDcEg7QUFDQTtBQUNBLDZCQUE2QiwrQkFBK0I7QUFDNUQsd0JBQXdCLHlCQUF5QjtBQUNqRCx1QkFBdUIsNEJBQTRCO0FBQ25EO0FBQ0EscUJBQXFCLDRCQUE0QjtBQUNqRDtBQUNBO0FBQ0E7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw0Q0FBNEMsZ0NBQWdDLDJCQUEyQixZQUFZO0FBQ25IO0FBQ0E7QUFDQSw2QkFBNkIsK0JBQStCO0FBQzVELHdCQUF3Qix3QkFBd0I7QUFDaEQsdUJBQXVCLHdCQUF3QjtBQUMvQztBQUNBLHFCQUFxQix3QkFBd0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0EsZUFBZSxxQ0FBRztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixnQ0FBZ0MsdUNBQXVDLDJCQUEyQjtBQUN0SDtBQUNBLDJCQUEyQiwrQkFBK0I7QUFDMUQ7QUFDQSxxQkFBcUIsOEJBQThCO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsaUJBQWlCLG1DQUFtQywyQkFBMkIsU0FBUyxzQkFBc0I7QUFDbkk7QUFDQSw2QkFBNkIsc0JBQXNCO0FBQ25EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQzVGNkI7QUFDN0I7QUFDQSxNQUFNLFlBQVksV0FBVyxhQUFhLHlCQUF5QixlQUFlLHlCQUF5QixvQkFBb0I7QUFDL0g7QUFDQTtBQUNBO0FBQ08sb0JBQW9CLHFDQUFHO0FBQzlCO0FBQ0E7QUFDQSwyREFBMkQsZUFBZTtBQUMxRTtBQUNBLHlEQUF5RCxlQUFlLHlCQUF5QixZQUFZO0FBQzdHLDhCQUE4QixlQUFlLHFEQUFxRCxZQUFZO0FBQzlHO0FBQ0E7QUFDQSxpRUFBaUUsZUFBZTtBQUNoRjtBQUNBO0FBQ0EsaUVBQWlFLFdBQVc7QUFDNUU7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsNkJBQTZCLDJCQUEyQixZQUFZO0FBQ3BIO0FBQ0E7QUFDQSw4QkFBOEIsNEJBQTRCO0FBQzFELDBCQUEwQiwyQkFBMkI7QUFDckQseUJBQXlCLDJCQUEyQjtBQUNwRDtBQUNBLHFCQUFxQiwyQkFBMkI7QUFDaEQ7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw2Q0FBNkMsNkJBQTZCLDJCQUEyQixZQUFZO0FBQ2pIO0FBQ0E7QUFDQSw4QkFBOEIsNEJBQTRCO0FBQzFELDBCQUEwQix5QkFBeUI7QUFDbkQseUJBQXlCLDRCQUE0QjtBQUNyRDtBQUNBLHFCQUFxQiw0QkFBNEI7QUFDakQ7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw0Q0FBNEMsNkJBQTZCLDJCQUEyQixZQUFZO0FBQ2hIO0FBQ0E7QUFDQSw4QkFBOEIsNEJBQTRCO0FBQzFELDBCQUEwQix3QkFBd0I7QUFDbEQseUJBQXlCLHdCQUF3QjtBQUNqRDtBQUNBLHFCQUFxQix3QkFBd0I7QUFDN0M7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDZCQUE2QixtQ0FBbUMsd0JBQXdCO0FBQzVHO0FBQ0EsMkJBQTJCLDRCQUE0QjtBQUN2RDtBQUNBLHFCQUFxQix3QkFBd0I7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIsY0FBYyxtQ0FBbUMseUJBQXlCLFNBQVMsbUJBQW1CO0FBQzNIO0FBQ0EsOEJBQThCLG1CQUFtQjtBQUNqRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQiw2QkFBNkIsbUNBQW1DLHdCQUF3QjtBQUM1RztBQUNBLDRCQUE0QiwyQkFBMkI7QUFDdkQsOEJBQThCLDJCQUEyQjtBQUN6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixxQ0FBRztBQUN6QjtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsY0FBYztBQUNyQztBQUNBO0FBQ0Esd0RBQXdELEdBQUc7QUFDM0Q7QUFDQSxzR0FBc0csS0FBSywwQkFBMEIsR0FBRyxRQUFRLElBQUk7QUFDcEo7QUFDQSxlQUFlLElBQUksU0FBUyxJQUFJLFNBQVMsSUFBSTtBQUM3QyxzQkFBc0IsSUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLEtBQUssSUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLElBQUksSUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLElBQUksSUFBSSxPQUFPLElBQUksT0FBTyxJQUFJO0FBQzNJO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUM3RzZCO0FBQzdCO0FBQ0EsTUFBTSxZQUFZLGtCQUFrQixjQUFjLHVCQUF1QixpQkFBaUI7QUFDMUY7QUFDQTtBQUNBO0FBQ0E7QUFDTyxtQkFBbUIscUNBQUc7QUFDN0I7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGVBQWU7QUFDMUMsa0NBQWtDLGNBQWM7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELEtBQUssb0JBQW9CLGVBQWU7QUFDMUY7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsNEJBQTRCLDJCQUEyQixZQUFZO0FBQ25IO0FBQ0E7QUFDQSx3QkFBd0IsMkJBQTJCO0FBQ25ELHdCQUF3QiwyQkFBMkI7QUFDbkQsdUJBQXVCLDJCQUEyQjtBQUNsRDtBQUNBLHFCQUFxQiwyQkFBMkI7QUFDaEQ7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw2Q0FBNkMsNEJBQTRCLDJCQUEyQixZQUFZO0FBQ2hIO0FBQ0E7QUFDQSx3QkFBd0IsMkJBQTJCO0FBQ25ELHdCQUF3Qix5QkFBeUI7QUFDakQsdUJBQXVCLDRCQUE0QjtBQUNuRDtBQUNBLHFCQUFxQiw0QkFBNEI7QUFDakQ7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw0Q0FBNEMsNEJBQTRCLDJCQUEyQixZQUFZO0FBQy9HO0FBQ0E7QUFDQSx3QkFBd0IsMkJBQTJCO0FBQ25ELHdCQUF3Qix3QkFBd0I7QUFDaEQsdUJBQXVCLHdCQUF3QjtBQUMvQztBQUNBLHFCQUFxQix3QkFBd0I7QUFDN0M7QUFDQSxlQUFlLHFDQUFHO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLDRCQUE0Qix1Q0FBdUMsa0JBQWtCO0FBQ3pHO0FBQ0EsMkJBQTJCLDJCQUEyQjtBQUN0RDtBQUNBLHFCQUFxQiwwQkFBMEI7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQixhQUFhLG1DQUFtQyxrQkFBa0IsU0FBUyxrQkFBa0I7QUFDbEg7QUFDQSx3QkFBd0Isa0JBQWtCO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7VUN0RkE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ05BLGtCQUFrQixTQUFJLElBQUksU0FBSTtBQUM5QjtBQUNBO0FBQ0EsNkNBQTZDLFFBQVE7QUFDckQ7QUFDQTtBQUNBLGtCQUFrQixTQUFJLElBQUksU0FBSTtBQUM5QjtBQUNBO0FBQ0EsZUFBZSxTQUFJLElBQUksU0FBSTtBQUMzQixvQ0FBb0M7QUFDcEM7QUFDNEI7QUFDUTtBQUNOO0FBQ0k7QUFDSjtBQUNZO0FBQ1M7QUFDa0I7QUFDeEI7QUFDa0I7QUFDL0Q7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0IsRUFBRTtBQUN4QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSw2Q0FBSztBQUNUO0FBQ0E7QUFDQTtBQUNBLElBQUksNkNBQUs7QUFDVCxJQUFJLHFDQUFHO0FBQ1AsZUFBZSw2Q0FBSztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSw2Q0FBSztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLHFDQUFHO0FBQ1AsZUFBZSx1Q0FBRTtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxxQ0FBRztBQUNQLGVBQWUsdUNBQUU7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUkscUNBQUc7QUFDUCxlQUFlLDJDQUFJO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLHFDQUFHO0FBQ1AsZUFBZSx1Q0FBRSxVQUFVLDJDQUFJO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLHFDQUFHO0FBQ1AsZUFBZSx1Q0FBRSxTQUFTLDZDQUFLO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLHFDQUFHO0FBQ1A7QUFDQTtBQUNBLGVBQWUsbURBQVE7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUkscUNBQUc7QUFDUCxlQUFlLHVDQUFFLFVBQVUsMkNBQUksZ0JBQWdCLDZDQUFLO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLHFDQUFHO0FBQ1AsZUFBZSx1Q0FBRSxVQUFVLDJDQUFJLGdCQUFnQiw2Q0FBSztBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxxQ0FBRztBQUNQLGVBQWUsNERBQU87QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUkscUNBQUc7QUFDUCxlQUFlLDhFQUFnQjtBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxxQ0FBRztBQUNQLGVBQWUsc0RBQUk7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUkscUNBQUc7QUFDUCxlQUFlLHdFQUFhO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3hkYmMvLi9zcmMvREJDLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0FFLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0NPTVBBUklTT04udHMiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0NPTVBBUklTT04vR1JFQVRFUl9PUl9FUVVBTC50cyIsIndlYnBhY2s6Ly94ZGJjLy4vc3JjL0RCQy9DT01QQVJJU09OL0xFU1MudHMiLCJ3ZWJwYWNrOi8veGRiYy8uL3NyYy9EQkMvQ09NUEFSSVNPTi9MRVNTX09SX0VRVUFMLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0VRLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL0lOU1RBTkNFLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL1JFR0VYLnRzIiwid2VicGFjazovL3hkYmMvLi9zcmMvREJDL1RZUEUudHMiLCJ3ZWJwYWNrOi8veGRiYy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly94ZGJjL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly94ZGJjL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8veGRiYy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3hkYmMvLi9zcmMvRGVtby50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFByb3ZpZGVzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEZyYW1ld29yayB1c2luZyBkZWNvcmF0b3JzLlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgREJDIHtcbiAgICAvKipcbiAgICAgKiBNYWtlIGEgcmVxdWVzdCB0byBnZXQgdGhlIHZhbHVlIG9mIGEgY2VydGFpbiBwYXJhbWV0ZXIgb2Ygc3BlY2lmaWMgbWV0aG9kIGluIGEgc3BlY2lmaWMge0BsaW5rIG9iamVjdCB9LlxuICAgICAqIFRoYXQgcmVxdWVzdCBnZXRzIGVubGlzdGVkIGluIHtAbGluayBwYXJhbVZhbHVlUmVxdWVzdHMgfSB3aGljaCBpcyB1c2VkIGJ5IHtAbGluayBQYXJhbXZhbHVlUHJvdmlkZXJ9IHRvIGludm9rZSB0aGVcbiAgICAgKiBnaXZlbiBcInJlY2VwdG9yXCIgd2l0aCB0aGUgcGFyYW1ldGVyIHZhbHVlIHN0b3JlZCBpbiB0aGVyZS4gVGh1cyBhIHBhcmFtZXRlciBkZWNvcmF0b3IgdXNpbmcgdGhpcyBtZXRob2Qgd2lsbFxuICAgICAqIG5vdCByZWNlaXZlIGFueSB2YWx1ZSBvZiB0aGUgdG9wIG1ldGhvZCBpcyBub3QgdGFnZ2VkIHdpdGgge0BsaW5rIFBhcmFtdmFsdWVQcm92aWRlcn0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGFyZ2V0XHRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gY29udGFpbmluZyB0aGUgbWV0aG9kIHdpdGggdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cbiAgICAgKiBAcGFyYW0gbWV0aG9kTmFtZVx0VGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aXRoIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXG4gICAgICogQHBhcmFtIGluZGV4XHRcdFx0VGhlIGluZGV4IG9mIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXG4gICAgICogQHBhcmFtIHJlY2VwdG9yXHRcdFRoZSBtZXRob2QgdGhlIHJlcXVlc3RlZCBwYXJhbWV0ZXItdmFsdWUgc2hhbGwgYmUgcGFzc2VkIHRvIHdoZW4gaXQgYmVjb21lcyBhdmFpbGFibGUuICovXG4gICAgc3RhdGljIHJlcXVlc3RQYXJhbVZhbHVlKHRhcmdldCwgbWV0aG9kTmFtZSwgaW5kZXgsIFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cbiAgICByZWNlcHRvcikge1xuICAgICAgICBpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXModGFyZ2V0KSkge1xuICAgICAgICAgICAgaWYgKERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuaGFzKG1ldGhvZE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuZ2V0KG1ldGhvZE5hbWUpLmhhcyhpbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLmdldCh0YXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KG1ldGhvZE5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KGluZGV4KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnB1c2gocmVjZXB0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgREJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLmdldCh0YXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KG1ldGhvZE5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2V0KGluZGV4LCBuZXcgQXJyYXkocmVjZXB0b3IpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBEQkMucGFyYW1WYWx1ZVJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgIC5nZXQodGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAuc2V0KG1ldGhvZE5hbWUsIG5ldyBNYXAoW1xuICAgICAgICAgICAgICAgICAgICBbaW5kZXgsIG5ldyBBcnJheShyZWNlcHRvcildLFxuICAgICAgICAgICAgICAgIF0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuc2V0KHRhcmdldCwgbmV3IE1hcChbXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICBtZXRob2ROYW1lLFxuICAgICAgICAgICAgICAgICAgICBuZXcgTWFwKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFtpbmRleCwgbmV3IEFycmF5KHJlY2VwdG9yKV0sXG4gICAgICAgICAgICAgICAgICAgIF0pLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBdKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgY2hlY2tpbmcgdGhlIHtAbGluayBwYXJhbVZhbHVlUmVxdWVzdHMgfSBmb3IgdmFsdWUtcmVxdWVzdHMgb2YgdGhlIG1ldGhvZCdzIHBhcmFtZXRlciB0aHVzXG4gICAgICogYWxzbyB1c2FibGUgb24gc2V0dGVycy5cbiAgICAgKiBXaGVuIGZvdW5kIGl0IHdpbGwgaW52b2tlIHRoZSBcInJlY2VwdG9yXCIgcmVnaXN0ZXJlZCB0aGVyZSwgaW50ZXIgYWxpYSBieSB7QGxpbmsgcmVxdWVzdFBhcmFtVmFsdWUgfSwgd2l0aCB0aGVcbiAgICAgKiBwYXJhbWV0ZXIncyB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0YXJnZXQgXHRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gaG9zdGluZyB0aGUgdGFnZ2VkIG1ldGhvZCBhcyBwcm92aWRlZCBieSB0aGUgcnVudGltZS5cbiAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgXHRUaGUgdGFnZ2VkIG1ldGhvZCdzIG5hbWUgYXMgcHJvdmlkZWQgYnkgdGhlIHJ1bnRpbWUuXG4gICAgICogQHBhcmFtIGRlc2NyaXB0b3IgXHRUaGUge0BsaW5rIFByb3BlcnR5RGVzY3JpcHRvciB9IGFzIHByb3ZpZGVkIGJ5IHRoZSBydW50aW1lLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlIHtAbGluayBQcm9wZXJ0eURlc2NyaXB0b3IgfSB0aGF0IHdhcyBwYXNzZWQgYnkgdGhlIHJ1bnRpbWUuICovXG4gICAgc3RhdGljIFBhcmFtdmFsdWVQcm92aWRlcih0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKSB7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsTWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZTtcbiAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBHb3R0YSBiZSBhbnkgc2luY2UgcGFyYW1ldGVyLXZhbHVlcyBtYXkgYmUgdW5kZWZpbmVkLlxuICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIC8vICNyZWdpb25cdENoZWNrIGlmIGEgdmFsdWUgb2Ygb25lIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgaGFzIGJlZW4gcmVxdWVzdGVkIGFuZCBwYXNzIGl0IHRvIHRoZVxuICAgICAgICAgICAgLy9cdFx0XHRyZWNlcHRvciwgaWYgc28uXG4gICAgICAgICAgICBpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXModGFyZ2V0KSAmJlxuICAgICAgICAgICAgICAgIERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuaGFzKHByb3BlcnR5S2V5KSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaW5kZXggb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgICAuZ2V0KHRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgLmdldChwcm9wZXJ0eUtleSlcbiAgICAgICAgICAgICAgICAgICAgLmtleXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCBhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCByZWNlcHRvciBvZiBEQkMucGFyYW1WYWx1ZVJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldCh0YXJnZXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldChwcm9wZXJ0eUtleSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KGluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY2VwdG9yKGFyZ3NbaW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gXHRDaGVjayBpZiBhIHZhbHVlIG9mIG9uZSBvZiB0aGUgbWV0aG9kJ3MgcGFyYW1ldGVyIGhhcyBiZWVuIHJlcXVlc3RlZCBhbmQgcGFzcyBpdCB0byB0aGVcbiAgICAgICAgICAgIC8vIFx0XHRcdFx0cmVjZXB0b3IsIGlmIHNvLlxuICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1RoaXNJblN0YXRpYzogTmVjZXNzYXJ5LlxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZGVzY3JpcHRvcjtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBQYXJhbWV0ZXItdmFsdWUgcmVxdWVzdHMuXG4gICAgLy8gI3JlZ2lvbiBJbnZhcmlhbnRcbiAgICAvKipcbiAgICAgKiBBIHByb3BlcnR5LWRlY29yYXRvciBmYWN0b3J5IHNlcnZpbmcgYXMgYSAqKkQqKmVzaWduICoqQioqeSAqKkMqKm9udHJhY3QgSW52YXJpYW50LlxuICAgICAqIFNpbmNlIHRoZSB2YWx1ZSBtdXN0IGJlIGluaXRpYWxpemVkIG9yIHNldCBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCAqKmNvbnRyYWN0cyoqIHRoZSB2YWx1ZSB3aWxsIG9ubHkgYmUgY2hlY2tlZFxuICAgICAqIHdoZW4gYXNzaWduaW5nIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbnRyYWN0cyBUaGUge0BsaW5rIERCQyB9LUNvbnRyYWN0cyB0aGUgdmFsdWUgc2hhbGwgdXBob2xkLlxuICAgICAqXG4gICAgICogQHRocm93cyBcdEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSB3aGVuZXZlciB0aGUgcHJvcGVydHkgaXMgdHJpZWQgdG8gYmUgc2V0IHRvIGEgdmFsdWUgdGhhdCBkb2VzIG5vdCBjb21wbHkgdG8gdGhlXG4gICAgICogXHRcdFx0c3BlY2lmaWVkICoqY29udHJhY3RzKiosIGJ5IHRoZSByZXR1cm5lZCBtZXRob2QuKi9cbiAgICBzdGF0aWMgZGVjSW52YXJpYW50KGNvbnRyYWN0cywgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiAodGFyZ2V0LCBwcm9wZXJ0eUtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGludGVyY2VwdCBVTkRFRklORUQgYW5kIE5VTEwuXG4gICAgICAgICAgICBsZXQgdmFsdWU7XG4gICAgICAgICAgICAvLyAjcmVnaW9uIFJlcGxhY2Ugb3JpZ2luYWwgcHJvcGVydHkuXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eUtleSwge1xuICAgICAgICAgICAgICAgIHNldChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKG5ld1ZhbHVlLCBwYXRoKSA6IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIENoZWNrIGlmIGFsbCBcImNvbnRyYWN0c1wiIGFyZSBmdWxmaWxsZWQuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY29udHJhY3Qgb2YgY29udHJhY3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb250cmFjdC5jaGVjayhyZWFsVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLnJlcG9ydEZpZWxkSW5mcmluZ2VtZW50KHJlc3VsdCwgdGFyZ2V0LCBwYXRoLCBwcm9wZXJ0eUtleSwgcmVhbFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIENoZWNrIGlmIGFsbCBcImNvbnRyYWN0c1wiIGFyZSBmdWxmaWxsZWQuXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZXBsYWNlIG9yaWdpbmFsIHByb3BlcnR5LlxuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIEludmFyaWFudFxuICAgIC8vICNyZWdpb24gUG9zdGNvbmRpdGlvblxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kIGRlY29yYXRvciBmYWN0b3J5IGNoZWNraW5nIHRoZSByZXN1bHQgb2YgYSBtZXRob2Qgd2hlbmV2ZXIgaXQgaXMgaW52b2tlZCB0aHVzIGFsc28gdXNhYmxlIG9uIGdldHRlcnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hlY2tcdFRoZSAqKih0b0NoZWNrOiBhbnksIG9iamVjdCwgc3RyaW5nKSA9PiBib29sZWFuIHwgc3RyaW5nKiogdG8gdXNlIGZvciBjaGVja2luZy5cbiAgICAgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5yZXNvbHZlREJDUGF0aCB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRUaGUgZG90dGVkIHBhdGggcmVmZXJyaW5nIHRvIHRoZSBhY3R1YWwgdmFsdWUgdG8gY2hlY2ssIHN0YXJ0aW5nIGZvcm0gdGhlIHNwZWNpZmllZCBvbmUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgKiooIHRhcmdldCA6IG9iamVjdCwgcHJvcGVydHlLZXkgOiBzdHJpbmcsIGRlc2NyaXB0b3IgOiBQcm9wZXJ0eURlc2NyaXB0b3IgKSA6IFByb3BlcnR5RGVzY3JpcHRvcioqXG4gICAgICogXHRcdFx0aW52b2tlZCBieSBUeXBlc2NyaXB0LlxuICAgICAqL1xuICAgIHN0YXRpYyBkZWNQb3N0Y29uZGl0aW9uKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGludGVyY2VwdCBVTkRFRklORUQgYW5kIE5VTEwuXG4gICAgY2hlY2ssIGRiYywgcGF0aCA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gKHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsTWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZTtcbiAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGludGVyY2VwdCBVTkRFRklORUQgYW5kIE5VTEwuXG4gICAgICAgICAgICBkZXNjcmlwdG9yLnZhbHVlID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tQb3N0Y29uZGl0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9UaGlzSW5TdGF0aWM6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWFsVmFsdWUgPSBwYXRoID8gREJDLnJlc29sdmUocmVzdWx0LCBwYXRoKSA6IHJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVja1Jlc3VsdCA9IGNoZWNrKHJlYWxWYWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICBEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLnJlcG9ydFJldHVybnZhbHVlSW5mcmluZ2VtZW50KGNoZWNrUmVzdWx0LCB0YXJnZXQsIHBhdGgsIHByb3BlcnR5S2V5LCByZWFsVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBkZXNjcmlwdG9yO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIFBvc3Rjb25kaXRpb25cbiAgICAvLyAjcmVnaW9uIERlY29yYXRvclxuICAgIC8vICNyZWdpb24gUHJlY29uZGl0aW9uXG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdGhhdCByZXF1ZXN0cyB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIHBhc3NpbmcgaXQgdG8gdGhlIHByb3ZpZGVkXG4gICAgICogXCJjaGVja1wiLW1ldGhvZCB3aGVuIHRoZSB2YWx1ZSBiZWNvbWVzIGF2YWlsYWJsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGVja1x0VGhlIFwiKCB1bmtub3duICkgPT4gdm9pZFwiIHRvIGJlIGludm9rZWQgYWxvbmcgd2l0aCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIGFzIHNvb25cbiAgICAgKiBcdFx0XHRcdGFzIGl0IGJlY29tZXMgYXZhaWxhYmxlLlxuICAgICAqIEBwYXJhbSBkYmMgIFx0U2VlIHtAbGluayBEQkMucmVzb2x2ZURCQ1BhdGggfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0VGhlIGRvdHRlZCBwYXRoIHJlZmVycmluZyB0byB0aGUgYWN0dWFsIHZhbHVlIHRvIGNoZWNrLCBzdGFydGluZyBmb3JtIHRoZSBzcGVjaWZpZWQgb25lLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVGhlICoqKHRhcmdldDogb2JqZWN0LCBtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIHBhcmFtZXRlckluZGV4OiBudW1iZXIgKSA9PiB2b2lkKiogaW52b2tlZCBieSBUeXBlc2NyaXB0LSAqL1xuICAgIHN0YXRpYyBkZWNQcmVjb25kaXRpb24oY2hlY2ssIGRiYywgcGF0aCA9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gKHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpID0+IHtcbiAgICAgICAgICAgIERCQy5yZXF1ZXN0UGFyYW1WYWx1ZSh0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4LCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3NcbiAgICAgICAgICAgICAgICAgICAgLmNoZWNrUHJlY29uZGl0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZSh2YWx1ZSwgcGF0aCkgOiB2YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjaGVjayhyZWFsVmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIERCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykucmVwb3J0UGFyYW1ldGVySW5mcmluZ2VtZW50KHJlc3VsdCwgdGFyZ2V0LCBwYXRoLCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCwgcmVhbFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhIHdhcm5pbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSBjb250YWluaW5nIHRoZSB3YXJuaW5nLiAqL1xuICAgIHJlcG9ydFdhcm5pbmcobWVzc2FnZSkge1xuICAgICAgICBpZiAodGhpcy53YXJuaW5nU2V0dGluZ3MubG9nVG9Db25zb2xlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhbiBpbmZyaW5nZW1lbnQgYWNjb3JkaW5nIHRvIHRoZSB7QGxpbmsgaW5mcmluZ2VtZW50U2V0dGluZ3MgfSBhbHNvIGdlbmVyYXRpbmcgYSBwcm9wZXIge0BsaW5rIHN0cmluZyB9LXdyYXBwZXJcbiAgICAgKiBmb3IgdGhlIGdpdmVuIFwibWVzc2FnZVwiICYgdmlvbGF0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZVx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXG4gICAgICogQHBhcmFtIHZpb2xhdG9yIFx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIG9yIG5hbWluZyB0aGUgdmlvbGF0b3IuICovXG4gICAgcmVwb3J0SW5mcmluZ2VtZW50KG1lc3NhZ2UsIHZpb2xhdG9yLCB0YXJnZXQsIHBhdGgpIHtcbiAgICAgICAgY29uc3QgZmluYWxNZXNzYWdlID0gYFsgRnJvbSBcIiR7dmlvbGF0b3J9XCIke3BhdGggPyBgJ3MgbWVtYmVyIFwiJHtwYXRofVwiYCA6IFwiXCJ9JHt0eXBlb2YgdGFyZ2V0ID09PSBcImZ1bmN0aW9uXCIgPyBgIGluIFwiJHt0YXJnZXQubmFtZX1cImAgOiB0eXBlb2YgdGFyZ2V0ID09PSBcIm9iamVjdFwiICYmIHRhcmdldCAhPT0gbnVsbCAmJiB0eXBlb2YgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBcImZ1bmN0aW9uXCIgPyBgIGluIFwiJHt0YXJnZXQuY29uc3RydWN0b3IubmFtZX1cImAgOiBcIlwifTogJHttZXNzYWdlfV1gO1xuICAgICAgICBpZiAodGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncy50aHJvd0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoZmluYWxNZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncy5sb2dUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGZpbmFsTWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhIHBhcmFtZXRlci1pbmZyaW5nZW1lbnQgdmlhIHtAbGluayByZXBvcnRJbmZyaW5nZW1lbnQgfSBhbHNvIGdlbmVyYXRpbmcgYSBwcm9wZXIge0BsaW5rIHN0cmluZyB9LXdyYXBwZXJcbiAgICAgKiBmb3IgdGhlIGdpdmVuIFwibWVzc2FnZVwiLFwibWV0aG9kXCIsIHBhcmFtZXRlci1cImluZGV4XCIgJiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cbiAgICAgKiBAcGFyYW0gbWV0aG9kIFx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIG9yIG5hbWluZyB0aGUgdmlvbGF0b3IuXG4gICAgICogQHBhcmFtIGluZGV4XHRcdFRoZSBpbmRleCBvZiB0aGUgcGFyYW1ldGVyIHdpdGhpbiB0aGUgYXJndW1lbnQgbGlzdGluZy5cbiAgICAgKiBAcGFyYW0gdmFsdWUgXHRUaGUgcGFyYW1ldGVyJ3MgdmFsdWUuICovXG4gICAgcmVwb3J0UGFyYW1ldGVySW5mcmluZ2VtZW50KG1lc3NhZ2UsIHRhcmdldCwgcGF0aCwgbWV0aG9kLCBpbmRleCwgdmFsdWUpIHtcbiAgICAgICAgY29uc3QgcHJvcGVySW5kZXggPSBpbmRleCArIDE7XG4gICAgICAgIHRoaXMucmVwb3J0SW5mcmluZ2VtZW50KGBbIFBhcmFtZXRlci12YWx1ZSBcIiR7dmFsdWV9XCIgb2YgdGhlICR7cHJvcGVySW5kZXh9JHtwcm9wZXJJbmRleCA9PT0gMSA/IFwic3RcIiA6IHByb3BlckluZGV4ID09PSAyID8gXCJuZFwiIDogcHJvcGVySW5kZXggPT09IDMgPyBcInJkXCIgOiBcInRoXCJ9IHBhcmFtZXRlciBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9XWAsIG1ldGhvZCwgdGFyZ2V0LCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVwb3J0cyBhIGZpZWxkLWluZnJpbmdlbWVudCB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxuICAgICAqIGZvciB0aGUgZ2l2ZW4gKiptZXNzYWdlKiogJiAqKm5hbWUqKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlXHRBIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXG4gICAgICogQHBhcmFtIGtleSBcdFx0VGhlIHByb3BlcnR5IGtleS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRUaGUgZG90dGVkLXBhdGgge0BsaW5rIHN0cmluZyB9IHRoYXQgbGVhZHMgdG8gdGhlIHZhbHVlIG5vdCBmdWxmaWxsaW5nIHRoZSBjb250cmFjdCBzdGFydGluZyBmcm9tXG4gICAgICogXHRcdFx0XHRcdHRoZSB0YWdnZWQgb25lLlxuICAgICAqIEBwYXJhbSB2YWx1ZVx0XHRUaGUgdmFsdWUgbm90IGZ1bGZpbGxpbmcgYSBjb250cmFjdC4gKi9cbiAgICByZXBvcnRGaWVsZEluZnJpbmdlbWVudChtZXNzYWdlLCB0YXJnZXQsIHBhdGgsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoYFsgTmV3IHZhbHVlIGZvciBcIiR7a2V5fVwiJHtwYXRoID09PSB1bmRlZmluZWQgPyBcIlwiIDogYC4ke3BhdGh9YH0gd2l0aCB2YWx1ZSBcIiR7dmFsdWV9XCIgZGlkIG5vdCBmdWxmaWxsIG9uZSBvZiBpdCdzIGNvbnRyYWN0czogJHttZXNzYWdlfV1gLCBrZXksIHRhcmdldCwgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlcG9ydHMgYSByZXR1cm52YWx1ZS1pbmZyaW5nZW1lbnQgYWNjb3JkaW5nIHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXG4gICAgICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIixcIm1ldGhvZFwiICYgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZVx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXG4gICAgICogQHBhcmFtIG1ldGhvZCBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLlxuICAgICAqIEBwYXJhbSB2YWx1ZVx0XHRUaGUgcGFyYW1ldGVyJ3MgdmFsdWUuICovXG4gICAgcmVwb3J0UmV0dXJudmFsdWVJbmZyaW5nZW1lbnQobWVzc2FnZSwgdGFyZ2V0LCBwYXRoLCBtZXRob2QsIFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgIHZhbHVlKSB7XG4gICAgICAgIHRoaXMucmVwb3J0SW5mcmluZ2VtZW50KGBbIFJldHVybi12YWx1ZSBcIiR7dmFsdWV9XCIgZGlkIG5vdCBmdWxmaWxsIG9uZSBvZiBpdCdzIGNvbnRyYWN0czogJHttZXNzYWdlfV1gLCBtZXRob2QsIHRhcmdldCwgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgdGhpcyB7QGxpbmsgREJDIH0gYnkgc2V0dGluZyB0aGUge0BsaW5rIERCQy5pbmZyaW5nZW1lbnRTZXR0aW5ncyB9LCBkZWZpbmUgdGhlICoqV2FYQ29kZSoqIG5hbWVzcGFjZSBpblxuICAgICAqICoqd2luZG93KiogaWYgbm90IHlldCBhdmFpbGFibGUgYW5kIHNldHRpbmcgdGhlIHByb3BlcnR5ICoqREJDKiogaW4gdGhlcmUgdG8gdGhlIGluc3RhbmNlIG9mIHRoaXMge0BsaW5rIERCQyB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIGluZnJpbmdlbWVudFNldHRpbmdzIFx0U2VlIHtAbGluayBEQkMuaW5mcmluZ2VtZW50U2V0dGluZ3MgfS5cbiAgICAgKiBAcGFyYW0gZXhlY3V0aW9uU2V0dGluZ3NcdFx0U2VlIHtAbGluayBEQkMuZXhlY3V0aW9uU2V0dGluZ3MgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihpbmZyaW5nZW1lbnRTZXR0aW5ncyA9IHsgdGhyb3dFeGNlcHRpb246IHRydWUsIGxvZ1RvQ29uc29sZTogZmFsc2UgfSwgZXhlY3V0aW9uU2V0dGluZ3MgPSB7XG4gICAgICAgIGNoZWNrUHJlY29uZGl0aW9uczogdHJ1ZSxcbiAgICAgICAgY2hlY2tQb3N0Y29uZGl0aW9uczogdHJ1ZSxcbiAgICAgICAgY2hlY2tJbnZhcmlhbnRzOiB0cnVlLFxuICAgIH0pIHtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBQcmVjb25kaXRpb25cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBEZWNvcmF0b3JcbiAgICAgICAgLy8gI3JlZ2lvbiBFeGVjdXRpb24gSGFuZGxpbmdcbiAgICAgICAgLyoqIFN0b3JlcyBzZXR0aW5ncyBjb25jZXJuaW5nIHRoZSBleGVjdXRpb24gb2YgY2hlY2tzLiAqL1xuICAgICAgICB0aGlzLmV4ZWN1dGlvblNldHRpbmdzID0ge1xuICAgICAgICAgICAgY2hlY2tQcmVjb25kaXRpb25zOiB0cnVlLFxuICAgICAgICAgICAgY2hlY2tQb3N0Y29uZGl0aW9uczogdHJ1ZSxcbiAgICAgICAgICAgIGNoZWNrSW52YXJpYW50czogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBFeGVjdXRpb24gSGFuZGxpbmdcbiAgICAgICAgLy8gI3JlZ2lvbiBXYXJuaW5nIGhhbmRsaW5nLlxuICAgICAgICAvKiogU3RvcmVzIHNldHRpbmdzIGNvbmNlcm5pbmcgd2FybmluZ3MuICovXG4gICAgICAgIHRoaXMud2FybmluZ1NldHRpbmdzID0geyBsb2dUb0NvbnNvbGU6IHRydWUgfTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBXYXJuaW5nIGhhbmRsaW5nLlxuICAgICAgICAvLyAjcmVnaW9uIGluZnJpbmdlbWVudCBoYW5kbGluZy5cbiAgICAgICAgLyoqIFN0b3JlcyB0aGUgc2V0dGluZ3MgY29uY2VybmluZyBpbmZyaW5nZW1lbnRzICovXG4gICAgICAgIHRoaXMuaW5mcmluZ2VtZW50U2V0dGluZ3MgPSB7IHRocm93RXhjZXB0aW9uOiB0cnVlLCBsb2dUb0NvbnNvbGU6IGZhbHNlIH07XG4gICAgICAgIHRoaXMuaW5mcmluZ2VtZW50U2V0dGluZ3MgPSBpbmZyaW5nZW1lbnRTZXR0aW5ncztcbiAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgIGlmICh3aW5kb3cuV2FYQ29kZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgd2luZG93LldhWENvZGUgPSB7fTtcbiAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgIHdpbmRvdy5XYVhDb2RlLkRCQyA9IHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlc29sdmVzIHRoZSBkZXNpcmVkIHtAbGluayBvYmplY3QgfSBvdXQgYSBnaXZlbiBvbmUgKip0b1Jlc29sdmVGcm9tKiogdXNpbmcgdGhlIHNwZWNpZmllZCAqKnBhdGgqKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b1Jlc29sdmVGcm9tIFRoZSB7QGxpbmsgb2JqZWN0IH0gc3RhcnRpbmcgdG8gcmVzb2x2ZSBmcm9tLlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0VGhlIGRvdHRlZCBwYXRoLXtAbGluayBzdHJpbmcgfS5cbiAgICAgKiBcdFx0XHRcdFx0XHRUaGlzIHN0cmluZyB1c2VzIC4sIFsuLi5dLCBhbmQgKCkgdG8gcmVwcmVzZW50IGFjY2Vzc2luZyBuZXN0ZWQgcHJvcGVydGllcyxcbiAgICAgKiBcdFx0XHRcdFx0XHRhcnJheSBlbGVtZW50cy9vYmplY3Qga2V5cywgYW5kIGNhbGxpbmcgbWV0aG9kcywgcmVzcGVjdGl2ZWx5LCBtaW1pY2tpbmcgSmF2YVNjcmlwdCBzeW50YXggdG8gbmF2aWdhdGVcbiAgICAgKiBcdFx0XHRcdFx0XHRhbiBvYmplY3QncyBzdHJ1Y3R1cmUuIENvZGUsIGUuZy4gc29tZXRoaW5nIGxpa2UgYS5iKCAxIGFzIG51bWJlciApLmMsIHdpbGwgbm90IGJlIGV4ZWN1dGVkIGFuZFxuICAgICAqIFx0XHRcdFx0XHRcdHRodXMgbWFrZSB0aGUgcmV0cmlldmFsIGZhaWwuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUaGUgcmVxdWVzdGVkIHtAbGluayBvYmplY3QgfSwgTlVMTCBvciBVTkRFRklORUQuICovXG4gICAgc3RhdGljIHJlc29sdmUodG9SZXNvbHZlRnJvbSwgcGF0aCkge1xuICAgICAgICBpZiAoIXRvUmVzb2x2ZUZyb20gfHwgdHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFydHMgPSBwYXRoLnJlcGxhY2UoL1xcWyhbJ1wiXT8pKC4qPylcXDFcXF0vZywgXCIuJDJcIikuc3BsaXQoXCIuXCIpOyAvLyBIYW5kbGUgaW5kZXhlcnNcbiAgICAgICAgbGV0IGN1cnJlbnQgPSB0b1Jlc29sdmVGcm9tO1xuICAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50ID09PSBudWxsIHx8IHR5cGVvZiBjdXJyZW50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1ldGhvZE1hdGNoID0gcGFydC5tYXRjaCgvKFxcdyspXFwoKC4qKVxcKS8pO1xuICAgICAgICAgICAgaWYgKG1ldGhvZE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IG1ldGhvZE1hdGNoWzFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3NTdHIgPSBtZXRob2RNYXRjaFsyXTtcbiAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gYXJnc1N0ci5zcGxpdChcIixcIikubWFwKChhcmcpID0+IGFyZy50cmltKCkpOyAvLyBTaW1wbGUgYXJndW1lbnQgcGFyc2luZ1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudFttZXRob2ROYW1lXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W21ldGhvZE5hbWVdLmFwcGx5KGN1cnJlbnQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gTWV0aG9kIG5vdCBmb3VuZCBvciBub3QgYSBmdW5jdGlvblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W3BhcnRdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyZW50O1xuICAgIH1cbn1cbi8vICNyZWdpb24gUGFyYW1ldGVyLXZhbHVlIHJlcXVlc3RzLlxuLyoqIFN0b3JlcyBhbGwgcmVxdWVzdCBmb3IgcGFyYW1ldGVyIHZhbHVlcyByZWdpc3RlcmVkIGJ5IHtAbGluayBkZWNQcmVjb25kaXRpb24gfS4gKi9cbkRCQy5wYXJhbVZhbHVlUmVxdWVzdHMgPSBuZXcgTWFwKCk7XG4vLyAjcmVnaW9uIENsYXNzZXNcbi8vICNyZWdpb24gRXJyb3JzXG4vKiogQW4ge0BsaW5rIEVycm9yIH0gdG8gYmUgdGhyb3duIHdoZW5ldmVyIGFuIGluZnJpbmdlbWVudCBpcyBkZXRlY3RlZC4gKi9cbkRCQy5JbmZyaW5nZW1lbnQgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIHRoaXMge0BsaW5rIEVycm9yIH0gYnkgdGFnZ2luZyB0aGUgc3BlY2lmaWVkIG1lc3NhZ2Ute0BsaW5rIHN0cmluZyB9IGFzIGFuIFhEQkMtSW5mcmluZ2VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgVGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQuICovXG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihgWyBYREJDIEluZnJpbmdlbWVudCAke21lc3NhZ2V9XWApO1xuICAgIH1cbn07XG4vLyAjZW5kcmVnaW9uIEVycm9yc1xuLy8gI2VuZHJlZ2lvbiBDbGFzc2VzXG4vLyAjZW5kcmVnaW9uIGluZnJpbmdlbWVudCBoYW5kbGluZy5cbi8qKlxuICogUmVzb2x2ZXMgdGhlIHNwZWNpZmllZCBkb3R0ZWQge0BsaW5rIHN0cmluZyB9LXBhdGggdG8gYSB7QGxpbmsgREJDIH0uXG4gKlxuICogQHBhcmFtIG9iaiBcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdG8gc3RhcnQgcmVzb2x2aW5nIGZyb20uXG4gKiBAcGFyYW0gcGF0aCBcdFRoZSBkb3R0ZWQge0BsaW5rIHN0cmluZyB9LXBhdGggbGVhZGluZyB0byB0aGUge0BsaW5rIERCQyB9LlxuICpcbiAqIEByZXR1cm5zIFRoZSByZXF1ZXN0ZWQge0BsaW5rIERCQyB9LlxuICovXG5EQkMucmVzb2x2ZURCQ1BhdGggPSAob2JqLCBwYXRoKSA9PiBwYXRoID09PSBudWxsIHx8IHBhdGggPT09IHZvaWQgMCA/IHZvaWQgMCA6IHBhdGguc3BsaXQoXCIuXCIpLnJlZHVjZSgoYWNjdW11bGF0b3IsIGN1cnJlbnQpID0+IGFjY3VtdWxhdG9yW2N1cnJlbnRdLCBvYmopO1xuLy8gU2V0IHRoZSBtYWluIGluc3RhbmNlIHdpdGggc3RhbmRhcmQgKipEQkMuaW5mcmluZ2VtZW50U2V0dGluZ3MqKi5cbm5ldyBEQkMoKTtcbiIsImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcbi8qKlxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbGwgZWxlbWVudHMgb2YgYW4ge0BsaW5rIG9iamVjdCB9cyBoYXZlIHRvIGZ1bGZpbGxcbiAqIGEgZ2l2ZW4ge0BsaW5rIG9iamVjdCB9J3MgY2hlY2stbWV0aG9kICgqKiggdG9DaGVjayA6IGFueSApID0+IGJvb2xlYW4gfCBzdHJpbmcqKikuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBBRSBleHRlbmRzIERCQyB7XG4gICAgLy8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGVhY2ggZWxlbWVudCBvZiB0aGUgKip2YWx1ZSoqLXtAbGluayBBcnJheSA8IGFueSA+fSBhZ2FpbnN0IHRoZSBnaXZlbiAqKmNvbmRpdGlvbioqLCBpZiBpdCBpcyBvbmUuIElmIGl0IGlzIG5vdFxuICAgICAqIHRoZSAqKnZhbHVlKiogaXRzZWxmIHdpbGwgYmUgY2hlY2tlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb25kaXRpb25cdFRoZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlICoqdmFsdWUqKiBhZ2FpbnN0LlxuICAgICAqIEBwYXJhbSB2YWx1ZVx0XHRFaXRoZXIgKip2YWx1ZSoqLXtAbGluayBBcnJheSA8IGFueSA+fSwgd2hpY2gncyBlbGVtZW50cyB3aWxsIGJlIGNoZWNrZWQsIG9yIHRoZSB2YWx1ZSB0byBiZVxuICAgICAqIFx0XHRcdFx0XHRjaGVja2VkIGl0c2VsZi5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0SWYgc3BlY2lmaWVkIHdpdGggKippZHhFbmQqKiBiZWluZyB1bmRlZmluZWQsIHRoaXMge0BsaW5rIE51bWJlciB9IHdpbGwgYmUgc2VlbiBhcyB0aGUgaW5kZXggb2ZcbiAgICAgKiBcdFx0XHRcdFx0dGhlIHZhbHVlLXtAbGluayBBcnJheSB9J3MgZWxlbWVudCB0byBjaGVjay4gSWYgdmFsdWUgaXNuJ3QgYW4ge0BsaW5rIEFycmF5IH0gdGhpcyBwYXJhbWV0ZXJcbiAgICAgKiBcdFx0XHRcdFx0d2lsbCBub3QgaGF2ZSBhbnkgZWZmZWN0LlxuICAgICAqIFx0XHRcdFx0XHRXaXRoICoqaWR4RW5kKiogbm90IHVuZGVmaW5lZCB0aGlzIHBhcmFtZXRlciBpbmRpY2F0ZXMgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3BhbiBvZiBlbGVtZW50cyB0b1xuICAgICAqIFx0XHRcdFx0XHRjaGVjayB3aXRoaW4gdGhlIHZhbHVlLXtAbGluayBBcnJheSB9LlxuICAgICAqIEBwYXJhbSBpZHhFbmRcdEluZGljYXRlcyB0aGUgbGFzdCBlbGVtZW50J3MgaW5kZXggKGluY2x1ZGluZykgb2YgdGhlIHNwYW4gb2YgdmFsdWUte0BsaW5rIEFycmF5IH0gZWxlbWVudHMgdG8gY2hlY2suXG4gICAgICogXHRcdFx0XHRcdFNldHRpbmcgdGhpcyBwYXJhbWV0ZXIgdG8gLTEgc3BlY2lmaWVzIHRoYXQgYWxsIHZhbHVlLXtAbGluayBBcnJheSB9J3MgZWxlbWVudHMgYmVnaW5uaW5nIGZyb20gdGhlXG4gICAgICogXHRcdFx0XHRcdHNwZWNpZmllZCAqKmluZGV4Kiogc2hhbGwgYmUgY2hlY2tlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEFzIHNvb24gYXMgdGhlICoqY29uZGl0aW9uKiogcmV0dXJucyBhIHtAbGluayBzdHJpbmcgfSwgaW5zdGVhZCBvZiBUUlVFLCB0aGUgcmV0dXJuZWQgc3RyaW5nLiBUUlVFIGlmIHRoZVxuICAgICAqIFx0XHRcdCoqY29uZGl0aW9uKiogbmV2ZXIgcmV0dXJucyBhIHtAbGluayBzdHJpbmd9LiAqL1xuICAgIHN0YXRpYyBjaGVja0FsZ29yaXRobShjb25kaXRpb24sIHZhbHVlLCBpbmRleCwgaWR4RW5kKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQgJiYgaWR4RW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSAmJiBpbmRleCA8IHZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBjb25kaXRpb24uY2hlY2sodmFsdWVbaW5kZXhdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgVmlvbGF0aW5nLUFycmF5ZWxlbWVudCBhdCBpbmRleCBcIiR7aW5kZXh9XCIgd2l0aCB2YWx1ZSBcIiR7dmFsdWVbaW5kZXhdfVwiLiAke3Jlc3VsdH1gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBJbiBvcmRlciBmb3Igb3B0aW9uYWwgcGFyYW1ldGVyIHRvIG5vdCBjYXVzZSBhbiBlcnJvciBpZiB0aGV5IGFyZSBvbWl0dGVkLlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZW5kaW5nID0gaWR4RW5kICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICA/IGlkeEVuZCAhPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBpZHhFbmQgKyAxXG4gICAgICAgICAgICAgICAgICAgIDogdmFsdWUubGVuZ3RoXG4gICAgICAgICAgICAgICAgOiB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gaW5kZXggPyBpbmRleCA6IDA7IGkgPCBlbmRpbmc7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbmRpdGlvbi5jaGVjayh2YWx1ZVtpXSk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYFZpb2xhdGluZy1BcnJheWVsZW1lbnQgYXQgaW5kZXggJHtpfS4gJHtyZXN1bHR9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gY29uZGl0aW9uLmNoZWNrKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9IHdpdGggZWl0aGVyIG11bHRpcGxlIG9yIGEgc2luZ2xlIG9uZVxuICAgICAqIG9mIHRoZSAqKnJlYWxDb25kaXRpb25zKiogdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWUgYWdhaW5zdCB3aXRoLlxuICAgICAqIFdoZW4gc3BlY2lmeWluZyBhbiAqKmluZGV4KiogYW5kIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgKip2YWx1ZSoqIGlzIGFuIHtAbGluayBBcnJheSB9LCB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIGFwcGx5IHRvIHRoZVxuICAgICAqIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCAqKmluZGV4KiouXG4gICAgICogSWYgdGhlIHtAbGluayBBcnJheSB9IGlzIHRvbyBzaG9ydCB0aGUgY3VycmVudGx5IHByb2Nlc3NlZCB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gb2ZcbiAgICAgKiAqKnJlYWxDb25kaXRpb25zKiogd2lsbCBiZSB2ZXJpZmllZCB0byBUUlVFIGF1dG9tYXRpY2FsbHksIGNvbnNpZGVyaW5nIG9wdGlvbmFsIHBhcmFtZXRlcnMuXG4gICAgICogSWYgYW4gKippbmRleCoqIGlzIHNwZWNpZmllZCBidXQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBpc24ndCBhbiBhcnJheSwgdGhlICoqaW5kZXgqKiBpcyB0cmVhdGVkIGFzIGJlaW5nIHVuZGVmaW5lZC5cbiAgICAgKiBJZiAqKmluZGV4KiogaXMgdW5kZWZpbmVkIGFuZCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIGlzIGFuIHtAbGluayBBcnJheSB9IGVhY2ggZWxlbWVudCBvZiBpdCB3aWxsIGJlIGNoZWNrZWRcbiAgICAgKiBhZ2FpbnN0IHRoZSAqKnJlYWxDb25kaXRpb25zKiouXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWVcbiAgICAgKiBcdFx0XHRcdFx0XHRcdGFnYWluc3Qgd2l0aC5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGlkeEVuZFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZiAqKnJlYWxDb25kaXRpb25zKiogcmV0dXJucyBvbmUuXG4gICAgICogXHRcdFx0T3RoZXJ3aXNlIFRSVUUuICovXG4gICAgc3RhdGljIFBSRShyZWFsQ29uZGl0aW9ucywgaW5kZXggPSB1bmRlZmluZWQsIGlkeEVuZCA9IHVuZGVmaW5lZCwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVhbENvbmRpdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBjdXJyZW50Q29uZGl0aW9uIG9mIHJlYWxDb25kaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEFFLmNoZWNrQWxnb3JpdGhtKGN1cnJlbnRDb25kaXRpb24sIHZhbHVlLCBpbmRleCwgaWR4RW5kKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT09IFwiYm9vbGVhblwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQUUuY2hlY2tBbGdvcml0aG0ocmVhbENvbmRpdGlvbnMsIHZhbHVlLCBpbmRleCwgaWR4RW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCBkYmMsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXG4gICAgICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybi12YWx1ZSBhZ2FpbnN0IHdpdGguXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWVcbiAgICAgKiBcdFx0XHRcdFx0XHRcdGFnYWluc3Qgd2l0aC5cbiAgICAgKiBAcGFyYW0gaW5kZXhcdFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGlkeEVuZFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZiAqKnJlYWxDb25kaXRpb25zKiogcmV0dXJuIG9uZS5cbiAgICAgKiBcdFx0XHRPdGhlcndpc2UgVFJVRS4gKi9cbiAgICBzdGF0aWMgUE9TVChyZWFsQ29uZGl0aW9ucywgaW5kZXggPSB1bmRlZmluZWQsIGlkeEVuZCA9IHVuZGVmaW5lZCwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlYWxDb25kaXRpb25zKSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgY3VycmVudENvbmRpdGlvbiBvZiByZWFsQ29uZGl0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBBRS5jaGVja0FsZ29yaXRobShjdXJyZW50Q29uZGl0aW9uLCB2YWx1ZSwgaW5kZXgsIGlkeEVuZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcImJvb2xlYW5cIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFFLmNoZWNrQWxnb3JpdGhtKFxuICAgICAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgICAgICAgIHJlYWxDb25kaXRpb25zLCB2YWx1ZSwgaW5kZXgsIGlkeEVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXG4gICAgICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIGZpZWxkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXG4gICAgICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXG4gICAgICogQHBhcmFtIGluZGV4XHRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBpZHhFbmRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKHJlYWxDb25kaXRpb25zLCBpbmRleCA9IHVuZGVmaW5lZCwgaWR4RW5kID0gdW5kZWZpbmVkLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBBRShyZWFsQ29uZGl0aW9ucywgaW5kZXgsIGlkeEVuZCldLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIGdsb2JhbCBmdW5jdGlvbnMpLlxuICAgIC8vXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBhbGwge0BsaW5rIEFFLmNvbmRpdGlvbnMgfSBhbmQgdGhlIHtAbGluayBvYmplY3QgfSB7QGxpbmsgdG9DaGVjayB9LFxuICAgICAqIHtAbGluayBBRS5pbmRleCB9ICYge0BsaW5rIEFFLmlkeEVuZCB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobX0uICovXG4gICAgY2hlY2sodG9DaGVjaykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmNvbmRpdGlvbnMpKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGN1cnJlbnRDb25kaXRpb24gb2YgdGhpcy5jb25kaXRpb25zKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gQUUuY2hlY2tBbGdvcml0aG0oY3VycmVudENvbmRpdGlvbiwgdG9DaGVjaywgdGhpcy5pbmRleCwgdGhpcy5pZHhFbmQpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcImJvb2xlYW5cIilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBBRS5jaGVja0FsZ29yaXRobShcbiAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgICAgdGhpcy5jb25kaXRpb25zLCB0b0NoZWNrLCB0aGlzLmluZGV4LCB0aGlzLmlkeEVuZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgQUUgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIEFFLmNvbmRpdGlvbnMgfSwge0BsaW5rIEFFLmluZGV4IH0gYW5kIHtAbGluayBBRS5pZHhFbmQgfSB1c2VkIGJ5IHtAbGluayBBRS5jaGVjayB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnQgU2VlIHtAbGluayBFUS5jaGVjayB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbmRpdGlvbnMsIGluZGV4ID0gdW5kZWZpbmVkLCBpZHhFbmQgPSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jb25kaXRpb25zID0gY29uZGl0aW9ucztcbiAgICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICAgICAgICB0aGlzLmlkeEVuZCA9IGlkeEVuZDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIGEgY29tcGFyaXNvbiBiZXR3ZWVuIHR3byB7QGxpbmsgb2JqZWN0IH1zLlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgQ09NUEFSSVNPTiBleHRlbmRzIERCQyB7XG4gICAgLy8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLyoqXG4gICAgICogRG9lcyBhIGNvbXBhcmlzb24gYmV0d2VlbiB0aGUge0BsaW5rIG9iamVjdCB9ICoqdG9DaGVjayoqIGFuZCB0aGUgKiplcXVpdmFsZW50KiouXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVja1x0XHRUaGUgdmFsdWUgdGhhdCBoYXMgdG8gYmUgZXF1YWwgdG8gaXQncyBwb3NzaWJsZSAqKmVxdWl2YWxlbnQqKiBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmUgZnVsZmlsbGVkLlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHRUaGUge0BsaW5rIG9iamVjdCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIHRvIGJlIGVxdWFsIHRvIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZVxuICAgICAqIFx0XHRcdFx0XHRcdGZ1bGZpbGxlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUgKiplcXVpdmFsZW50KiogYXJlIGVxdWFsIHRvIGVhY2ggb3RoZXIsIG90aGVyd2lzZSBGQUxTRS4gKi9cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQsIGludmVydCkge1xuICAgICAgICBpZiAoZXF1YWxpdHlQZXJtaXR0ZWQgJiYgIWludmVydCAmJiB0b0NoZWNrIDwgZXF1aXZhbGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXF1YWxpdHlQZXJtaXR0ZWQgJiYgaW52ZXJ0ICYmIHRvQ2hlY2sgPiBlcXVpdmFsZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gXCIke2VxdWl2YWxlbnR9XCJgO1xuICAgICAgICB9XG4gICAgICAgIGlmICghZXF1YWxpdHlQZXJtaXR0ZWQgJiYgIWludmVydCAmJiB0b0NoZWNrIDw9IGVxdWl2YWxlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIGdyZWF0ZXIgdGhhbiBcIiR7ZXF1aXZhbGVudH1cImA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlcXVhbGl0eVBlcm1pdHRlZCAmJiBpbnZlcnQgJiYgdG9DaGVjayA+PSBlcXVpdmFsZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBsZXNzIHRoYW4gXCIke2VxdWl2YWxlbnR9XCJgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUFJFKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQsIGludmVydCk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudFx0ICAgIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdCAgICBTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXG4gICAgc3RhdGljIFBPU1QoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXF1YWxpdHlQZXJtaXR0ZWQsIGVxdWl2YWxlbnQsIGludmVydCk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBDT01QQVJJU09OKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkLCBpbnZlcnQpXSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIER5bmFtaWMgdXNhZ2UuXG4gICAgLyoqXG4gICAgICogSW52b2tlcyB0aGUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiwge0BsaW5rIENPTVBBUklTT04uZXF1aXZhbGVudCB9IGFuZCB7QGxpbmsgQ09NUEFSSVNPTi5pbnZlcnQgfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtfS4gKi9cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMuZXF1aXZhbGVudCwgdGhpcy5lcXVhbGl0eVBlcm1pdHRlZCwgdGhpcy5pbnZlcnQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoaXMge0BsaW5rIENPTVBBUklTT04gfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIENPTVBBUklTT04uZXF1aXZhbGVudCB9LCB7QGxpbmsgQ09NUEFSSVNPTi5lcXVhbGl0eVBlcm1pdHRlZCB9IGFuZCB7QGxpbmsgQ09NUEFSSVNPTi5pbnZlcnQgfSB1c2VkIGJ5IHtAbGluayBDT01QQVJJU09OLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudCAgICAgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrIH0uXG4gICAgICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVjayB9LlxuICAgICAqIEBwYXJhbSBpbnZlcnQgICAgICAgICAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmVxdWl2YWxlbnQgPSBlcXVpdmFsZW50O1xuICAgICAgICB0aGlzLmVxdWFsaXR5UGVybWl0dGVkID0gZXF1YWxpdHlQZXJtaXR0ZWQ7XG4gICAgICAgIHRoaXMuaW52ZXJ0ID0gaW52ZXJ0O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENPTVBBUklTT04gfSBmcm9tIFwiLi4vQ09NUEFSSVNPTlwiO1xuLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTiB9LiAqL1xuZXhwb3J0IGNsYXNzIEdSRUFURVIgZXh0ZW5kcyBDT01QQVJJU09OIHtcbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBSRSB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QUkUoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBPU1QgfS4gKi9cbiAgICBzdGF0aWMgUE9TVChlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLlBPU1QoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLklOVkFSSUFOVCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5JTlZBUklBTlQoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLmNvbnN0cnVjdG9yIH0uICovXG4gICAgY29uc3RydWN0b3IoZXF1aXZhbGVudCkge1xuICAgICAgICBzdXBlcihlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICB0aGlzLmVxdWl2YWxlbnQgPSBlcXVpdmFsZW50O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENPTVBBUklTT04gfSBmcm9tIFwiLi4vQ09NUEFSSVNPTlwiO1xuLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTiB9LiAqL1xuZXhwb3J0IGNsYXNzIEdSRUFURVJfT1JfRVFVQUwgZXh0ZW5kcyBDT01QQVJJU09OIHtcbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBSRSB9LiAqL1xuICAgIHN0YXRpYyBQUkUoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QUkUoZXF1aXZhbGVudCwgdHJ1ZSwgZmFsc2UsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUE9TVCB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uUE9TVChlcXVpdmFsZW50LCB0cnVlLCBmYWxzZSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5JTlZBUklBTlQgfS4gKi9cbiAgICBzdGF0aWMgSU5WQVJJQU5UKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uSU5WQVJJQU5UKGVxdWl2YWxlbnQsIHRydWUsIGZhbHNlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLmNvbnN0cnVjdG9yIH0uICovXG4gICAgY29uc3RydWN0b3IoZXF1aXZhbGVudCkge1xuICAgICAgICBzdXBlcihlcXVpdmFsZW50LCB0cnVlLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZXF1aXZhbGVudCA9IGVxdWl2YWxlbnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ09NUEFSSVNPTiB9IGZyb20gXCIuLi9DT01QQVJJU09OXCI7XG4vKiogU2VlIHtAbGluayBDT01QQVJJU09OIH0uICovXG5leHBvcnQgY2xhc3MgTEVTUyBleHRlbmRzIENPTVBBUklTT04ge1xuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUFJFIH0uICovXG4gICAgc3RhdGljIFBSRShlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBDT01QQVJJU09OLlBSRShlcXVpdmFsZW50LCBmYWxzZSwgdHJ1ZSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QT1NUIH0uICovXG4gICAgc3RhdGljIFBPU1QoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5QT1NUKGVxdWl2YWxlbnQsIGZhbHNlLCB0cnVlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLklOVkFSSUFOVCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5JTlZBUklBTlQoZXF1aXZhbGVudCwgZmFsc2UsIHRydWUsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uY29uc3RydWN0b3IgfS4gKi9cbiAgICBjb25zdHJ1Y3RvcihlcXVpdmFsZW50KSB7XG4gICAgICAgIHN1cGVyKGVxdWl2YWxlbnQsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgdGhpcy5lcXVpdmFsZW50ID0gZXF1aXZhbGVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDT01QQVJJU09OIH0gZnJvbSBcIi4uL0NPTVBBUklTT05cIjtcbi8qKiBTZWUge0BsaW5rIENPTVBBUklTT04gfS4gKi9cbmV4cG9ydCBjbGFzcyBMRVNTX09SX0VRVUFMIGV4dGVuZHMgQ09NUEFSSVNPTiB7XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QUkUgfS4gKi9cbiAgICBzdGF0aWMgUFJFKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uUFJFKGVxdWl2YWxlbnQsIHRydWUsIHRydWUsIHBhdGgsIGRiYyk7XG4gICAgfVxuICAgIC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUE9TVCB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsIGludmVydCA9IGZhbHNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIENPTVBBUklTT04uUE9TVChlcXVpdmFsZW50LCB0cnVlLCB0cnVlLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvKiogU2VlIHtAbGluayBDT01QQVJJU09OLklOVkFSSUFOVCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQoZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gQ09NUEFSSVNPTi5JTlZBUklBTlQoZXF1aXZhbGVudCwgdHJ1ZSwgdHJ1ZSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jb25zdHJ1Y3RvciB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKGVxdWl2YWxlbnQpIHtcbiAgICAgICAgc3VwZXIoZXF1aXZhbGVudCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuZXF1aXZhbGVudCA9IGVxdWl2YWxlbnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IHR3byB7QGxpbmsgb2JqZWN0IH1zIGdvdHRhIGJlIGVxdWFsLlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgRVEgZXh0ZW5kcyBEQkMge1xuICAgIC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgZXF1YWwgdG8gdGhlIHNwZWNpZmllZCAqKmVxdWl2YWxlbnQqKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrXHRcdFRoZSB2YWx1ZSB0aGF0IGhhcyB0byBiZSBlcXVhbCB0byBpdCdzIHBvc3NpYmxlICoqZXF1aXZhbGVudCoqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdGhlIG9uZSAqKnRvQ2hlY2sqKiBoYXMgdG8gYmUgZXF1YWwgdG8gaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlXG4gICAgICogXHRcdFx0XHRcdFx0ZnVsZmlsbGVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKiBhcmUgZXF1YWwgdG8gZWFjaCBvdGhlciwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuICAgIHN0YXRpYyBjaGVja0FsZ29yaXRobShcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICB0b0NoZWNrLCBlcXVpdmFsZW50LCBpbnZlcnQpIHtcbiAgICAgICAgaWYgKCFpbnZlcnQgJiYgZXF1aXZhbGVudCAhPT0gdG9DaGVjaykge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgZXF1YWwgdG8gXCIke2VxdWl2YWxlbnR9XCJgO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnZlcnQgJiYgZXF1aXZhbGVudCA9PT0gdG9DaGVjaykge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBtdXN0IG5vdCB0byBiZSBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUFJFKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cbiAgICBlcXVpdmFsZW50LCBpbnZlcnQgPSBmYWxzZSwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIEVRLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBlcXVpdmFsZW50LCBpbnZlcnQpO1xuICAgICAgICB9LCBkYmMsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUE9TVChcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IFRvIGNoZWNrIGZvciBVTkRFRklORUQgYW5kIE5VTEwuXG4gICAgZXF1aXZhbGVudCwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gRVEuY2hlY2tBbGdvcml0aG0odmFsdWUsIGVxdWl2YWxlbnQsIGludmVydCk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXF1aXZhbGVudFx0U2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG4gICAgICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IFRvIGNoZWNrIGZvciBVTkRFRklORUQgYW5kIE5VTEwuXG4gICAgZXF1aXZhbGVudCwgaW52ZXJ0ID0gZmFsc2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IEVRKGVxdWl2YWxlbnQsIGludmVydCldLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cbiAgICAvL1xuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqLCB7QGxpbmsgRVEuZXF1aXZhbGVudCB9IGFuZCB7QGxpbmsgRVEuaW52ZXJ0IH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtfS4gKi9cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBjaGVjayBhZ2FpbnN0IE5VTEwgJiBVTkRFRklORUQuXG4gICAgY2hlY2sodG9DaGVjaykge1xuICAgICAgICByZXR1cm4gRVEuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy5lcXVpdmFsZW50LCB0aGlzLmludmVydCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgRVEgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIEVRLmVxdWl2YWxlbnQgfSB1c2VkIGJ5IHtAbGluayBFUS5jaGVjayB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIGVxdWl2YWxlbnQgU2VlIHtAbGluayBFUS5jaGVjayB9LiAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gYmUgYWJsZSB0byBtYXRjaCBVTkRFRklORUQgYW5kIE5VTEwuXG4gICAgZXF1aXZhbGVudCwgaW52ZXJ0ID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5lcXVpdmFsZW50ID0gZXF1aXZhbGVudDtcbiAgICAgICAgdGhpcy5pbnZlcnQgPSBpbnZlcnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IHRoZSBhbiB7QGxpbmsgb2JqZWN0IH1zIGdvdHRhIGJlIGFuIGluc3RhbmNlIG9mIGEgY2VydGFpbiB7QGxpbmsgSU5TVEFOQ0UucmVmZXJlbmNlIH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IFNhbHZhdG9yZSBDYWxsYXJpIChYREJDQFdhWENvZGUubmV0KSAqL1xuZXhwb3J0IGNsYXNzIElOU1RBTkNFIGV4dGVuZHMgREJDIHtcbiAgICAvKipcbiAgICAgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGNvbXBsaWVzIHRvIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiouXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVja1x0VGhlIHZhbHVlIHRoYXQgaGFzIGNvbXBseSB0byB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXG4gICAgICogQHBhcmFtIHJlZmVyZW5jZVx0VGhlIHtAbGluayBSZWdFeHAgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyBjb21wbHkgdG8gaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlXG4gICAgICogXHRcdFx0XHRcdGZ1bGZpbGxlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIG9mIHRoZSBzcGVjaWZpZWQgKip0eXBlKiosIG90aGVyd2lzZSBGQUxTRS4gKi9cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEluIG9yZGVyIHRvIHBlcmZvcm0gYW4gXCJpbnN0YW5jZW9mXCIgY2hlY2suXG4gICAgc3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHJlZmVyZW5jZSkge1xuICAgICAgICBpZiAoISh0b0NoZWNrIGluc3RhbmNlb2YgcmVmZXJlbmNlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgXCIke3JlZmVyZW5jZX1cIiBidXQgaXMgb2YgdHlwZSBcIiR7dHlwZW9mIHRvQ2hlY2t9XCJgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXG4gICAgc3RhdGljIFBSRShcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEluIG9yZGVyIHRvIHBlcmZvcm0gYW4gXCJpbnN0YW5jZW9mXCIgY2hlY2suXG4gICAgcmVmZXJlbmNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odmFsdWUsIHJlZmVyZW5jZSk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKFxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cbiAgICByZWZlcmVuY2UsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odmFsdWUsIHJlZmVyZW5jZSk7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVChcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEluIG9yZGVyIHRvIHBlcmZvcm0gYW4gXCJpbnN0YW5jZW9mXCIgY2hlY2suXG4gICAgcmVmZXJlbmNlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBJTlNUQU5DRShyZWZlcmVuY2UpXSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvL1xuICAgIC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXG4gICAgLy9cbiAgICAvKipcbiAgICAgKiBJbnZva2VzIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfSAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtfS4gKi9cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLnJlZmVyZW5jZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IHVzZWQgYnkge0BsaW5rIElOU1RBTkNFLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVmZXJlbmNlIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2sgfS4gKi9cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICBjb25zdHJ1Y3RvcihyZWZlcmVuY2UpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2UgPSByZWZlcmVuY2U7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xuLyoqXG4gKiBBIHtAbGluayBEQkMgfSBwcm92aWRpbmcge0BsaW5rIFJFR0VYIH0tY29udHJhY3RzIGFuZCBzdGFuZGFyZCB7QGxpbmsgUmVnRXhwIH0gZm9yIGNvbW1vbiB1c2UgY2FzZXMgaW4ge0BsaW5rIFJFR0VYLnN0ZEV4cCB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgUkVHRVggZXh0ZW5kcyBEQkMge1xuICAgIC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgY29tcGxpZXMgdG8gdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrXHRcdFRoZSB2YWx1ZSB0aGF0IGhhcyBjb21wbHkgdG8gdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKiBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmUgZnVsZmlsbGVkLlxuICAgICAqIEBwYXJhbSBleHByZXNzaW9uXHRUaGUge0BsaW5rIFJlZ0V4cCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIGNvbXBseSB0byBpbiBvcmRlciBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmVcbiAgICAgKiBcdFx0XHRcdFx0XHRmdWxmaWxsZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBjb21wbGllcyB3aXRoIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiosIG90aGVyd2lzZSBGQUxTRS4gKi9cbiAgICBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXhwcmVzc2lvbikge1xuICAgICAgICBpZiAoIWV4cHJlc3Npb24udGVzdCh0b0NoZWNrKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gY29tcGx5IHRvIHJlZ3VsYXIgZXhwcmVzc2lvbiBcIiR7ZXhwcmVzc2lvbn1cImA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHByZXNzaW9uXHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUFJFKGV4cHJlc3Npb24sIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXhwcmVzc2lvbik7XG4gICAgICAgIH0sIGRiYywgcGF0aCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cbiAgICAgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuICAgIHN0YXRpYyBQT1NUKGV4cHJlc3Npb24sIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oKHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gUkVHRVguY2hlY2tBbGdvcml0aG0odmFsdWUsIGV4cHJlc3Npb24pO1xuICAgICAgICB9LCBkYmMsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIGZpZWxkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xuICAgIHN0YXRpYyBJTlZBUklBTlQoZXhwcmVzc2lvbiwgcGF0aCA9IHVuZGVmaW5lZCwgZGJjID0gXCJXYVhDb2RlLkRCQ1wiKSB7XG4gICAgICAgIHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgUkVHRVgoZXhwcmVzc2lvbildLCBwYXRoLCBkYmMpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vXG4gICAgLy8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cbiAgICAvL1xuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB7QGxpbmsgUkVHRVguZXF1aXZhbGVudCB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobX0uICovXG4gICAgY2hlY2sodG9DaGVjaykge1xuICAgICAgICByZXR1cm4gUkVHRVguY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy5leHByZXNzaW9uKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBSRUdFWCB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgUkVHRVguZXhwcmVzc2lvbiB9IHVzZWQgYnkge0BsaW5rIFJFR0VYLmNoZWNrIH0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXhwcmVzc2lvbiBTZWUge0BsaW5rIFJFR0VYLmNoZWNrIH0uICovXG4gICAgY29uc3RydWN0b3IoZXhwcmVzc2lvbikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb24gPSBleHByZXNzaW9uO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuICAgIC8vICNyZWdpb24gSW4tTWV0aG9kIGNoZWNraW5nLlxuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB7QGxpbmsgUkVHRVguZXhwcmVzc2lvbiB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobX0uXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG19LlxuICAgICAqL1xuICAgIHN0YXRpYyBjaGVjayh0b0NoZWNrLCBleHByZXNzaW9uKSB7XG4gICAgICAgIGNvbnN0IGNoZWNrUmVzdWx0ID0gUkVHRVguY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXhwcmVzc2lvbik7XG4gICAgICAgIGlmICh0eXBlb2YgY2hlY2tSZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGNoZWNrUmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8qKiBTdG9yZXMgb2Z0ZW4gdXNlZCB7QGxpbmsgUmVnRXhwIH1zLiAqL1xuUkVHRVguc3RkRXhwID0ge1xuICAgIGh0bWxBdHRyaWJ1dGVOYW1lOiAvXlthLXpBLVpfOl1bYS16QS1aMC05Xy46LV0qJC8sXG4gICAgZU1haWw6IC9eW2EtekEtWjAtOS5fJSstXStAW2EtekEtWjAtOS4tXStcXC5bYS16QS1aXXsyLH0kL2ksXG4gICAgcHJvcGVydHk6IC9eWyRfQS1aYS16XVskX0EtWmEtejAtOV0qJC8sXG4gICAgdXJsOiAvXig/Oig/Omh0dHA6fGh0dHBzP3xmdHApOlxcL1xcLyk/KD86XFxTKyg/OjpcXFMqKT9AKT8oPzpsb2NhbGhvc3R8KD86W2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/XFwuKStbYS16QS1aXXsyLH0pKD86OlxcZHsyLDV9KT8oPzpcXC8oPzpbXFx3XFwtXFwuXSpcXC8pKltcXHdcXC1cXC5dKyg/OlxcP1xcUyopPyg/OiNcXFMqKT8pPyQvaSxcbiAgICBrZXlQYXRoOiAvXihbYS16QS1aXyRdW2EtekEtWjAtOV8kXSpcXC4pKlthLXpBLVpfJF1bYS16QS1aMC05XyRdKiQvLFxuICAgIGRhdGU6IC9eXFxkezEsNH1bLlxcLy1dXFxkezEsMn1bLlxcLy1dXFxkezEsNH0kL2ksXG4gICAgZGF0ZUZvcm1hdDogL14oKER7MSwyfVsuLy1dTXsxLDJ9Wy4vLV1ZezEsNH0pfChNezEsMn1bLi8tXUR7MSwyfVsuLy1dWXsxLDR9KXxZezEsNH1bLi8tXUR7MSwyfVsuLy1dTXsxLDJ9fChZezEsNH1bLi8tXU17MSwyfVsuLy1dRHsxLDJ9KSkkL2ksXG4gICAgY3NzU2VsZWN0b3I6IC9eKD86XFwqfCNbXFx3LV0rfFxcLltcXHctXSt8KD86W1xcdy1dK3xcXCopKD86Oig/OltcXHctXSsoPzpcXChbXFx3LV0rXFwpKT8pKyk/KD86XFxbKD86W1xcdy1dKyg/Oig/Oj18fj18XFx8PXxcXCo9fFxcJD18XFxePSlcXHMqKD86XCJbXlwiXSpcInwnW14nXSonfFtcXHctXSspXFxzKik/KT9cXF0pK3xcXFtcXHMqW1xcdy1dK1xccyo9XFxzKig/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXFx3LV0rKVxccypcXF0pKD86LFxccyooPzpcXCp8I1tcXHctXSt8XFwuW1xcdy1dK3woPzpbXFx3LV0rfFxcKikoPzo6KD86W1xcdy1dKyg/OlxcKFtcXHctXStcXCkpPykrKT8oPzpcXFsoPzpbXFx3LV0rKD86KD86PXx+PXxcXHw9fFxcKj18XFwkPXxcXF49KVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqKT8pP1xcXSkrfFxcW1xccypbXFx3LV0rXFxzKj1cXHMqKD86XCJbXlwiXSpcInwnW14nXSonfFtcXHctXSspXFxzKlxcXSkpKiQvLFxufTtcbiIsImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcbi8qKlxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbiB7QGxpbmsgb2JqZWN0IH1zIGdvdHRhIGJlIG9mIGNlcnRhaW4ge0BsaW5rIFRZUEUudHlwZSB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBBdXRob3I6IFx0XHRTYWx2YXRvcmUgQ2FsbGFyaSAoQ2FsbGFyaUBXYVhDb2RlLm5ldCkgLyAyMDI1XG4gKiBNYWludGFpbmVyOlx0U2FsdmF0b3JlIENhbGxhcmkgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgVFlQRSBleHRlbmRzIERCQyB7XG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBvZiB0aGUgKip0eXBlKiogc3BlY2lmaWVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRvQ2hlY2tcdFRoZSB7QGxpbmsgT2JqZWN0IH0gd2hpY2gncyAqKnR5cGUqKiB0byBjaGVjay5cbiAgICAgKiBAcGFyYW0gdHlwZVx0XHRUaGUgdHlwZSB0aGUge0BsaW5rIG9iamVjdH0gKip0b0NoZWNrKiogaGFzIHRvIGJlIG9mLlxuICAgICAqXG4gICAgICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgb2YgdGhlIHNwZWNpZmllZCAqKnR5cGUqKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IGZvciBkeW5hbWljIHR5cGUgY2hlY2tpbmcgb2YgYWxzbyBVTkRFRklORUQuXG4gICAgc3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHR5cGUpIHtcbiAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy91c2VWYWxpZFR5cGVvZjogTmVjZXNzYXJ5XG4gICAgICAgIGlmICh0eXBlb2YgdG9DaGVjayAhPT0gdHlwZSkge1xuICAgICAgICAgICAgcmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgb2YgdHlwZSBcIiR7dHlwZX1cIiBidXQgaXMgb2YgdHlwZSBcIiR7dHlwZW9mIHRvQ2hlY2t9XCJgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcbiAgICAgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUFJFKHR5cGUsIHBhdGggPSB1bmRlZmluZWQsIGRiYyA9IFwiV2FYQ29kZS5EQkNcIikge1xuICAgICAgICByZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbigodmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBUWVBFLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCB0eXBlKTtcbiAgICAgICAgfSwgZGJjLCBwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG4gICAgICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cbiAgICAgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cbiAgICBzdGF0aWMgUE9TVCh0eXBlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKCh2YWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIFRZUEUuY2hlY2tBbGdvcml0aG0odmFsdWUsIHR5cGUpO1xuICAgICAgICB9LCBkYmMsIHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuICAgICAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXG4gICAgICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXG4gICAgc3RhdGljIElOVkFSSUFOVCh0eXBlLCBwYXRoID0gdW5kZWZpbmVkLCBkYmMgPSBcIldhWENvZGUuREJDXCIpIHtcbiAgICAgICAgcmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBUWVBFKHR5cGUpXSwgcGF0aCwgZGJjKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cbiAgICAvL1xuICAgIC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXG4gICAgLy9cbiAgICAvKipcbiAgICAgKiBJbnZva2VzIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIFRZUEUudHlwZSB9IC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxuICAgICAqXG4gICAgICogQHJldHVybnMgU2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtfS4gKi9cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICBjaGVjayh0b0NoZWNrKSB7XG4gICAgICAgIHJldHVybiBUWVBFLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMudHlwZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgVFlQRSB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgVFlQRS50eXBlIH0gdXNlZCBieSB7QGxpbmsgVFlQRS5jaGVjayB9LlxuICAgICAqXG4gICAgICogQHBhcmFtIHR5cGUgU2VlIHtAbGluayBUWVBFLmNoZWNrIH0uICovXG4gICAgY29uc3RydWN0b3IodHlwZSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIH1cbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwidmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufTtcbnZhciBfX3BhcmFtID0gKHRoaXMgJiYgdGhpcy5fX3BhcmFtKSB8fCBmdW5jdGlvbiAocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XG59O1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4vREJDXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCIuL0RCQy9SRUdFWFwiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwiLi9EQkMvRVFcIjtcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwiLi9EQkMvVFlQRVwiO1xuaW1wb3J0IHsgQUUgfSBmcm9tIFwiLi9EQkMvQUVcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcIi4vREJDL0lOU1RBTkNFXCI7XG5pbXBvcnQgeyBHUkVBVEVSIH0gZnJvbSBcIi4vREJDL0NPTVBBUklTT04vR1JFQVRFUlwiO1xuaW1wb3J0IHsgR1JFQVRFUl9PUl9FUVVBTCB9IGZyb20gXCIuL0RCQy9DT01QQVJJU09OL0dSRUFURVJfT1JfRVFVQUxcIjtcbmltcG9ydCB7IExFU1MgfSBmcm9tIFwiLi9EQkMvQ09NUEFSSVNPTi9MRVNTXCI7XG5pbXBvcnQgeyBMRVNTX09SX0VRVUFMIH0gZnJvbSBcIi4vREJDL0NPTVBBUklTT04vTEVTU19PUl9FUVVBTFwiO1xuLyoqIERlbW9uc3RyYXRpdmUgdXNlIG9mICoqRCoqZXNpZ24gKipCKip5ICoqQyoqb250cmFjdCBEZWNvcmF0b3JzICovXG5leHBvcnQgY2xhc3MgRGVtbyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8vICNyZWdpb24gQ2hlY2sgUHJvcGVydHkgRGVjb3JhdG9yXG4gICAgICAgIHRoaXMudGVzdFByb3BlcnR5ID0gXCJhXCI7XG4gICAgICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgQ29tcGFyaXNvblxuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFByb3BlcnR5IERlY29yYXRvclxuICAgIC8vICNyZWdpb24gQ2hlY2sgUGFyYW1ldGVyLiAmIFJldHVybnZhbHVlIERlY29yYXRvclxuICAgIHRlc3RQYXJhbXZhbHVlQW5kUmV0dXJudmFsdWUoYSkge1xuICAgICAgICByZXR1cm4gYHh4eHgke2F9YDtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBQYXJhbWV0ZXIuICYgUmV0dXJudmFsdWUgRGVjb3JhdG9yXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBSZXR1cm52YWx1ZSBEZWNvcmF0b3JcbiAgICB0ZXN0UmV0dXJudmFsdWUoYSkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBSZXR1cm52YWx1ZSBEZWNvcmF0b3JcbiAgICAvLyAjcmVnaW9uIENoZWNrIEVRLURCQyAmIFBhdGggdG8gcHJvcGVydHkgb2YgUGFyYW1ldGVyLXZhbHVlXG4gICAgdGVzdEVRQW5kUGF0aChvKSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIEVRLURCQyAmIFBhdGggdG8gcHJvcGVydHkgb2YgUGFyYW1ldGVyLXZhbHVlXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBFUS1EQkMgJiBQYXRoIHRvIHByb3BlcnR5IG9mIFBhcmFtZXRlci12YWx1ZSB3aXRoIEludmVyc2lvblxuICAgIHRlc3RFUUFuZFBhdGhXaXRoSW52ZXJzaW9uKG8pIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgRVEtREJDICYgUGF0aCB0byBwcm9wZXJ0eSBvZiBQYXJhbWV0ZXItdmFsdWUgd2l0aCBJbnZlcnNpb25cbiAgICAvLyAjcmVnaW9uIENoZWNrIFRZUEVcbiAgICB0ZXN0VFlQRShvKSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIFRZUEVcbiAgICAvLyAjcmVnaW9uIENoZWNrIEFFXG4gICAgdGVzdEFFKHgpIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgQUVcbiAgICAvLyAjcmVnaW9uIENoZWNrIFJFR0VYIHdpdGggQUVcbiAgICB0ZXN0UkVHRVhXaXRoQUUoeCkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBSRUdFWCB3aXRoIEFFXG4gICAgLy8gI3JlZ2lvbiBDaGVjayBJTlNUQU5DRVxuICAgIHRlc3RJTlNUQU5DRShjYW5kaWRhdGUpIHsgfVxuICAgIC8vICNlbmRyZWdpb24gQ2hlY2sgSU5TVEFOQ0VcbiAgICAvLyAjcmVnaW9uIENoZWNrIEFFIFJhbmdlXG4gICAgdGVzdEFFUmFuZ2UoeCkgeyB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDaGVjayBBRSBSYW5nZVxuICAgIC8vICNyZWdpb24gQ2hlY2sgQUUgSW5kZXhcbiAgICB0ZXN0QUVJbmRleCh4KSB7IH1cbiAgICAvLyAjZW5kcmVnaW9uIENoZWNrIEFFIEluZGV4XG4gICAgLy8gI3JlZ2lvbiBDaGVjayBDb21wYXJpc29uXG4gICAgdGVzdEdSRUFURVIoaW5wdXQpIHsgfVxuICAgIHRlc3RHUkVBVEVSX09SX0VRVUFMKGlucHV0KSB7IH1cbiAgICB0ZXN0TEVTUyhpbnB1dCkgeyB9XG4gICAgdGVzdExFU1NfT1JfRVFVQUwoaW5wdXQpIHsgfVxufVxuX19kZWNvcmF0ZShbXG4gICAgUkVHRVguSU5WQVJJQU5UKC9eYSQvKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgT2JqZWN0KVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdFByb3BlcnR5XCIsIHZvaWQgMCk7XG5fX2RlY29yYXRlKFtcbiAgICBSRUdFWC5QT1NUKC9eeHh4eC4qJC8pLFxuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBSRUdFWC5QUkUoL2hvbGxhKi9nKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW1N0cmluZ10pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCBTdHJpbmcpXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0UGFyYW12YWx1ZUFuZFJldHVybnZhbHVlXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgUkVHRVguUE9TVCgvXnh4eHguKiQvKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbU3RyaW5nXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIFN0cmluZylcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RSZXR1cm52YWx1ZVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBFUS5QUkUoXCJTRUxFQ1RcIiwgZmFsc2UsIFwidGFnTmFtZVwiKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0hUTUxFbGVtZW50XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RFUUFuZFBhdGhcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgRVEuUFJFKFwiU0VMRUNUXCIsIHRydWUsIFwidGFnTmFtZVwiKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0hUTUxFbGVtZW50XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RFUUFuZFBhdGhXaXRoSW52ZXJzaW9uXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIFRZUEUuUFJFKFwic3RyaW5nXCIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbT2JqZWN0XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RUWVBFXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEFFLlBSRShbbmV3IFRZUEUoXCJzdHJpbmdcIildKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RBRVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBBRS5QUkUobmV3IFJFR0VYKC9eKD9pOihOT1cpfChbKy1dXFxkK1tkbXldKSkkL2kpKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5XSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RSRUdFWFdpdGhBRVwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IFRlc3RcbiAgICAsXG4gICAgX19wYXJhbSgwLCBJTlNUQU5DRS5QUkUoRGF0ZSkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtPYmplY3RdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdElOU1RBTkNFXCIsIG51bGwpO1xuX19kZWNvcmF0ZShbXG4gICAgREJDLlBhcmFtdmFsdWVQcm92aWRlcixcbiAgICBfX3BhcmFtKDAsIEFFLlBSRShbbmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXmFiYyQvKV0sIDEsIDIpKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbQXJyYXldKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdEFFUmFuZ2VcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgQUUuUFJFKFtuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eYWJjJC8pXSwgMSkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtBcnJheV0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0QUVJbmRleFwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBHUkVBVEVSLlBSRSgyKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW051bWJlcl0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0R1JFQVRFUlwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBHUkVBVEVSX09SX0VRVUFMLlBSRSgyKSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW051bWJlcl0pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXG5dLCBEZW1vLnByb3RvdHlwZSwgXCJ0ZXN0R1JFQVRFUl9PUl9FUVVBTFwiLCBudWxsKTtcbl9fZGVjb3JhdGUoW1xuICAgIERCQy5QYXJhbXZhbHVlUHJvdmlkZXIsXG4gICAgX19wYXJhbSgwLCBMRVNTLlBSRSgyMCkpLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtOdW1iZXJdKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxuXSwgRGVtby5wcm90b3R5cGUsIFwidGVzdExFU1NcIiwgbnVsbCk7XG5fX2RlY29yYXRlKFtcbiAgICBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyLFxuICAgIF9fcGFyYW0oMCwgTEVTU19PUl9FUVVBTC5QUkUoMjApKSxcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbTnVtYmVyXSksXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcbl0sIERlbW8ucHJvdG90eXBlLCBcInRlc3RMRVNTX09SX0VRVUFMXCIsIG51bGwpO1xuY29uc3QgZGVtbyA9IG5ldyBEZW1vKCk7XG50cnkge1xuICAgIGRlbW8udGVzdFByb3BlcnR5ID0gXCJhYmRcIjtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJJTlZBUklBTlQgSW5mcmluZ2VtZW50XCIsIFwiT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RQcm9wZXJ0eSA9IFwiYVwiO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIklOVkFSSUFOVCBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xuZGVtby50ZXN0UGFyYW12YWx1ZUFuZFJldHVybnZhbHVlKFwiaG9sbGFcIik7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiUEFSQU1FVEVSLSAmIFJFVFVSTlZBTFVFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdFBhcmFtdmFsdWVBbmRSZXR1cm52YWx1ZShcInl5eXlcIik7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiUEFSQU1FVEVSLSAmIFJFVFVSTlZBTFVFIEluZnJpbmdlbWVudFwiLCBcIk9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0UmV0dXJudmFsdWUoXCJ4eHh4XCIpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIlJFVFVSTlZBTFVFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdFJldHVybnZhbHVlKFwieXl5eVwiKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJSRVRVUk5WQUxVRSBJbmZyaW5nZW1lbnRcIiwgXCJPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdEVRQW5kUGF0aChkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VsZWN0XCIpKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJFUSB3aXRoIFBhdGggSW5mcmluZ2VtZW50IE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEVRQW5kUGF0aFdpdGhJbnZlcnNpb24oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKSk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiRVEgd2l0aCBQYXRoIGFuZCBJbnZlcnNpb24gSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0VFlQRShcInhcIik7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiVFlQRSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RUWVBFKDApO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlRZUEUgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0QUUoW1wiMTFcIiwgXCIxMFwiLCBcImJcIl0pO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIkFFIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEFFKFtcIjExXCIsIDExLCBcImJcIl0pO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkFFIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdFJFR0VYV2l0aEFFKFtcIisxZFwiLCBcIk5PV1wiLCBcIi0xMHlcIl0pO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIlJFR0VYIHdpdGggQUUgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0UkVHRVhXaXRoQUUoW1wiKzFkXCIsIFwiKzVkXCIsIFwiLXgxMHlcIl0pO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIlJFR0VYIHdpdGggQUUgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0SU5TVEFOQ0UobmV3IERhdGUoKSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiSU5TVEFOQ0UgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0SU5TVEFOQ0UoZGVtbyk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5TVEFOQ0UgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuZGVtby50ZXN0QUVSYW5nZShbMTEsIFwiYWJjXCIsIFwiYWJjXCJdKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJBRSBSYW5nZSBPS1wiKTtcbmNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RBRVJhbmdlKFsxMSwgXCJhYmNcIiwgL2EvZ10pO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkFFIFJhbmdlIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdEFFSW5kZXgoWzExLCBcImFiY1wiLCBcImFiY1wiXSk7XG5jb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbmNvbnNvbGUubG9nKFwiQUUgSW5kZXggT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0QUVJbmRleChbXCIxMVwiLCAxMiwgXCIvYS9nXCJdKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJBRSBJbmRleCBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RHUkVBVEVSKDExKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJHUkVBVEVSIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdEdSRUFURVIoMik7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiR1JFQVRFUiBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RHUkVBVEVSX09SX0VRVUFMKDIpO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIkdSRUFURVJfT1JfRVFVQUwgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0R1JFQVRFUl9PUl9FUVVBTCgxKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJHUkVBVEVSX09SX0VRVUFMIEluZnJpbmdlbWVudCBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmRlbW8udGVzdExFU1MoMTApO1xuY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG5jb25zb2xlLmxvZyhcIkxFU1MgT0tcIik7XG5jb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbnRyeSB7XG4gICAgZGVtby50ZXN0TEVTUygyMCk7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiTEVTUyBJbmZyaW5nZW1lbnQgT0tcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5kZW1vLnRlc3RMRVNTX09SX0VRVUFMKDIwKTtcbmNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuY29uc29sZS5sb2coXCJMRVNTIE9LXCIpO1xuY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG50cnkge1xuICAgIGRlbW8udGVzdExFU1NfT1JfRVFVQUwoMjEpO1xufVxuY2F0Y2ggKFgpIHtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIkxFU1NfT1JfRVFVQUwgSW5mcmluZ2VtZW50IE9LXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxuLy8gI3JlZ2lvbiBJbmFjdGl2aXR5IENoZWNrc1xud2luZG93LldhWENvZGUuREJDLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrUHJlY29uZGl0aW9ucyA9IGZhbHNlO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RMRVNTX09SX0VRVUFMKDIxKTtcbiAgICBjb25zb2xlLmxvZyhcIuKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhOKMhFwiKTtcbiAgICBjb25zb2xlLmxvZyhcIklOQUNUSVZFIFBSRUNPTkRJVElPTlMgT0tcIik7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5BQ1RJVkUgUFJFQ09ORElUSU9OUyBGQUlMRURcIik7XG4gICAgY29uc29sZS5sb2coWCk7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG53aW5kb3cuV2FYQ29kZS5EQkMuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tQb3N0Y29uZGl0aW9ucyA9IGZhbHNlO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RSZXR1cm52YWx1ZShcInFxcXFxXCIpO1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5BQ1RJVkUgUE9TVENPTkRJVElPTlMgT0tcIik7XG4gICAgY29uc29sZS5sb2coXCJeXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5cIik7XG59XG5jYXRjaCAoWCkge1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5BQ1RJVkUgUE9TVENPTkRJVElPTlMgRkFJTEVEXCIpO1xuICAgIGNvbnNvbGUubG9nKFgpO1xuICAgIGNvbnNvbGUubG9nKFwiXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXCIpO1xufVxud2luZG93LldhWENvZGUuREJDLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cyA9IGZhbHNlO1xudHJ5IHtcbiAgICBkZW1vLnRlc3RQcm9wZXJ0eSA9IFwiYlwiO1xuICAgIGNvbnNvbGUubG9nKFwi4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyE4oyEXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiSU5BQ1RJVkUgSU5WQVJJQU5UUyBPS1wiKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbmNhdGNoIChYKSB7XG4gICAgY29uc29sZS5sb2coXCLijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijITijIRcIik7XG4gICAgY29uc29sZS5sb2coXCJJTkFDVElWRSBJTlZBUklBTlRTIEZBSUxFRFwiKTtcbiAgICBjb25zb2xlLmxvZyhYKTtcbiAgICBjb25zb2xlLmxvZyhcIl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXlwiKTtcbn1cbi8vICNlbmRyZWdpb24gSW5hY3Rpdml0eSBDaGVja3NcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==