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
    static checkAlgorithm(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    toCheck, condition, inCase, invert) {
        if (!invert && condition.check(toCheck) && !inCase.check(toCheck)) {
            return `In case that the value complies to "${condition}" it also has to comply to "${inCase}"`;
        }
        if (!invert && !condition.check(toCheck) && !inCase.check(toCheck)) {
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
    static PRE(condition, inCase, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return IF.checkAlgorithm(value, condition, inCase, invert);
        }, dbc, path);
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
    static POST(condition, inCase, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPostcondition((value, target, propertyKey) => {
            return IF.checkAlgorithm(value, condition, inCase, invert);
        }, dbc, path);
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
    static INVARIANT(condition, inCase, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decInvariant([new IF(condition, inCase, invert)], path, dbc);
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
    check(toCheck) {
        return IF.checkAlgorithm(toCheck, this.condition, this.inCase, this.invert);
    }
    /**
     * Creates this {@link IF } by setting the protected property {@link IF.equivalent } used by {@link IF.check }.
     *
     * @param equivalent See {@link IF.check }. */
    constructor(
    // biome-ignore lint/suspicious/noExplicitAny: To be able to match UNDEFINED and NULL.
    condition, inCase, invert = false) {
        super();
        this.condition = condition;
        this.inCase = inCase;
        this.invert = invert;
    }
}
