import { DBC } from "../DBC";
/**
 * A {@link DBC } defining a comparison between two {@link object }s.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class COMPARISON extends DBC {
	// #region Condition checking.
	/**
	 * Does a comparison between the {@link object } **toCheck** and the **equivalent**.
	 *
	 * @param toCheck		The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
	 * @param equivalent	The {@link object } the one **toCheck** has to be equal to in order for this {@link DBC } to be
	 * 						fulfilled.
	 *
	 * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
	static checkAlgorithm(toCheck, equivalent, equalityPermitted, invert) {
		if (equalityPermitted && !invert && toCheck < equivalent) {
			return `Value has to to be greater than or equal to "${equivalent}"`;
		}

		if (equalityPermitted && invert && toCheck > equivalent) {
			return `Value has to be less than or equal to "${equivalent}"`;
		}

		if (!equalityPermitted && !invert && toCheck <= equivalent) {
			return `Value has to to be greater than "${equivalent}"`;
		}

		if (!equalityPermitted && invert && toCheck >= equivalent) {
			return `Value has to be less than "${equivalent}"`;
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
	 * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
	 * @param path			    See {@link DBC.decPrecondition }.
	 * @param dbc			    See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	static PRE(
		equivalent,
		equalityPermitted = false,
		invert = false,
		path: string = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decPrecondition(
			(value, target, methodName, parameterIndex) => {
				return COMPARISON.checkAlgorithm(
					value,
					equivalent,
					equalityPermitted,
					invert,
				);
			},
			dbc,
			path,
		);
	}
	/**
	 * A method-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
	 * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
	 * @param path			    See {@link DBC.Postcondition }.
	 * @param dbc			    See {@link DBC.decPostcondition }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	static POST(
		equivalent,
		equalityPermitted = false,
		invert = false,
		path: string = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decPostcondition(
			(value, target, propertyKey) => {
				return COMPARISON.checkAlgorithm(
					value,
					equalityPermitted,
					equivalent,
					invert,
				);
			},
			dbc,
			path,
		);
	}
	/**
	 * A field-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged field.
	 *
	 * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
	 * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
	 * @param path			    See {@link DBC.decInvariant }.
	 * @param dbc			    See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	static INVARIANT(
		equivalent,
		equalityPermitted = false,
		invert = false,
		path: string = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decInvariant(
			[new COMPARISON(equivalent, equalityPermitted, invert)],
			path,
			dbc,
		);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	// #region Dynamic usage.
	/**
	 * Invokes the {@link COMPARISON.checkAlgorithm } passing the value **toCheck**, {@link COMPARISON.equivalent } and {@link COMPARISON.invert }.
	 *
	 * @param toCheck See {@link COMPARISON.checkAlgorithm }.
	 *
	 * @returns See {@link COMPARISON.checkAlgorithm}. */
	public check(toCheck) {
		return COMPARISON.checkAlgorithm(
			toCheck,
			this.equivalent,
			this.equalityPermitted,
			this.invert,
		);
	}
	/**
	 * Creates this {@link COMPARISON } by setting the protected property {@link COMPARISON.equivalent }, {@link COMPARISON.equalityPermitted } and {@link COMPARISON.invert } used by {@link COMPARISON.check }.
	 *
	 * @param equivalent        See {@link COMPARISON.check }.
	 * @param equalityPermitted See {@link COMPARISON.check }.
	 * @param invert            See {@link COMPARISON.check }. */
	constructor(
		public equivalent,
		public equalityPermitted = false,
		public invert = false,
	) {
		super();
	}
	// #endregion Dynamic usage.
}
