/**
 * Provides a **D**esign **B**y **C**ontract Framework using decorators.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class DBC {
	// #region Internal caches.
	private static dbcCache: Map<string, DBC> = new Map();
	private static pathTokenCache: Map<string, string[]> = new Map();
	private static getHost(): unknown {
		return typeof window !== "undefined" ? window : globalThis;
	}
	private static getDBC(dbc: string | undefined): DBC {
		const path = dbc ?? "WaXCode.DBC";
		if (DBC.dbcCache.has(path)) {
			return DBC.dbcCache.get(path);
		}
		const resolved = DBC.resolveDBCPath(DBC.getHost(), path);
		if (resolved) {
			DBC.dbcCache.set(path, resolved);
		}
		return resolved;
	}
	// #endregion Internal caches.
	// #region Parameter-value requests.
	/** Stores all request for parameter values registered by {@link decPrecondition }. */
	static paramValueRequests: Map<
		string,
		// biome-ignore lint/suspicious/noExplicitAny: Gotta be any since parameter-values may be undefined.
		Map<number, Array<(value: any) => undefined>>
	> = new Map<
		string,
		// biome-ignore lint/suspicious/noExplicitAny: Gotta be any since parameter-values may be undefined.
		Map<number, Array<(value: any) => undefined>>
	>();
	/**
	 * Generate a unique key for storing parameter value requests.
	 * Format: "ClassName:methodName"
	 */
	private static getRequestKey(target: object, methodName: string | symbol): string {
		const className = typeof target === 'function' ? target.name : target.constructor?.name || 'Unknown';
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
	protected static requestParamValue(
		target: object,
		methodName: string | symbol,
		index: number,
		// biome-ignore lint/suspicious/noExplicitAny: Gotta be any since parameter-values may be undefined.
		receptor: (value: any) => undefined,
	): undefined {
		const key = DBC.getRequestKey(target, methodName);

		if (DBC.paramValueRequests.has(key)) {
			if (DBC.paramValueRequests.get(key).has(index)) {
				DBC.paramValueRequests.get(key).get(index).push(receptor);
			} else {
				DBC.paramValueRequests.get(key).set(index, new Array<(value: unknown) => undefined>(receptor));
			}
		} else {
			DBC.paramValueRequests.set(
				key,
				new Map<number, Array<(value: unknown) => undefined>>([
					[index, new Array<(value: unknown) => undefined>(receptor)],
				]),
			);
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
	public static ParamvalueProvider(
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	): PropertyDescriptor {
		const originalMethod = descriptor.value;
		const isStatic = typeof target === 'function';
		// biome-ignore lint/suspicious/noExplicitAny: Gotta be any since parameter-values may be undefined.
		descriptor.value = function (...args: any[]) {
			// #region   Check if a value of one of the method's parameter has been requested and pass it to the
			//           receptor, if so.
			const actualTarget = isStatic ? this : (this as any).constructor;
			const key = DBC.getRequestKey(actualTarget, propertyKey);

			if (DBC.paramValueRequests.has(key)) {
				for (const index of DBC.paramValueRequests.get(key).keys()) {
					if (index < args.length) {
						for (const receptor of DBC.paramValueRequests.get(key).get(index)) {
							receptor(args[index]);
						}
					}
				}
			} else {
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
	public static decClassInvariant(
		contracts: Array<{
			check: (toCheck: unknown | null | undefined) => boolean | string;
		}>,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
			if (!DBC.getDBC(dbc).executionSettings.checkInvariants) {
				return;
			}
			const originalSetter = descriptor.set;
			const originalGetter = descriptor.get;
			// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
			let value: any;
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
							DBC.getDBC(dbc).reportFieldInfringement(
								result,
								target as object,
								path,
								propertyKey as string,
								realValue,
							);
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
							DBC.getDBC(dbc).reportFieldInfringement(
								result,
								target as object,
								path,
								propertyKey as string,
								realValue,
							);
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
	public static decInvariant(
		contracts: Array<{
			check: (toCheck: unknown | null | undefined) => boolean | string;
		}>,
		path: string | undefined = undefined,
		dbc: string | undefined = undefined,
		hint: string | undefined = undefined,
	) {
		return (target: unknown, propertyKey: string | symbol) => {
			if (!DBC.getDBC(dbc).executionSettings.checkInvariants) {
				return;
			}
			// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
			let value: any;
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
							DBC.getDBC(dbc).reportFieldInfringement(
								result,
								target as object,
								path,
								propertyKey as string,
								realValue,
								hint
							);
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
	public static decPostcondition(
		// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
		check: (toCheck: any, object, string) => boolean | string,
		dbc: string | undefined = undefined,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
	) {
		return (
			target: object,
			propertyKey: string,
			descriptor: PropertyDescriptor,
		): PropertyDescriptor => {
			const originalMethod = descriptor.value;
			// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
			descriptor.value = (...args: any[]) => {
				if (!DBC.getDBC(dbc).executionSettings.checkPostconditions) {
					return;
				}
				// biome-ignore lint/complexity/noThisInStatic: <explanation>
				const result = originalMethod.apply(this, args);
				const realValue = path ? DBC.resolve(result, path) : result;
				const checkResult = check(realValue, target, propertyKey);

				if (typeof checkResult === "string") {
					DBC.getDBC(dbc).reportReturnvalueInfringement(
						checkResult,
						target,
						path,
						propertyKey,
						realValue,
						hint
					);
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
	protected static decPrecondition(
		check: (unknown, object, string, number) => boolean | string,
		dbc: string | undefined = undefined,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
	): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		const paths = path ? path.replace(/ /g, "").split("::") : [undefined];
		return (
			target: object,
			methodName: string | symbol,
			parameterIndex: number,
		): void => {
			DBC.requestParamValue(
				target,
				methodName,
				parameterIndex,
				(value: unknown) => {
					if (!DBC.getDBC(dbc).executionSettings.checkPreconditions) {
						return;
					}

					for (const singlePath of paths) {
						const realValue = singlePath ? DBC.resolve(value, singlePath) : value;
						const result = check(realValue, target, methodName, parameterIndex);

						if (typeof result === "string") {
							DBC.getDBC(dbc).reportParameterInfringement(
								result,
								target,
								singlePath,
								methodName as string,
								parameterIndex,
								realValue,
								hint
							);
						}
					}
				},
			);
		};
	}
	// #endregion Precondition
	// #endregion Decorator
	// #region Execution Handling
	/** Stores settings concerning the execution of checks. */
	public executionSettings: {
		checkPreconditions: boolean;
		checkPostconditions: boolean;
		checkInvariants: boolean;
	} = {
			checkPreconditions: true,
			checkPostconditions: true,
			checkInvariants: true,
		};
	// #endregion Execution Handling
	// #region Warning handling.
	/** Stores settings concerning warnings. */
	public warningSettings: {
		logToConsole: boolean;
	} = { logToConsole: true };
	/**
	 * Reports a warning.
	 *
	 * @param message The message containing the warning. */
	protected reportWarning(message: string): undefined {
		if (this.warningSettings.logToConsole) {
			console.warn(message);
		}
	}
	// #endregion Warning handling.
	// #region infringement handling.
	/** Stores the settings concerning infringements */
	public infringementSettings: {
		throwException: boolean;
		logToConsole: boolean;
	} = { throwException: true, logToConsole: false };
	/**
	 * Reports an infringement according to the {@link infringementSettings } also generating a proper {@link string }-wrapper
	 * for the given "message" & violator.
	 *
	 * @param message	The {@link string } describing the infringement and it's provenience.
	 * @param violator 	The {@link string } describing or naming the violator. */
	protected reportInfringement(
		message: string,
		violator: string,
		target: object,
		value: unknown,
		path: string,
		hint: string | undefined = undefined,
	): undefined {
		const finalMessage: string = `[ From "${violator}"${typeof target === "function" ? ` in "${target.name}"` : typeof target === "object" && target !== null && typeof target.constructor === "function" ? ` in "${target.constructor.name}"` : `in "${target}"`}${path ? ` > "${path}"` : ""}: ${message} ${hint ? `✨ ${hint} ✨` : ""}]`;

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
	public reportParameterInfringement(
		message: string,
		target: object,
		path: string,
		method: string,
		index: number,
		value: unknown,
		hint: string | undefined = undefined,
	): undefined {
		const properIndex = index + 1;

		this.reportInfringement(
			`[ Parameter-value "${value}" of the ${properIndex}${properIndex === 1 ? "st" : properIndex === 2 ? "nd" : properIndex === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${message} ]`,
			method,
			target,
			value,
			path,
			hint
		);
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
	public reportFieldInfringement(
		message: string,
		target: object,
		path: string,
		key: string,
		value: unknown,
		hint: string | undefined = undefined,
	): undefined {
		this.reportInfringement(
			`[ New value for "${key}"${path === undefined ? "" : `.${path}`} with value "${value}" did not fulfill one of it's contracts: ${message} ]`,
			key,
			target,
			value,
			path,
		);
	}
	/**
	 * Reports a returnvalue-infringement according via {@link reportInfringement } also generating a proper {@link string }-wrapper
	 * for the given "message","method" & value.
	 *
	 * @param message	The {@link string } describing the infringement and it's provenience.
	 * @param method 	The {@link string } describing or naming the violator.
	 * @param value		The parameter's value. */
	public reportReturnvalueInfringement(
		message: string,
		target: object,
		path: string,
		method: string,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		value: any,
		hint: string | undefined = undefined,
	) {
		this.reportInfringement(
			`[ Return-value "${value}" did not fulfill one of it's contracts: ${message} ]`,
			method,
			target,
			value,
			path,
			hint
		);
	}
	// #region Classes
	// #region Errors
	/** An {@link Error } to be thrown whenever an infringement is detected. */
	public static Infringement = class extends Error {
		/**
		 * Constructs this {@link Error } by tagging the specified message-{@link string } as an XDBC-Infringement.
		 *
		 * @param message The {@link string } describing the infringement. */
		constructor(message: string) {
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
	static resolveDBCPath = (obj, path): DBC =>
		path
			?.split(".")
			.reduce((accumulator, current) => accumulator[current], obj);
	/**
	 * Constructs this {@link DBC } by setting the {@link DBC.infringementSettings }, define the **WaXCode** namespace in
	 * **window** if not yet available and setting the property **DBC** in there to the instance of this {@link DBC }.
	 *
	 * @param infringementSettings 	See {@link DBC.infringementSettings }.
	 * @param executionSettings		See {@link DBC.executionSettings }. */
	constructor(
		infringementSettings: {
			throwException: boolean;
			logToConsole: boolean;
		} = { throwException: true, logToConsole: false },
		executionSettings: {
			checkPreconditions: boolean;
			checkPostconditions: boolean;
			checkInvariants: boolean;
		} = {
				checkPreconditions: true,
				checkPostconditions: true,
				checkInvariants: true,
			},
	) {
		this.infringementSettings = infringementSettings;

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		if ((DBC.getHost() as any).WaXCode === undefined) (DBC.getHost() as any).WaXCode = {};
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		(DBC.getHost() as any).WaXCode.DBC = this;
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
	public static resolve(toResolveFrom: unknown, path: string) {
		if (!toResolveFrom || typeof path !== "string") { return undefined; }

		const cachedParts = DBC.pathTokenCache.get(path);
		const parts = cachedParts ?? path.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split(".");

		if (!cachedParts) { DBC.pathTokenCache.set(path, parts); }

		let current = toResolveFrom;

		for (const part of parts) {
			if (current === null || typeof current === "undefined") { return undefined; }

			const methodMatch = part.match(/(\w+)\((.*)\)/);

			if (methodMatch) {
				const methodName = methodMatch[1];
				const argsStr = methodMatch[2];
				const args = argsStr.split(",").map((arg) => arg.trim());

				if (typeof current[methodName] === "function") {
					current = current[methodName].apply(current, args);
				} else { return undefined; }
			} else {
				if (typeof window !== "undefined" && typeof HTMLElement !== "undefined" && current instanceof HTMLElement && part.startsWith("@")) {
					current = current.getAttribute(part.slice(1));
				} else if (typeof current === "object" && current !== null && part in current) { current = current[part]; }
				else if (typeof window !== "undefined" && typeof HTMLElement !== "undefined" && current instanceof HTMLElement) { current = undefined; }
				else { current = undefined; }
			}
		}

		return current;
	}
}
// Set the main instance with standard **DBC.infringementSettings**.
new DBC();
