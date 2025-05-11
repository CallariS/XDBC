import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that the an {@link object }s gotta be an instance of a certain {@link INSTANCE.reference }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
export class INSTANCE extends DBC {
	/**
	 * Checks if the value **toCheck** is complies to the {@link RegExp } **expression**.
	 *
	 * @param toCheck	The value that has comply to the {@link RegExp } **expression** for this {@link DBC } to be fulfilled.
	 * @param reference	The {@link RegExp } the one **toCheck** has comply to in order for this {@link DBC } to be
	 * 					fulfilled.
	 *
	 * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
	// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
	public static checkAlgorithm(toCheck: any, reference: any): boolean | string {
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
	public static PRE(
		// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
		reference: any,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
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
				return INSTANCE.checkAlgorithm(value, reference);
			},
			dbc,
			path,
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
		reference: any,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.decPostcondition(
			(value: object, target: object, propertyKey: string) => {
				return INSTANCE.checkAlgorithm(value, reference);
			},
			dbc,
			path,
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
		reference: any,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decInvariant([new INSTANCE(reference)], path, dbc);
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
		return INSTANCE.checkAlgorithm(toCheck, this.reference);
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
