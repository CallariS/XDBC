import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that all elements of an {@link object }s have to fulfill
 * one of the given {@link object }s check-methods (**( toCheck : any ) => boolean | string** ).
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class OR extends DBC {
	// #region Condition checking.
	/**
	 * Checks the **value** against the given **conditions**
	 *
	 * @param conditions	The **{ check: (toCheck: any) => boolean | string }**-{@link object }s to check the **value** against.
	 * @param value			Either **value**-{@link Array < any >}, which's elements will be checked, or the value to be
	 * 						checked itself.
	 * @param index			If specified with "idxEnd" being undefined, this {@link Number } will be seen as the index of
	 * 						the value-{@link Array }'s element to check. If value isn't an {@link Array } this parameter
	 * 						will not have any effect.
	 * 						With "idxEnd" not undefined this parameter indicates the beginning of the span of elements to
	 * 						check within the value-{@link Array }.
	 * @param idxEnd		Indicates the last element's index (including) of the span of value-{@link Array } elements to check.
	 * 						Setting this parameter to -1 specifies that all value-{@link Array }'s elements beginning from the
	 * 						specified **index** shall be checked.
	 *
	 * @returns TRUE if at least one of the provided **conditions** is fulfilled, otherwise a {@link string } containing all **conditions** returned {@link string }s separated by " || ". */
	public static checkAlgorithm(
		conditions: Array<{
			check: (toCheck: unknown | undefined | null | object) => boolean | string;
		}>,
		value: unknown | null | undefined,
	): boolean | string {
		let result = "";

		for (let i = 0; i < conditions.length; i++) {
			const conditionResult = conditions[i].check(value);

			if (typeof conditionResult === "string") {
				result += `${conditionResult}${i === conditions.length - 1 ? "" : " or "}`;
			} else {
				return true;
			}
		}

		return result;
	}
	/**
	 * A parameter-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
	 * of the **realConditions** to check the tagged parameter-value against with.
	 * When specifying an **index** and the tagged parameter's **value** is an {@link Array }, the **realConditions** apply to the
	 * element at the specified **index**.
	 * If the {@link Array } is too short the currently processed { check: (toCheck: any) => boolean | string } of
	 * **realConditions** will be verified to TRUE automatically, considering optional parameters.
	 * If an **index** is specified but the tagged parameter's value isn't an array, the **index** is treated as being undefined.
	 * If **index** is undefined and the tagged parameter's value is an {@link Array } each element of it will be checked
	 * against the **realConditions**.
	 *
	 * @param realConditions	Either one or more **{ check: (toCheck: any) => boolean | string }** to check the tagged parameter-value
	 * 							against with.
	 * @param path				See {@link DBC.decPrecondition }.
	 * @param dbc				See {@link DBC.decPrecondition }.
	 *
	 * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** returns one.
	 * 			Otherwise TRUE. */
	public static PRE(
		conditions: Array<{
			check: (toCheck: unknown | undefined | null | object) => boolean | string;
		}>,
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
				return OR.checkAlgorithm(conditions, value);
			},
			dbc,
			path,
		);
	}
	/**
	 * A method-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
	 * of the **realConditions** to check the tagged method's return-value against with.
	 *
	 * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
	 * 							against with.
	 * @param path				See {@link DBC.decPrecondition }.
	 * @param dbc				See {@link DBC.decPrecondition }.
	 *
	 * @returns	A {@link string } as soon as one **{ check: (toCheck: any) => boolean | string }** of **realConditions** return one.
	 * 			Otherwise TRUE. */
	public static POST(
		conditions: Array<{
			check: (toCheck: unknown | undefined | null | object) => boolean | string;
		}>,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.decPostcondition(
			(value: object, target: object, propertyKey: string) => {
				return OR.checkAlgorithm(conditions, value);
			},
			dbc,
			path,
		);
	}
	/**
	 * A field-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
	 * of the **realConditions** to check the tagged field.
	 *
	 * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
	 * 							against with.
	 * @param path				See {@link DBC.decInvariant }.
	 * @param dbc				See {@link DBC.decInvariant }.
	 *
	 * @returns	See {@link DBC.decInvariant }. */
	public static INVARIANT(
		conditions: Array<{
			check: (toCheck: unknown | undefined | null | object) => boolean | string;
		}>,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decInvariant([new OR(conditions)], path, dbc);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like global functions).
	//
	/**
	 * Invokes the {@link OR.checkAlgorithm } passing the value **toCheck** and {@link OR.conditions }.
	 *
	 * @param toCheck See {@link OR.checkAlgorithm }.
	 *
	 * @returns See {@link OR.checkAlgorithm}. */
	public check(toCheck: unknown | null | undefined) {
		return OR.checkAlgorithm(this.conditions, toCheck);
	}
	/**
	 * Creates this {@link OR } by setting the protected property {@link OR.conditions } used by {@link OR.check }.
	 *
	 * @param conditions See {@link OR.check }. */
	public constructor(
		protected conditions: Array<{
			check: (toCheck: unknown | undefined | null) => boolean | string;
		}>,
	) {
		super();
	}
	// #endregion Referenced Condition checking.
}
