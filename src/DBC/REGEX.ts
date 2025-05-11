import { DBC } from "../DBC";
/**
 * A {@link DBC } providing {@link REGEX }-contracts and standard {@link RegExp } for common use cases in {@link REGEX.stdExp }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class REGEX extends DBC {
	/** Stores often used {@link RegExp }s. */
	public static stdExp = {
		htmlAttributeName: /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/,
		eMail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
		property: /^[$_A-Za-z][$_A-Za-z0-9]*$/,
		url: /^(?:(?:http:|https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:localhost|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(?::\d{2,5})?(?:\/(?:[\w\-\.]*\/)*[\w\-\.]+(?:\?\S*)?(?:#\S*)?)?$/i,
		keyPath: /^([a-zA-Z_$][a-zA-Z0-9_$]*\.)*[a-zA-Z_$][a-zA-Z0-9_$]*$/,
		date: /^\d{1,4}[.\/-]\d{1,2}[.\/-]\d{1,4}$/i,
		dateFormat:
			/^((D{1,2}[./-]M{1,2}[./-]Y{1,4})|(M{1,2}[./-]D{1,2}[./-]Y{1,4})|Y{1,4}[./-]D{1,2}[./-]M{1,2}|(Y{1,4}[./-]M{1,2}[./-]D{1,2}))$/i,
		cssSelector:
			/^(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\])(?:,\s*(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\]))*$/,
	};
	// #region Condition checking.
	/**
	 * Checks if the value **toCheck** is complies to the {@link RegExp } **expression**.
	 *
	 * @param toCheck		The value that has comply to the {@link RegExp } **expression** for this {@link DBC } to be fulfilled.
	 * @param expression	The {@link RegExp } the one **toCheck** has comply to in order for this {@link DBC } to be
	 * 						fulfilled.
	 *
	 * @returns TRUE if the value **toCheck** complies with the {@link RegExp } **expression**, otherwise FALSE. */
	public static checkAlgorithm(
		toCheck: unknown | null | undefined,
		expression: RegExp,
	): boolean | string {
		if (!expression.test(toCheck as string)) {
			return `Value has to comply to regular expression "${expression}"`;
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param expression	See {@link REGEX.checkAlgorithm }.
	 * @param path			See {@link DBC.decPrecondition }.
	 * @param dbc			See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	public static PRE(
		expression: RegExp,
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
				return REGEX.checkAlgorithm(value, expression);
			},
			dbc,
			path,
		);
	}
	/**
	 * A method-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param expression	See {@link REGEX.checkAlgorithm }.
	 * @param path			See {@link DBC.Postcondition }.
	 * @param dbc			See {@link DBC.decPostcondition }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	public static POST(
		expression: RegExp,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.decPostcondition(
			(value: string, target: object, propertyKey: string) => {
				return REGEX.checkAlgorithm(value, expression);
			},
			dbc,
			path,
		);
	}
	/**
	 * A field-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged field.
	 *
	 * @param expression	See {@link REGEX.checkAlgorithm }.
	 * @param path			See {@link DBC.decInvariant }.
	 * @param dbc			See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	public static INVARIANT(
		expression: RegExp,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decInvariant([new REGEX(expression)], path, dbc);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link REGEX.checkAlgorithm } passing the value **toCheck** and {@link REGEX.equivalent }.
	 *
	 * @param toCheck See {@link REGEX.checkAlgorithm }.
	 *
	 * @returns See {@link EQ.checkAlgorithm}. */
	public check(toCheck: unknown | null | undefined) {
		return REGEX.checkAlgorithm(toCheck, this.expression);
	}
	/**
	 * Creates this {@link REGEX } by setting the protected property {@link REGEX.expression } used by {@link REGEX.check }.
	 *
	 * @param expression See {@link REGEX.check }. */
	public constructor(protected expression: RegExp) {
		super();
	}
	// #endregion Referenced Condition checking.
	// #region In-Method checking.
	/**
	 * Invokes the {@link REGEX.checkAlgorithm } passing the value **toCheck** and {@link REGEX.expression }.
	 *
	 * @param toCheck		See {@link REGEX.checkAlgorithm}.
	 * @param expression	See {@link REGEX.checkAlgorithm}.
	 */
	public static check(toCheck: unknown | null | undefined, expression: RegExp) {
		const checkResult = REGEX.checkAlgorithm(toCheck, expression);

		if (typeof checkResult === "string") {
			throw new DBC.Infringement(checkResult);
		}
	}
	// #endregion In-Method checking.
}
