import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that an {@link object }s must be defined thus it's value may not be **null** or **undefined**.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
export class DEFINED extends DBC {
    /**
     * Checks if the value **toCheck** is null or undefined.
     *
     * @param toCheck	The {@link Object } to check.
     *
     * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
    static checkAlgorithm(toCheck) {
        // biome-ignore lint/suspicious/useValidTypeof: Necessary
        if (toCheck === undefined || toCheck === null) {
            return `Value may not be UNDEFINED or NULL but it is ${toCheck === undefined ? "UNDEFINED" : "NULL"}`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link DEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param type	See {@link DEFINED.checkAlgorithm }.
     * @param path	See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return DEFINED.checkAlgorithm(value);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link DEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param type	See {@link DEFINED.checkAlgorithm }.
     * @param path	See {@link DBC.Postcondition }.
     * @param dbc	See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(type, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPostcondition((value, target, propertyKey) => {
            return DEFINED.checkAlgorithm(value);
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link DEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param type	See {@link DEFINED.checkAlgorithm }.
     * @param path	See {@link DBC.decInvariant }.
     * @param dbc	See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(type, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decInvariant([new DEFINED()], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link DEFINED.checkAlgorithm } passing the value **toCheck** and the {@link DEFINED.type } .
     *
     * @param toCheck See {@link DEFINED.checkAlgorithm }.
     *
     * @returns See {@link DEFINED.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    check(toCheck) {
        return DEFINED.checkAlgorithm(toCheck);
    }
    /**
     * Invokes the {@link DEFINED.checkAlgorithm } passing the value **toCheck** and the {@link DEFINED.type } .
     *
     * @param toCheck	See {@link DEFINED.checkAlgorithm }.
     * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
     *
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link DEFINED }.
     *
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }.*/
    static tsCheck(toCheck, id = undefined) {
        const result = DEFINED.checkAlgorithm(toCheck);
        if (result === true) {
            return toCheck;
        }
        else {
            throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}`);
        }
    }
    /** Creates this {@link DEFINED }. */
    constructor() {
        super();
    }
}
