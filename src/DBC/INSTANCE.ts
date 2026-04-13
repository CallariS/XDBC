import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that the an {@link object }s gotta be an instance of a certain {@link INSTANCE.reference }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
export class INSTANCE extends DBC {
	/**
	 * Checks if the value **toCheck** is an instance of the specified **reference**.
	 *
	 * @param toCheck	The value that has to be an instance of the **reference** in order for this {@link DBC }
	 * 					to be fulfilled.
	 * @param reference	The {@link object } the one **toCheck** has to be an instance of.
	 *
	 * @returns TRUE if the value **toCheck** is is an instance of the *reference**, **undefined** or **null**, otherwise FALSE. */
	// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
	public static checkAlgorithm(toCheck: any, ...references: any[]): boolean | string {
		if (toCheck === null || toCheck === undefined) {
			return true;
		}

		for (const ref of references) {
			if (toCheck instanceof ref) {
				return true;
			}
		}

		return `Value has to be an instance of "${references.map(ref => ref.name || ref).join(', ')}" but is of type "${typeof toCheck}"`;
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
	public static PRE(
		// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
		reference: any | any[],
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
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
				return Array.isArray(reference) ? INSTANCE.checkAlgorithm(value, ...reference) : INSTANCE.checkAlgorithm(value, reference);
			},
			dbc,
			path,
			hint
		);
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
	public static POST(
		// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
		reference: any | any[],
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
				return Array.isArray(reference) ? INSTANCE.checkAlgorithm(value, ...reference) : INSTANCE.checkAlgorithm(value, reference);
			},
			dbc,
			path,
			hint
		);
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
	public static INVARIANT(
		// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
		reference: any | any[],
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return DBC.decInvariant([new INSTANCE(reference)], path, dbc, hint);
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
	public check(toCheck: any) {
		return Array.isArray(this.reference) ? INSTANCE.checkAlgorithm(toCheck, ...this.reference) : INSTANCE.checkAlgorithm(toCheck, this.reference);
	}
	/**
	 * Type-safe check that validates if a value is an instance of a specified reference.
	 * 
	 * @param toCheck 	The value to check for instance validity.
	 * @param reference	The {@link object } the one **toCheck** has to be an instance of.
	 * @param hint		An optional {@link string } providing extra information in case of an infringement.
	 * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
	 * 
	 * @returns The **CANDIDATE** **toCheck** if it fulfills this {@link INSTANCE }.
	 * 
	 * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link INSTANCE }. */
	public static tsCheck<CANDIDATE = unknown>(toCheck: any, reference: any, hint: string = undefined, id: string | undefined = undefined): CANDIDATE {
		return INSTANCE.tsCheckMulti<CANDIDATE>(toCheck, [reference], hint, id);
	}
	/**
	 * Invokes the {@link INSTANCE.checkAlgorithm } passing the value **toCheck** and the {@link INSTANCE.reference } .
	 * 
	 * @param toCheck 	See {@link INSTANCE.checkAlgorithm }.
	 * @param reference	See {@link INSTANCE.checkAlgorithm }.
	 * @param hint		An optional {@link string } providing extra information in case of an infringement.
	 * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
	 * 
	 * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link INSTANCE }.
	 * 
	 * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
	public static tsCheckMulti<CANDIDATE = unknown>(toCheck: any, references: any[], hint: string = undefined, id: string | undefined = undefined): CANDIDATE {
		const result = INSTANCE.checkAlgorithm(toCheck, ...references);

		if (result === true) {
			return toCheck;
		}
		else {
			throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result as string} ${hint ? `✨ ${hint} ✨` : ""}`);
		}
	}
	/**
	 * Creates this {@link INSTANCE } by setting the protected property {@link INSTANCE.reference } used by {@link INSTANCE.check }.
	 *
	 * @param reference See {@link INSTANCE.check }. */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public constructor(protected reference: any) {
		super();
	}
}
