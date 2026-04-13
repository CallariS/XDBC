import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that two {@link object }s gotta be equal.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class EQ extends DBC {
	// #region Condition checking.
	/**
	 * Checks if the value **toCheck** is equal to the specified **equivalent**.
	 *
	 * @param toCheck		The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
	 * @param equivalent	The {@link object } the one **toCheck** has to be equal to in order for this {@link DBC } to be
	 * 						fulfilled.
	 *
	 * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
	public static checkAlgorithm(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		toCheck: any,
		equivalent: object,
		invert,
	): boolean | string {
		if (!invert && equivalent !== toCheck) {
			return `Value has to be equal to "${equivalent}"`;
		}

		if (invert && equivalent === toCheck) {
			return `Value must not be equal to "${equivalent}"`;
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
	public static PRE(
		// biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
		equivalent: any,
		invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined
	): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		return DBC.decPrecondition(
			(
				value: object,
				target: object,
				methodName: string,
				parameterIndex: number,
			) => {
				return EQ.checkAlgorithm(value, equivalent, invert);
			},
			dbc,
			path,
			hint
		);
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
	public static POST(
		// biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
		equivalent: any,
		invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,

	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.decPostcondition(
			(value: object, target: object, propertyKey: string) => {
				return EQ.checkAlgorithm(value, equivalent, invert);
			},
			dbc,
			path,
			hint
		);
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
	public static INVARIANT(
		// biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
		equivalent: any,
		invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return DBC.decInvariant([new EQ(equivalent, invert)], path, dbc, hint);
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
	public check(toCheck: any) {
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
	public static tsCheck<CANDIDATE>(toCheck: CANDIDATE | undefined | null, equivalent: any, hint: string = undefined, id: string | undefined = undefined): CANDIDATE {
		const result = EQ.checkAlgorithm(toCheck, equivalent, false);

		if (result) {
			return toCheck as CANDIDATE;
		}
		else {
			throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result as string} ${hint ? `✨ ${hint} ✨` : ""}`);
		}
	}
	/**
	 * Creates this {@link EQ } by setting the protected property {@link EQ.equivalent } used by {@link EQ.check }.
	 *
	 * @param equivalent See {@link EQ.check }. */
	public constructor(
		// biome-ignore lint/suspicious/noExplicitAny: To be able to match UNDEFINED and NULL.
		protected equivalent: any,
		protected invert = false,
	) {
		super();
	}
	// #endregion Referenced Condition checking.
}
