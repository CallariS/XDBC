/**
 * Provides a **D**esign **B**y **C**ontract Framework using decorators.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class DBC {
	// #region Internal caches.
	private static readonly MAX_CACHE_SIZE = 1000;
	private static dbcCache: Map<string, DBC> = new Map();
	private static pathTokenCache: Map<string, string[]> = new Map();
	/** Evicts the oldest entry if the cache exceeds the maximum size. */
	private static evictIfNeeded<K, V>(cache: Map<K, V>): void {
		if (cache.size > DBC.MAX_CACHE_SIZE) {
			const oldest = cache.keys().next().value;
			if (oldest !== undefined) cache.delete(oldest);
		}
	}
	private static getHost(): unknown {
		return typeof window !== "undefined" ? window : globalThis;
	}
	private static getDBC(dbc: string | DBC | undefined): DBC {
		if (dbc instanceof DBC) return dbc;
		const path = dbc ?? "WaXCode.DBC";
		if (DBC.dbcCache.has(path)) {
			return DBC.dbcCache.get(path) as DBC;
		}
		const resolved = DBC.resolveDBCPath(DBC.getHost(), path);
		if (resolved) {
			DBC.evictIfNeeded(DBC.dbcCache);
			DBC.dbcCache.set(path, resolved);
			return resolved;
		}
		throw new Error(`[XDBC] DBC instance not found at path "${path}". Ensure a DBC instance is registered there.`);
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
			const paramMap = DBC.paramValueRequests.get(key)!;
			if (paramMap.has(index)) {
				paramMap.get(index)!.push(receptor);
			} else {
				paramMap.set(index, new Array<(value: unknown) => undefined>(receptor));
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
				const paramMap = DBC.paramValueRequests.get(key)!;
				for (const index of paramMap.keys()) {
					if (index < args.length) {
						for (const receptor of paramMap.get(index)!) {
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
		let dbcInstance: DBC | undefined;
		return (target: unknown, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
			if (!dbcInstance) dbcInstance = DBC.getDBC(dbc);
			if (!dbcInstance.executionSettings.checkInvariants) {
				return;
			}
			const originalSetter = descriptor.set;
			const originalGetter = descriptor.get;
			// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
			let value: any;
			// #region Replace original property.
			Object.defineProperty(target, propertyKey, {
				get() {
					if (!dbcInstance!.executionSettings.checkInvariants) {
						return;
					}

					const realValue = path ? DBC.resolve(this, path) : this;
					// #region Check if all "contracts" are fulfilled.
					for (const contract of contracts) {
						const result = contract.check(realValue);

						if (typeof result === "string") {
							dbcInstance!.reportFieldInfringement(
								result,
								target as object,
								path,
								propertyKey as string,
								realValue,
							);
						}
					}
					// #endregion Check if all "contracts" are fulfilled.
					return originalGetter ? (originalGetter as any)[propertyKey] : value;
				},
				set(newValue) {
					if (!dbcInstance!.executionSettings.checkInvariants) {
						return;
					}

					const realValue = path ? DBC.resolve(this, path) : this;
					// #region Check if all "contracts" are fulfilled.
					for (const contract of contracts) {
						const result = contract.check(realValue);

						if (typeof result === "string") {
							dbcInstance!.reportFieldInfringement(
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
		let dbcInstance: DBC | undefined;
		return (target: unknown, propertyKey: string | symbol) => {
			if (!dbcInstance) dbcInstance = DBC.getDBC(dbc);
			if (!dbcInstance.executionSettings.checkInvariants) {
				return;
			}
			// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
			let value: any;
			// #region Replace original property.
			Object.defineProperty(target, propertyKey, {
				set(newValue) {
					if (!dbcInstance!.executionSettings.checkInvariants) {
						return;
					}

					const realValue = path ? DBC.resolve(newValue, path) : newValue;
					// #region Check if all "contracts" are fulfilled.
					for (const contract of contracts) {
						const result = contract.check(realValue);

						if (typeof result === "string") {
							dbcInstance!.reportFieldInfringement(
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
	// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
	public static decPostcondition(
		// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
		check: (toCheck: any, target: object, propertyKey: string) => boolean | string,
		dbc: string | undefined = undefined,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
	) {
		let dbcInstance: DBC | undefined;
		return (
			target: object,
			propertyKey: string,
			descriptor: PropertyDescriptor,
		): PropertyDescriptor => {
			const originalMethod = descriptor.value;
			// biome-ignore lint/suspicious/noExplicitAny: Necessary to intercept UNDEFINED and NULL.
			descriptor.value = (...args: any[]) => {
				if (!dbcInstance) dbcInstance = DBC.getDBC(dbc);
				if (!dbcInstance.executionSettings.checkPostconditions) {
					return;
				}
				// biome-ignore lint/complexity/noThisInStatic: <explanation>
				const result = originalMethod.apply(this, args);
				const realValue = path ? DBC.resolve(result, path) : result;
				const checkResult = check(realValue, target, propertyKey);

				if (typeof checkResult === "string") {
					dbcInstance.reportReturnvalueInfringement(
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
		// biome-ignore lint/suspicious/noExplicitAny: Necessary to check any parameter value
		check: (value: unknown, target: object, methodName: string | symbol, parameterIndex: number) => boolean | string,
		dbc: string | undefined = undefined,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
	): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		const paths = path ? path.replace(/ /g, "").split("::") : [undefined];
		let dbcInstance: DBC | undefined;
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
					if (!dbcInstance) dbcInstance = DBC.getDBC(dbc);
					if (!dbcInstance.executionSettings.checkPreconditions) {
						return;
					}

					for (const singlePath of paths) {
						const realValue = singlePath ? DBC.resolve(value, singlePath) : value;
						const result = check(realValue, target, methodName, parameterIndex);

						if (typeof result === "string") {
							dbcInstance.reportParameterInfringement(
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
	// #region Contract Factory Helpers
	/**
	 * Creates a PRE decorator from a checkAlgorithm function and its bound arguments.
	 * Reduces boilerplate across contract classes.
	 *
	 * @param checkFn  A function that takes (value, ...boundArgs) and returns true or an error string.
	 * @param boundArgs The arguments to bind to the check function after the value.
	 * @param dbc      See {@link DBC.decPrecondition}.
	 * @param path     See {@link DBC.decPrecondition}.
	 * @param hint     See {@link DBC.decPrecondition}.
	 */
	public static createPRE(
		// biome-ignore lint/suspicious/noExplicitAny: Must accept any checkAlgorithm signature
		checkFn: (...args: any[]) => boolean | string,
		// biome-ignore lint/suspicious/noExplicitAny: Arguments vary per contract
		boundArgs: any[],
		dbc?: string,
		path?: string,
		hint?: string,
	) {
		return DBC.decPrecondition(
			(value, _target, _methodName, _parameterIndex) => {
				return checkFn(value, ...boundArgs);
			},
			dbc,
			path,
			hint,
		);
	}
	/**
	 * Creates a POST decorator from a checkAlgorithm function and its bound arguments.
	 *
	 * @param checkFn  A function that takes (value, ...boundArgs) and returns true or an error string.
	 * @param boundArgs The arguments to bind to the check function after the value.
	 * @param dbc      See {@link DBC.decPostcondition}.
	 * @param path     See {@link DBC.decPostcondition}.
	 * @param hint     See {@link DBC.decPostcondition}.
	 */
	public static createPOST(
		// biome-ignore lint/suspicious/noExplicitAny: Must accept any checkAlgorithm signature
		checkFn: (...args: any[]) => boolean | string,
		// biome-ignore lint/suspicious/noExplicitAny: Arguments vary per contract
		boundArgs: any[],
		dbc?: string,
		path?: string,
		hint?: string,
	) {
		return DBC.decPostcondition(
			(value, _target, _propertyKey) => {
				return checkFn(value, ...boundArgs);
			},
			dbc,
			path,
			hint,
		);
	}
	/**
	 * Creates an INVARIANT decorator from a contract constructor and its bound arguments.
	 *
	 * @param ContractClass A class with a constructor that produces an object with a `check` method.
	 * @param ctorArgs      The arguments to pass to the contract constructor.
	 * @param dbc           See {@link DBC.decInvariant}.
	 * @param path          See {@link DBC.decInvariant}.
	 * @param hint          See {@link DBC.decInvariant}.
	 */
	public static createINVARIANT(
		// biome-ignore lint/suspicious/noExplicitAny: Must accept any contract constructor
		ContractClass: new (...args: any[]) => { check: (toCheck: unknown | null | undefined) => boolean | string },
		// biome-ignore lint/suspicious/noExplicitAny: Arguments vary per contract
		ctorArgs: any[],
		dbc?: string,
		path?: string,
		hint?: string,
	) {
		return DBC.decInvariant(
			[new ContractClass(...ctorArgs)],
			path,
			dbc,
			hint,
		);
	}
	// #endregion Contract Factory Helpers
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
	/** Sanitizes a value for safe inclusion in error messages. */
	private static sanitize(value: unknown): string {
		const str = typeof value === "string" ? value : String(value);
		return str.replace(/[<>&"']/g, (ch) => {
			switch (ch) {
				case "<": return "&lt;";
				case ">": return "&gt;";
				case "&": return "&amp;";
				case "\"": return "&quot;";
				case "'": return "&#39;";
				default: return ch;
			}
		});
	}
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
		path: string | undefined,
		hint: string | undefined = undefined,
	): undefined {
		const safeViolator = DBC.sanitize(violator);
		const targetName = typeof target === "function" ? DBC.sanitize(target.name) : typeof target === "object" && target !== null && typeof target.constructor === "function" ? DBC.sanitize(target.constructor.name) : DBC.sanitize(target);
		const finalMessage: string = `[ From "${safeViolator}" in "${targetName}"${path ? ` > "${DBC.sanitize(path)}"` : ""}: ${message} ${hint ? `✨ ${hint} ✨` : ""}]`;

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
		path: string | undefined,
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
		path: string | undefined,
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
		path: string | undefined,
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
	// biome-ignore lint/suspicious/noExplicitAny: Must traverse arbitrary object graphs
	static resolveDBCPath = (obj: any, path: string): DBC =>
		path
			?.split(".")
			// biome-ignore lint/suspicious/noExplicitAny: Must traverse arbitrary object graphs
			.reduce((accumulator: any, current: string) => accumulator[current], obj);
	/**
	 * Constructs this {@link DBC } without mounting it on the global namespace.
	 * Use {@link DBC.register } to make the instance available at a specific path on globalThis.
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
		this.executionSettings = executionSettings;
	}
	/**
	 * Registers a {@link DBC } instance at the specified dotted path on globalThis (or window),
	 * making it available for decorator resolution via string paths.
	 *
	 * @param instance	The {@link DBC } instance to register.
	 * @param path		The dotted path to register at (default: `"WaXCode.DBC"`). */
	static register(instance: DBC, path = "WaXCode.DBC"): void {
		const segments = path.split(".");
		// biome-ignore lint/suspicious/noExplicitAny: Must walk dynamic global namespace.
		let obj: any = DBC.getHost();
		for (let i = 0; i < segments.length - 1; i++) {
			if (obj[segments[i]] === undefined) obj[segments[i]] = {};
			obj = obj[segments[i]];
		}
		obj[segments[segments.length - 1]] = instance;
		DBC.dbcCache.set(path, instance);
	}
	/**
	 * Executes a callback with an isolated {@link DBC } instance temporarily registered at the default path.
	 * The previous instance (if any) is restored after the callback completes — even if it throws.
	 * Useful for test isolation.
	 *
	 * @param fn The callback receiving the isolated {@link DBC } instance. */
	static isolated(fn: (dbc: DBC) => void): void {
		const saved = DBC.dbcCache.get("WaXCode.DBC");
		const testDbc = new DBC();
		DBC.register(testDbc);
		try {
			fn(testDbc);
		} finally {
			if (saved) {
				DBC.register(saved);
			} else {
				DBC.dbcCache.delete("WaXCode.DBC");
			}
		}
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

		// Security: block prototype pollution paths
		const dangerousTokens = ["__proto__", "constructor", "prototype"];

		const cachedParts = DBC.pathTokenCache.get(path);
		const parts = cachedParts ?? path.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split(".");

		if (!cachedParts) {
			// Validate tokens before caching
			for (const part of parts) {
				const tokenName = part.replace(/\(.*\)$/, "");
				if (dangerousTokens.indexOf(tokenName) >= 0) {
					throw new Error(`[XDBC] Path "${path}" contains forbidden token "${tokenName}".`);
				}
			}
			DBC.evictIfNeeded(DBC.pathTokenCache);
			DBC.pathTokenCache.set(path, parts);
		}

		// biome-ignore lint/suspicious/noExplicitAny: Must traverse arbitrary object graphs
		let current: any = toResolveFrom;

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
// Register the default instance with standard settings.
DBC.register(new DBC());
