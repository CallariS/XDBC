import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that all elements of an {@link object }s have to fulfill
 * a given {@link object }'s check-method (**( toCheck : any ) => boolean | string**).
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class AE extends DBC {
    // #region Condition checking.
    /**
     * Checks each element of the **value**-{@link Array < any >} against the given **condition**, if it is one. If it is not
     * the **value** itself will be checked.
     *
     * @param condition	The { check: (toCheck: any) => boolean | string } to check the **value** against.
     * @param value		Either **value**-{@link Array < any >}, which's elements will be checked, or the value to be
     * 					checked itself.
     * @param index		If specified with **idxEnd** being undefined, this {@link Number } will be seen as the index of
     * 					the value-{@link Array }'s element to check. If value isn't an {@link Array } this parameter
     * 					will not have any effect.
     * 					With **idxEnd** not undefined this parameter indicates the beginning of the span of elements to
     * 					check within the value-{@link Array }.
     * @param idxEnd	Indicates the last element's index (including) of the span of value-{@link Array } elements to check.
     * 					Setting this parameter to -1 specifies that all value-{@link Array }'s elements beginning from the
     * 					specified **index** shall be checked.
     *
     * @returns As soon as the **condition** returns a {@link string }, instead of TRUE, the returned string. TRUE if the
     * 			**condition** never returns a {@link string}. */
    static checkAlgorithm(condition, value, index, idxEnd) {
        if (Array.isArray(value)) {
            if (index !== undefined && idxEnd === undefined) {
                if (index > -1 && index < value.length) {
                    const result = condition.check(value[index]);
                    if (typeof result === "string") {
                        return `Violating-Arrayelement at index "${index}" with value "${value[index]}". ${result}`;
                    }
                }
                return true; // In order for optional parameter to not cause an error if they are omitted.
            }
            const ending = idxEnd !== undefined
                ? idxEnd !== -1
                    ? idxEnd + 1
                    : value.length
                : value.length;
            for (let i = index ? index : 0; i < ending; i++) {
                const result = condition.check(value[i]);
                if (result !== true) {
                    return `Violating-Arrayelement at index ${i}. ${result}`;
                }
            }
        }
        else {
            return condition.check(value);
        }
        return true;
    }
    /**
     * A parameter-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged parameter-value against with.
     * When specifying an **index** and the tagged parameter's **value** is an {@link Array }, the **realConditions** apply to the
     * element at the specified **index**.
     * If the {@link Array } is too short the currently processed { check: (toCheck: any) => boolean | string } of
     * **realConditions** will be verified to TRUE automatically, considering optional parameters.
     * If an **index** is specified but the tagged parameter's value isn't an array, the **index** is treated as being undefined.
     * If **index** is undefined and the tagged parameter's value is an {@link Array } each element of it will be checked
     * against the **realConditions**.
     *
     * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
     * 							against with.
     * @param index				See the {@link AE.checkAlgorithm }.
     * @param idxEnd			See the {@link AE.checkAlgorithm }.
     * @param path				See {@link DBC.decPrecondition }.
     * @param dbc				See {@link DBC.decPrecondition }.
     *
     * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** returns one.
     * 			Otherwise TRUE. */
    static PRE(realConditions, index = undefined, idxEnd = undefined, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPrecondition((value, target, methodName, parameterIndex) => {
            if (Array.isArray(realConditions)) {
                for (const currentCondition of realConditions) {
                    const result = AE.checkAlgorithm(currentCondition, value, index, idxEnd);
                    if (typeof result !== "boolean")
                        return result;
                }
            }
            else {
                return AE.checkAlgorithm(realConditions, value, index, idxEnd);
            }
            return true;
        }, dbc, path);
    }
    /**
     * A method-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged method's return-value against with.
     *
     * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
     * 							against with.
     * @param index				See the {@link AE.checkAlgorithm }.
     * @param idxEnd			See the {@link AE.checkAlgorithm }.
     * @param path				See {@link DBC.decPrecondition }.
     * @param dbc				See {@link DBC.decPrecondition }.
     *
     * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** return one.
     * 			Otherwise TRUE. */
    static POST(realConditions, index = undefined, idxEnd = undefined, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decPostcondition((value, target, propertyKey) => {
            if (Array.isArray(realConditions)) {
                for (const currentCondition of realConditions) {
                    const result = AE.checkAlgorithm(currentCondition, value, index, idxEnd);
                    if (typeof result !== "boolean")
                        return result;
                }
            }
            else {
                return AE.checkAlgorithm(
                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                realConditions, value, index, idxEnd);
            }
            return true;
        }, dbc, path);
    }
    /**
     * A field-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged field.
     *
     * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
     * 							against with.
     * @param index				See the {@link AE.checkAlgorithm }.
     * @param idxEnd			See the {@link AE.checkAlgorithm }.
     * @param path				See {@link DBC.decInvariant }.
     * @param dbc				See {@link DBC.decInvariant }.
     *
     * @returns	See {@link DBC.decInvariant }. */
    static INVARIANT(realConditions, index = undefined, idxEnd = undefined, path = undefined, dbc = "WaXCode.DBC") {
        return DBC.decInvariant([new AE(realConditions, index, idxEnd)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like global functions).
    //
    /**
     * Invokes the {@link AE.checkAlgorithm } with all {@link AE.conditions } and the {@link object } {@link toCheck },
     * {@link AE.index } & {@link AE.idxEnd }.
     *
     * @param toCheck See {@link AE.checkAlgorithm }.
     *
     * @returns See {@link EQ.checkAlgorithm}. */
    check(toCheck) {
        if (Array.isArray(this.conditions)) {
            for (const currentCondition of this.conditions) {
                const result = AE.checkAlgorithm(currentCondition, toCheck, this.index, this.idxEnd);
                if (typeof result !== "boolean")
                    return result;
            }
        }
        else {
            return AE.checkAlgorithm(
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            this.conditions, toCheck, this.index, this.idxEnd);
        }
        return true;
    }
    /**
     * Creates this {@link AE } by setting the protected property {@link AE.conditions }, {@link AE.index } and {@link AE.idxEnd } used by {@link AE.check }.
     *
     * @param equivalent See {@link EQ.check }. */
    constructor(conditions, index = undefined, idxEnd = undefined) {
        super();
        this.conditions = conditions;
        this.index = index;
        this.idxEnd = idxEnd;
    }
}
