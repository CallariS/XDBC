import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that a value must be an array.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
export class ARRAY extends DBC {
	/**
	 * Checks if the value **toCheck** is an array.
	 *
	 * @param toCheck	The value to check.
	 *
	 * @returns TRUE if the value **toCheck** is an array, otherwise a string describing the infringement. */
	// biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking.
	public static checkAlgorithm(toCheck: any): boolean | string {
		if (toCheck === undefined || toCheck === null) return true;

		if (!Array.isArray(toCheck)) {
			return `Value has to be an ARRAY but is of type "${typeof toCheck}"`;
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link ARRAY.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param path	See {@link DBC.decPrecondition }.
	 * @param hint	See {@link DBC.decPrecondition }.
	 * @param dbc	See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	public static PRE(
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	): (
		target: object,
		methodName: string | symbol | undefined,
		parameterIndex: number,
	) => void {
		return DBC.createPRE(ARRAY.checkAlgorithm, [], dbc, path, hint);
	}
	/**
	 * A method-decorator factory using the {@link ARRAY.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param path	See {@link DBC.decPostcondition }.
	 * @param hint	See {@link DBC.decPostcondition }.
	 * @param dbc	See {@link DBC.decPostcondition }.
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
		return DBC.createPOST(ARRAY.checkAlgorithm, [], dbc, path, hint);
	}
	/**
	 * A field-decorator factory using the {@link ARRAY.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged field.
	 *
	 * @param path	See {@link DBC.decInvariant }.
	 * @param hint	See {@link DBC.decInvariant }.
	 * @param dbc	See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	public static INVARIANT(
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return DBC.createINVARIANT(ARRAY, [], dbc, path, hint);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link ARRAY.checkAlgorithm } passing the value **toCheck**.
	 *
	 * @param toCheck See {@link ARRAY.checkAlgorithm }.
	 *
	 * @returns See {@link ARRAY.checkAlgorithm}. */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public check(toCheck: any) {
		return ARRAY.checkAlgorithm(toCheck);
	}
	/**
	 * Invokes the {@link ARRAY.checkAlgorithm } passing the value **toCheck**.
	 *
	 * @param toCheck	See {@link ARRAY.checkAlgorithm }.
	 * @param hint		An optional {@link string } providing extra information in case of an infringement.
	 * @param id		A {@link string } identifying this {@link ARRAY } via the {@link DBC.Infringement }-Message.
	 *
	 * @returns The **CANDIDATE** **toCheck** if this {@link ARRAY } is fulfilled.
	 *
	 * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link ARRAY }. */
	public static tsCheck<CANDIDATE extends unknown[] = unknown[]>(
		toCheck: CANDIDATE | undefined | null,
		hint: string | undefined = undefined,
		id: string | undefined = undefined,
		dbc: string | undefined = undefined,
	): CANDIDATE {
		const result = ARRAY.checkAlgorithm(toCheck);

		if (result === true) {
			return toCheck as CANDIDATE;
		}
		DBC.reportTsCheckInfringement(
			`${id ? `(${id}) ` : ""}${result as string}${hint ? ` ✨ ${hint} ✨` : ""}`,
			dbc,
		);
		return toCheck as CANDIDATE;
	}
	/**
	 * Creates this {@link ARRAY } instance.  No parameters needed — the check is always {@link Array.isArray }. */
	public constructor() {
		super();
	}
}
