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
    static checkAlgorithm(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    toCheck, equivalent, invert) {
        if (!invert && equivalent !== toCheck) {
            return `Value has to to be equal to "${equivalent}"`;
        }
        if (invert && equivalent === toCheck) {
            return `Value must not to be equal to "${equivalent}"`;
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
    static PRE(
    // biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
    equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return EQ.checkAlgorithm(value, equivalent, invert);
        }, dbc, path);
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
    static POST(
    // biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
    equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPostcondition((value, target, propertyKey) => {
            return EQ.checkAlgorithm(value, equivalent, invert);
        }, dbc, path);
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
    static INVARIANT(
    // biome-ignore lint/suspicious/noExplicitAny: To check for UNDEFINED and NULL.
    equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decInvariant([new EQ(equivalent, invert)], path, dbc);
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
    check(toCheck) {
        return EQ.checkAlgorithm(toCheck, this.equivalent, this.invert);
    }
    /**
     * Creates this {@link EQ } by setting the protected property {@link EQ.equivalent } used by {@link EQ.check }.
     *
     * @param equivalent See {@link EQ.check }. */
    constructor(
    // biome-ignore lint/suspicious/noExplicitAny: To be able to match UNDEFINED and NULL.
    equivalent, invert = false) {
        super();
        this.equivalent = equivalent;
        this.invert = invert;
    }
}
