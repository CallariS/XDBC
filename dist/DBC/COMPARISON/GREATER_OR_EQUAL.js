import { COMPARISON } from "../COMPARISON";
/** See {@link COMPARISON }. */
export class GREATER_OR_EQUAL extends COMPARISON {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.PRE(equivalent, true, false, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.POST(equivalent, true, false, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.INVARIANT(equivalent, true, false, path, dbc);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, true, false);
        this.equivalent = equivalent;
    }
}
