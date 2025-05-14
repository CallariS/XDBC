import { COMPARISON } from "../COMPARISON";
/** See {@link COMPARISON }. */
export class LESS extends COMPARISON {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.PRE(equivalent, false, true, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.POST(equivalent, false, true, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.INVARIANT(equivalent, false, true, path, dbc);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, false, true);
        this.equivalent = equivalent;
    }
}
