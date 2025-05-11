import { DBC } from "../DBC.js";
/**
 * A {@link DBC } defining that an {@link object }s gotta be of certain {@link TYPE.type }.
 *
 * @remarks
 * Author: 		Salvatore Callari (Callari@WaXCode.net) / 2025
 * Maintainer:	Salvatore Callari (XDBC@WaXCode.net) */
export class TYPE extends DBC {
    /**
     * Checks if the value **toCheck** is of the **type** specified.
     *
     * @param toCheck	The {@link Object } which's **type** to check.
     * @param type		The type the {@link object} **toCheck** has to be of.
     *
     * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
    static checkAlgorithm(toCheck, type) {
        // biome-ignore lint/suspicious/useValidTypeof: Necessary
        if (typeof toCheck !== type) {
            return `Value has to to be of type "${type}" but is of type "${typeof toCheck}"`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param type	See {@link TYPE.checkAlgorithm }.
     * @param path	See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(type, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return TYPE.checkAlgorithm(value, type);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param type	See {@link TYPE.checkAlgorithm }.
     * @param path	See {@link DBC.Postcondition }.
     * @param dbc	See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(type, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPostcondition((value, target, propertyKey) => {
            return TYPE.checkAlgorithm(value, type);
        }, dbc, path);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link TYPE.checkAlgorithm } passing the value **toCheck** and the {@link TYPE.type } .
     *
     * @param toCheck See {@link TYPE.checkAlgorithm }.
     *
     * @returns See {@link TYPE.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    check(toCheck) {
        return TYPE.checkAlgorithm(toCheck, this.type);
    }
    /**
     * Creates this {@link TYPE } by setting the protected property {@link TYPE.type } used by {@link TYPE.check }.
     *
     * @param type See {@link TYPE.check }. */
    constructor(type) {
        super();
        this.type = type;
    }
}
