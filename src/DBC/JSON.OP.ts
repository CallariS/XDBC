import { DBC } from "../DBC";
/**
 * A {@link DBC } demanding that an {@link object } has specific properties of specific types.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class JSON_OP extends DBC {
	// #region Condition checking.
	/**
	 * Checks if the object **toCheck** has the **necessaryProperties** of necessary type.
	 *
	 * @param toCheck				The {@link object } to check for the necessary properties.
	 * @param necessaryProperties	The **{ name : string, type : string }**s defining the properties and type the {@link object } to
	 * 								check needs to have.
	 * @param checkElements			Indicates if **toCheck** is an iterable object of which all elements have to be checked.
	 * 								Elements will only be checked if **toCheck** is iterable, otherwise **toCheck** itself
	 * 								will be checked.
	 *
	 * @returns TRUE if the value **toCheck** or it's elements, if **checkElements** is TRUE, has all **necessaryProperties**, otherwise a {@link string } to report the infringement. */
	public static checkAlgorithm(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		toCheck: any,
		necessaryProperties: Array<{ name: string; type: string }>,
		checkElements,
	): boolean | string {
		if (toCheck === undefined || null) {
			return `[ UNDEFINED or NULL received instead of object with following properties: ${JSON.stringify(necessaryProperties)} ]`;
		}

		for (const property of necessaryProperties)
			if (checkElements && typeof toCheck[Symbol.iterator] === "function") {
				for (const element of toCheck) {
					if (
						// biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
						!element.hasOwnProperty(property.name) ||
						// biome-ignore lint/suspicious/useValidTypeof: <explanation>
						typeof element[property.name] !== property.type
					) {
						return `[ Object "${JSON.stringify(element)}" in Array "${JSON.stringify(toCheck)}" does not contain the necessary property "${property.name}" of type "${property.type}"]`;
					}
				}
			} else {
				if (
					// biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
					!toCheck.hasOwnProperty(property.name) ||
					// biome-ignore lint/suspicious/useValidTypeof: <explanation>
					typeof toCheck[property.name] !== property.type
				) {
					return `[ Object does not contain the necessary property "${property.name}" of type "${property.type}"]`;
				}
			}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link JSON_OP.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param expression	See {@link JSON.checkAlgorithm }.
	 * @param path			See {@link DBC.decPrecondition }.
	 * @param dbc			See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	public static PRE(
		necessaryProperties: Array<{ name: string; type: string }>,
		checkElements = false,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		return DBC.decPrecondition(
			(
				value: string,
				target: object,
				methodName: string,
				parameterIndex: number,
			) => {
				return JSON_OP.checkAlgorithm(
					value,
					necessaryProperties,
					checkElements,
				);
			},
			dbc,
			path,
		);
	}
	/**
	 * A method-decorator factory using the {@link JSON_OP.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param expression	See {@link JSON.checkAlgorithm }.
	 * @param path			See {@link DBC.Postcondition }.
	 * @param dbc			See {@link DBC.decPostcondition }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	public static POST(
		necessaryProperties: Array<{ name: string; type: string }>,
		checkElements = false,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.decPostcondition(
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			(value: any, target: object, propertyKey: string) => {
				return JSON_OP.checkAlgorithm(
					value,
					necessaryProperties,
					checkElements,
				);
			},
			dbc,
			path,
		);
	}
	/**
	 * A field-decorator factory using the {@link JSON_OP.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged field.
	 *
	 * @param expression	See {@link JSON.checkAlgorithm }.
	 * @param path			See {@link DBC.decInvariant }.
	 * @param dbc			See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	public static INVARIANT(
		necessaryProperties: Array<{ name: string; type: string }>,
		checkElements = false,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decInvariant(
			[new JSON_OP(necessaryProperties, checkElements)],
			path,
			dbc,
		);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link JSON_OP.checkAlgorithm } passing the value **toCheck**, {@link JSON_OP.necessaryProperties } and {@link JSON_OP.checkElements }.
	 *
	 * @param toCheck See {@link JSON_OP.checkAlgorithm }.
	 *
	 * @returns See {@link JSON_OP.checkAlgorithm}. */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public check(toCheck: any) {
		return JSON_OP.checkAlgorithm(
			toCheck,
			this.necessaryProperties,
			this.checkElements,
		);
	}
	/**
	 * Creates this {@link JSON_OP } by setting the protected property {@link JSON_OP.necessaryProperties } and {@link checkElements } used by {@link JSON_OP.check }.
	 *
	 * @param necessaryProperties	See {@link JSON_OP.check }.
	 * @param checkElements 		See {@link JSON_OP.check }. */
	public constructor(
		public necessaryProperties: Array<{ name: string; type: string }>,
		public checkElements = false,
	) {
		super();
	}
	// #endregion Referenced Condition checking.
	// #region In-Method checking.
	/**
	 * Invokes the {@link JSON_OP.checkAlgorithm } passing the value **toCheck**, {@link JSON_OP.necessaryProperties } and {@link JSON_OP.checkElements }.
	 *
	 * @param toCheck				See {@link JSON_OP.checkAlgorithm} }.
	 * @param necessaryProperties	See {@link JSON_OP.checkAlgorithm} }.
	 * @param checkElements			See {@link JSON_OP.checkAlgorithm} }.
	 */
	public static check(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		toCheck: any,
		necessaryProperties: Array<{ name: string; type: string }>,
		checkElements = false,
	) {
		const checkResult = JSON_OP.checkAlgorithm(
			toCheck,
			necessaryProperties,
			checkElements,
		);

		if (typeof checkResult === "string") {
			throw new DBC.Infringement(checkResult);
		}
	}
	// #endregion In-Method checking.
}
