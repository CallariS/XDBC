import { EQ } from "../EQ";
/** See {@link COMPARISON }. */
export class DIFFERENT extends EQ {
	/** See {@link COMPARISON.PRE }. */
	public static override PRE(
		equivalent,
		invert = false,
		path: string = undefined,
		dbc = "WaXCode.DBC",
	) {
		return EQ.PRE(equivalent, true, path, dbc);
	}
	/** See {@link COMPARISON.POST }. */
	public static override POST(
		equivalent,
		invert = false,
		path: string = undefined,
		dbc = "WaXCode.DBC",
	) {
		return EQ.POST(equivalent, true, path, dbc);
	}
	/** See {@link COMPARISON.INVARIANT }. */
	public static INVARIANT(
		equivalent,
		invert = false,
		path: string = undefined,
		dbc = "WaXCode.DBC",
	) {
		return EQ.INVARIANT(equivalent, true, path, dbc);
	}
	/** See {@link COMPARISON.constructor }. */
	constructor(public equivalent) {
		super(equivalent, true);
	}
}
