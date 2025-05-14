import { COMPARISON } from "../COMPARISON";
/** See {@link COMPARISON }. */
export class GREATER extends COMPARISON {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.PRE(equivalent, false, false, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.POST(equivalent, false, false, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return COMPARISON.INVARIANT(equivalent, false, false, path, dbc);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, false, false);
        this.equivalent = equivalent;
    }
}
