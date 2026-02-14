import { COMPARISON } from "../COMPARISON";
/** See {@link COMPARISON }. */
export class LESS extends COMPARISON {
	/** See {@link COMPARISON.PRE }. */
	public static override PRE(
		equivalent,
		equalityPermitted = false,
		invert = false,
		path: string = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return COMPARISON.PRE(equivalent, false, true, path, dbc, hint);
	}
	/** See {@link COMPARISON.POST }. */
	public static override POST(
		equivalent,
		equalityPermitted = false,
		invert = false,
		path: string = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return COMPARISON.POST(equivalent, false, true, path, dbc, hint);
	}
	/** See {@link COMPARISON.INVARIANT }. */
	public static INVARIANT(
		equivalent,
		equalityPermitted = false,
		invert = false,
		path: string = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return COMPARISON.INVARIANT(equivalent, false, true, path, dbc, hint);
	}
	/** See {@link COMPARISON.constructor }. */
	constructor(public equivalent) {
		super(equivalent, false, true);
	}
}
