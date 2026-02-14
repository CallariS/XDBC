import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that an {@link object } has also to comply to a certain {@link DBC } if it complies to
 * another specified one.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class IF extends DBC {
	// #region Condition checking.
	/**
	 * Checks if the value **toCheck** complies to the specified **condition** and if so does also comply to the one **inCase**.
	 *
	 * @param toCheck	The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
	 * @param condition	The contract **toCheck** has to comply to in order to also have to comply to the one **inCase**.
	 * @param inCase	The contract **toCheck** has to also comply to if it complies to **condition**.
	 *
	 * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
	public static checkAlgorithm(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		toCheck: any,
		condition: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		inCase: {
			check: (toCheck: unknown | undefined | null | object) => boolean | string;
		},
		invert,
	): boolean | string {
		if (invert && !condition.check(toCheck) && !inCase.check(toCheck)) {
			return `In case that the value complies to "${condition}" it also has to comply to "${inCase}"`;
		}

		if (!invert && condition.check(toCheck) && !inCase.check(toCheck)) {
			return `In case that the value does not comply to "${condition}" it has to comply to "${inCase}"`;
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link EQ.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param condition	See {@link IF.checkAlgorithm }.
	 * @param inCase	See {@link IF.checkAlgorithm }.
	 * @param path		See {@link DBC.decPrecondition }.
	 * @param dbc		See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	public static PRE(
		condition: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		inCase: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		path: string | undefined = undefined,
		invert = false,
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
				return IF.checkAlgorithm(value, condition, inCase, invert);
			},
			dbc,
			path,
			hint
		);
	}
	/**
	 * A method-decorator factory using the {@link IF.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param condition	See {@link IF.checkAlgorithm }.
	 * @param inCase	See {@link IF.checkAlgorithm }.
	 * @param path		See {@link DBC.Postcondition }.
	 * @param dbc		See {@link DBC.decPostcondition }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	public static POST(
		condition: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		inCase: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		path: string | undefined = undefined,
		invert = false,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.decPostcondition(
			(value: object, target: object, propertyKey: string) => {
				return IF.checkAlgorithm(value, condition, inCase, invert);
			},
			dbc,
			path,
			hint
		);
	}
	/**
	 * A field-decorator factory using the {@link IF.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged field.
	 *
	 * @param condition	See {@link IF.checkAlgorithm }.
	 * @param inCase	See {@link IF.checkAlgorithm }.
	 * @param path			See {@link DBC.decInvariant }.
	 * @param dbc			See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	public static INVARIANT(
		condition: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		inCase: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		path: string | undefined = undefined,
		invert = false,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return DBC.decInvariant([new IF(condition, inCase, invert)], path, dbc, hint);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link IF.checkAlgorithm } passing the value **toCheck**, {@link IF.equivalent } and {@link IF.invert }.
	 *
	 * @param toCheck See {@link IF.checkAlgorithm }.
	 *
	 * @returns See {@link IF.checkAlgorithm}. */
	// biome-ignore lint/suspicious/noExplicitAny: Necessary to check against NULL & UNDEFINED.
	public check(toCheck: any) {
		return IF.checkAlgorithm(toCheck, this.condition, this.inCase, this.invert);
	}
	/**
	 * Creates this {@link IF } by setting the protected property {@link IF.equivalent } used by {@link IF.check }.
	 *
	 * @param equivalent See {@link IF.check }. */
	public constructor(
		// biome-ignore lint/suspicious/noExplicitAny: To be able to match UNDEFINED and NULL.
		protected condition: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		protected inCase: { check: (toCheck: unknown | undefined | null | object) => boolean | string; },
		protected invert = false,
	) {
		super();
	}
	// #endregion Referenced Condition checking.
}