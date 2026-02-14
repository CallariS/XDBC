import { DBC } from "../DBC";
import { z } from 'zod';
/**
 * A {@link DBC } defining that the an {@link object }s gotta be an instance of a certain {@link ZOD.schema }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
export class ZOD extends DBC {
    /**
     * Checks if the value **toCheck** complies to the specified {@link z.ZodType }.
     *
     * @param toCheck	The value that has to comply to the specified **schema** in order for this {@link DBC }
     * @param schema	The {@link z.ZodType } the {@link object } **toCheck** has comply to in order for this {@link DBC } to be
     * 					fulfilled.
     *
     * @returns TRUE if the value **toCheck** complies to the specified **schema**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    static checkAlgorithm(toCheck, schema) {
        if (!schema.safeParse(toCheck).success) {
            console.log(z.toJSONSchema(schema));
            return `Value has to correspond to "${JSON.stringify(z.toJSONSchema(schema).properties)}" but is constituted as "${JSON.stringify(toCheck)}"`;
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link ZOD.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param schema	See {@link ZOD.checkAlgorithm }.
     * @param path		See {@link DBC.decPrecondition }.
     * @param dbc		See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    schema, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            return ZOD.checkAlgorithm(value, schema);
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link ZOD.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param schema	See {@link ZOD.checkAlgorithm }.
     * @param path	See {@link DBC.Postcondition }.
     * @param dbc	See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    schema, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPostcondition((value, target, propertyKey) => {
            return ZOD.checkAlgorithm(value, schema);
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link ZOD.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param schema	See {@link ZOD.checkAlgorithm }.
     * @param path	See {@link DBC.decInvariant }.
     * @param dbc	See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    schema, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decInvariant([new ZOD(schema)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link ZOD.checkAlgorithm } passing the value **toCheck** and the {@link ZOD.schema } .
     *
     * @param toCheck See {@link ZOD.checkAlgorithm }.
     *
     * @returns See {@link ZOD.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    check(toCheck) {
        return ZOD.checkAlgorithm(toCheck, this.schema);
    }
    /**
     * Invokes the {@link ZOD.checkAlgorithm } passing the value **toCheck** and the {@link ZOD.schema } .
     *
     * @param toCheck 	See {@link ZOD.checkAlgorithm }.
     * @param schema	See {@link ZOD.checkAlgorithm }.
     * @param id		A {@link string } identifying this {@link ZOD } via the {@link DBC.Infringement }-Message.
     *
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link ZOD }.
     *
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
    static tsCheck(toCheck, schema, id = undefined) {
        const result = ZOD.checkAlgorithm(toCheck, schema);
        if (result === true) {
            return toCheck;
        }
        else {
            throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}`);
        }
    }
    /**
     * Creates this {@link ZOD } by setting the protected property {@link ZOD.schema } used by {@link ZOD.check }.
     *
     * @param schema See {@link ZOD.check }. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    constructor(schema) {
        super();
        this.schema = schema;
    }
}
