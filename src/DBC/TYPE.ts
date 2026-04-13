import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that an {@link object }s gotta be of certain {@link TYPE.type }.
 *
 * @remarks
 * Author: 		Salvatore Callari (Callari@WaXCode.net) / 2025
 * Maintainer:	Salvatore Callari (XDBC@WaXCode.net) */
export class TYPE extends DBC {
	/**
	 * Checks if the value **toCheck** is of the **type** specified.
	 *
	 * @param toCheck	The {@link Object } which's **type** to check.
	 * @param type		The type the {@link object} **toCheck** has to be of. Can be a single type or multiple types separated by "|".
	 *
	 * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
	// biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
	public static checkAlgorithm(toCheck: any, type: string): boolean | string {
		if (toCheck === undefined || toCheck === null) return true;

		const types = type.split("|").map(t => t.trim());
		const actualType = typeof toCheck;

		// #region Check if the actual type matches at least one of the specified types
		// biome-ignore lint/suspicious/useValidTypeof: Necessary
		const isValid = types.some(t => actualType === t);

		if (!isValid) {
			if (types.length === 1) {
				return `Value has to be of type "${type}" but is of type "${actualType}"`;
			}
			return `Value has to be of type "${types.join(" | ")}" but is of type "${actualType}"`;
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
	public static PRE(
		type: string,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined
	): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		return DBC.createPRE(TYPE.checkAlgorithm, [type], dbc, path, hint);
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
	public static POST(
		type: string,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,

	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.createPOST(TYPE.checkAlgorithm, [type], dbc, path, hint);
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
	public static INVARIANT(
		type: string,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return DBC.createINVARIANT(TYPE, [type], dbc, path, hint);
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
	public check(toCheck: any) {
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
	public static tsCheck<CANDIDATE = unknown>(toCheck: any, type: string, hint: string | undefined = undefined, id: string | undefined = undefined): CANDIDATE {
		const result = TYPE.checkAlgorithm(toCheck, type);

		if (result === true) {
			return toCheck;
		}
		else {
			throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result as string}${hint ? ` ✨ ${hint} ✨` : ""}`);
		}
	}
	/**
	 * Creates this {@link TYPE } by setting the protected property {@link TYPE.type } used by {@link TYPE.check }.
	 *
	 * @param type See {@link TYPE.check }. */
	public constructor(protected type: string) {
		super();
	}
}
