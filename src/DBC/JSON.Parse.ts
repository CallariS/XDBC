import { DBC } from "../DBC";
/**
 * A {@link DBC } demanding that a {@link string } is {@link JSON.parse}able.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class JSON_Parse extends DBC {
	// #region Condition checking.
	/**
	 * Tries to {@link JSON.parse } the {@link string } **toCheck** invoking the **receptor** with the result, if so.
	 *
	 * @param toCheck	The {@link string } to be {@link JSON.parse }d.
	 * @param receptor	The **( json : object ) => void** to receive the {@link JSON.parse }d {@link string } **toCheck**.
	 * 					check needs to have.
	 *
	 * @returns TRUE if the value **toCheck** is a valid JSON, otherwise a {@link string } to report the infringement. */
	public static checkAlgorithm(
		toCheck: string,
		receptor: (json: object) => void,
	): boolean | string {
		// biome-ignore lint/suspicious/noExplicitAny: JSON.parse returns any.
		let parsed: any;

		try {
			parsed = JSON.parse(toCheck);
		} catch (X: unknown) {
			return `[ Following string is not a valid JSON: ${toCheck}]`;
		}

		if (receptor) {
			receptor(parsed);
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link JSON_Parse.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param receptor	See {@link JSON.checkAlgorithm }.
	 * @param path			See {@link DBC.decPrecondition }.
	 * @param dbc			See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	public static PRE(
		receptor: (json: object) => void,
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
				return JSON_Parse.checkAlgorithm(value, receptor);
			},
			dbc,
			path,
		);
	}
	/**
	 * A method-decorator factory using the {@link JSON_Parse.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param expression	See {@link JSON.checkAlgorithm }.
	 * @param path			See {@link DBC.Postcondition }.
	 * @param dbc			See {@link DBC.decPostcondition }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	public static POST(
		receptor: (json: object) => void,
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
				return JSON_Parse.checkAlgorithm(value, receptor);
			},
			dbc,
			path,
		);
	}
	/**
	 * A field-decorator factory using the {@link JSON_Parse.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged field.
	 *
	 * @param expression	See {@link JSON.checkAlgorithm }.
	 * @param path			See {@link DBC.decInvariant }.
	 * @param dbc			See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	public static INVARIANT(
		receptor: (json: object) => void,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decInvariant([new JSON_Parse(receptor)], path, dbc);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link JSON_Parse.checkAlgorithm } passing the value **toCheck** and {@link JSON_Parse.receptor }.
	 *
	 * @param toCheck See {@link JSON_Parse.checkAlgorithm }.
	 *
	 * @returns See {@link JSON_Parse.checkAlgorithm}. */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public check(toCheck: any) {
		return JSON_Parse.checkAlgorithm(toCheck, this.receptor);
	}
	/**
	 * Creates this {@link JSON_Parse } by setting the protected property {@link JSON_Parse.necessaryProperties } and {@link checkElements } used by {@link JSON_Parse.check }.
	 *
	 * @param necessaryProperties	See {@link JSON_Parse.check }.
	 * @param checkElements 		See {@link JSON_Parse.check }. */
	public constructor(public receptor: (json: object) => void = undefined) {
		super();
	}
	// #endregion Referenced Condition checking.
	// #region In-Method checking.
	/**
	 * Invokes the {@link JSON_Parse.checkAlgorithm } passing the value **toCheck**, {@link JSON_Parse.necessaryProperties } and {@link JSON_Parse.checkElements }.
	 *
	 * @param toCheck				See {@link JSON_Parse.checkAlgorithm} }.
	 * @param necessaryProperties	See {@link JSON_Parse.checkAlgorithm} }.
	 * @param checkElements			See {@link JSON_Parse.checkAlgorithm} }.
	 */
	public static check(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		toCheck: any,
		receptor: (json: object) => void,
	) {
		const checkResult = JSON_Parse.checkAlgorithm(toCheck, receptor);

		if (typeof checkResult === "string") {
			throw new DBC.Infringement(checkResult);
		}
	}
	// #endregion In-Method checking.
}
