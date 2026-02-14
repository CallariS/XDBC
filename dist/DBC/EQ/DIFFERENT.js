import { EQ } from "../EQ";
/** See {@link COMPARISON }. */
export class DIFFERENT extends EQ {
    /** See {@link COMPARISON.PRE }. */
    static PRE(equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return EQ.PRE(equivalent, true, path, dbc);
    }
    /** See {@link COMPARISON.POST }. */
    static POST(equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return EQ.POST(equivalent, true, path, dbc);
    }
    /** See {@link COMPARISON.INVARIANT }. */
    static INVARIANT(equivalent, invert = false, path = undefined, dbc = "WaXCode.DBC") {
        return EQ.INVARIANT(equivalent, true, path, dbc);
    }
    /** See {@link COMPARISON.constructor }. */
    constructor(equivalent) {
        super(equivalent, true);
        this.equivalent = equivalent;
    }
}
