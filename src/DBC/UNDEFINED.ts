import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that an {@link object }s must be **undefined**.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
export class UNDEFINED extends DBC {
	/**
	 * Checks if the value **toCheck** is undefined.
	 *
	 * @param toCheck	The {@link Object } to check.
	 *
	 * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
	// biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
	public static checkAlgorithm(toCheck: any): boolean | string {
		// biome-ignore lint/suspicious/useValidTypeof: Necessary
		if (toCheck !== undefined) {
			return `Value must be UNDEFINED but it is ${typeof toCheck}`;
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link UNDEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param path	See {@link DBC.decPrecondition }.
	 * @param dbc	See {@link DBC.decPrecondition }.
	 * @param hint	See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	public static PRE(
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		return DBC.createPRE(UNDEFINED.checkAlgorithm, [], dbc, path, hint);
	}
	/**
	 * A method-decorator factory using the {@link UNDEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param path	See {@link DBC.Postcondition }.
	 * @param dbc	See {@link DBC.decPostcondition }.
	 * @param hint	See {@link DBC.decPostcondition }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	public static POST(
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.createPOST(UNDEFINED.checkAlgorithm, [], dbc, path, hint);
	}
	/**
	 * A field-decorator factory using the {@link UNDEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged field.
	 *
	 * @param path	See {@link DBC.decInvariant }.
	 * @param dbc	See {@link DBC.decInvariant }.
	 * @param hint	See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	public static INVARIANT(
		type: string,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return DBC.createINVARIANT(UNDEFINED, [], dbc, path, hint);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link UNDEFINED.checkAlgorithm } passing the value **toCheck** and the {@link UNDEFINED.type } .
	 *
	 * @param toCheck See {@link UNDEFINED.checkAlgorithm }.
	 *
	 * @returns See {@link UNDEFINED.checkAlgorithm}. */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public check(toCheck: any) {
		return UNDEFINED.checkAlgorithm(toCheck);
	}
	/**
	 * Invokes the {@link UNDEFINED.checkAlgorithm } passing the value **toCheck** and the {@link UNDEFINED.type } .
	 *
	 * @param toCheck	See {@link UNDEFINED.checkAlgorithm }.
	 * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
	 * 
	 * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link UNDEFINED }.
	 * 
	 * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link UNDEFINED }.*/
	public static tsCheck<CANDIDATE = unknown>(toCheck: CANDIDATE | undefined | null, id: string | undefined = undefined): CANDIDATE {
		const result = UNDEFINED.checkAlgorithm(toCheck);

		if (result === true) {
			return toCheck as CANDIDATE;
		}
		else {
			throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result as string}`);
		}
	}
	/** Creates this {@link UNDEFINED }. */
	public constructor() {
		super();
	}
}
