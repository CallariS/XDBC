import { DBC } from "../DBC.js";
/**
 * A {@link DBC } defining that two {@link object }s gotta be equal.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class GREATER extends DBC {
    // #region Condition checking.
    /**
     * Checks if the value **toCheck** is nb   equal to the specified **equivalent**.
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
            return `Value must not to be less than or equal to "${equivalent}"`;
        }
        if (!equalityPermitted && !invert && toCheck <= equivalent) {
            return `Value has to to be greater than "${equivalent}"`;
        }
        if (!equalityPermitted && invert && toCheck >= equivalent) {
            return `Value must not to be less than "${equivalent}"`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link GREATER.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param equivalent	    See {@link GREATER.checkAlgorithm }.
     * @param equalityPermitted See {@link GREATER.checkAlgorithm }.
     * @param path			    See {@link DBC.decPrecondition }.
     * @param dbc			    See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return GREATER.checkAlgorithm(value, equivalent, equalityPermitted, invert);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link GREATER.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param equivalent	    See {@link GREATER.checkAlgorithm }.
     * @param equalityPermitted See {@link GREATER.checkAlgorithm }.
     * @param path			    See {@link DBC.Postcondition }.
     * @param dbc			    See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPostcondition((value, target, propertyKey) => {
            return GREATER.checkAlgorithm(value, equalityPermitted, equivalent, invert);
        }, dbc, path);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    // #region Dynamic usage.
    /**
     * Invokes the {@link GREATER.checkAlgorithm } passing the value **toCheck**, {@link GREATER.equivalent } and {@link GREATER.invert }.
     *
     * @param toCheck See {@link GREATER.checkAlgorithm }.
     *
     * @returns See {@link GREATER.checkAlgorithm}. */
    check(toCheck) {
        return GREATER.checkAlgorithm(toCheck, this.equivalent, this.equalityPermitted, this.invert);
    }
    /**
     * Creates this {@link GREATER } by setting the protected property {@link GREATER.equivalent }, {@link GREATER.equalityPermitted } and {@link GREATER.invert } used by {@link GREATER.check }.
     *
     * @param equivalent        See {@link GREATER.check }.
     * @param equalityPermitted See {@link GREATER.check }.
     * @param invert            See {@link GREATER.check }. */
    constructor(equivalent, equalityPermitted = false, invert = false) {
        super();
        this.equivalent = equivalent;
        this.equalityPermitted = equalityPermitted;
        this.invert = invert;
    }
}
