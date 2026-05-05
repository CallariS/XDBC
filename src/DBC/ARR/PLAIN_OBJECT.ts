import { DBC } from "../../DBC";
import { ARRAY } from "../ARRAY";
/**
 * A {@link DBC } defining that a value must be a plain object — i.e. `typeof value === "object"`,
 * not `null`, and not an array.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
export class PLAIN_OBJECT extends ARRAY {
	/**
	 * Checks if the value **toCheck** is a plain object (non-null, non-array object).
	 *
	 * @param toCheck	The value to check.
	 *
	 * @returns TRUE if the value **toCheck** is a plain object, otherwise a string describing the infringement. */
	// biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking.
	public static checkAlgorithm(toCheck: any): boolean | string {
		if (toCheck === undefined || toCheck === null) return true;

		if (typeof toCheck !== "object") {
			return `Value has to be a PLAIN_OBJECT but is of type "${typeof toCheck}"`;
		}

		if (Array.isArray(toCheck)) {
			return "Value has to be a PLAIN_OBJECT but is an ARRAY";
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link PLAIN_OBJECT.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
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
		return DBC.createPRE(PLAIN_OBJECT.checkAlgorithm, [], dbc, path, hint);
	}
	/**
	 * A method-decorator factory using the {@link PLAIN_OBJECT.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
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
		return DBC.createPOST(PLAIN_OBJECT.checkAlgorithm, [], dbc, path, hint);
	}
	/**
	 * A field-decorator factory using the {@link PLAIN_OBJECT.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
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
		return DBC.createINVARIANT(PLAIN_OBJECT, [], dbc, path, hint);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link PLAIN_OBJECT.checkAlgorithm } passing the value **toCheck**.
	 *
	 * @param toCheck See {@link PLAIN_OBJECT.checkAlgorithm }.
	 *
	 * @returns See {@link PLAIN_OBJECT.checkAlgorithm}. */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public check(toCheck: any) {
		return PLAIN_OBJECT.checkAlgorithm(toCheck);
	}
	/**
	 * Invokes the {@link PLAIN_OBJECT.checkAlgorithm } passing the value **toCheck**.
	 *
	 * @param toCheck	See {@link PLAIN_OBJECT.checkAlgorithm }.
	 * @param hint		An optional {@link string } providing extra information in case of an infringement.
	 * @param id		A {@link string } identifying this {@link PLAIN_OBJECT } via the {@link DBC.Infringement }-Message.
	 *
	 * @returns The **CANDIDATE** **toCheck** if this {@link PLAIN_OBJECT } is fulfilled.
	 *
	 * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link PLAIN_OBJECT }. */
	public static tsCheck<CANDIDATE extends object = object>(
		toCheck: CANDIDATE | undefined | null,
		hint: string | undefined = undefined,
		id: string | undefined = undefined,
		dbc: string | undefined = undefined,
	): CANDIDATE {
		const result = PLAIN_OBJECT.checkAlgorithm(toCheck);

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
	 * Creates this {@link PLAIN_OBJECT } instance. No parameters needed — the check is always the same. */
	public constructor() {
		super();
	}
}
