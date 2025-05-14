/**
 * Provides a **D**esign **B**y **C**ontract Framework using decorators.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class DBC {
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
