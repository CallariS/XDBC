import { COMPARISON } from "../COMPARISON";
/** See {@link COMPARISON }. */
export class GREATER extends COMPARISON {
	/** See {@link COMPARISON.PRE }. */
	public static override PRE(
		equivalent,
		equalityPermitted = false,
		invert = false,
		dbc: string | undefined = undefined,
		path: string = undefined,
		hint: string | undefined = undefined,
	) {
		return COMPARISON.PRE(equivalent, false, false, path, dbc, hint);
	}
	/** See {@link COMPARISON.POST }. */
	public static override POST(
		equivalent,
		equalityPermitted = false,
		invert = false,
		dbc: string | undefined = undefined,
		path: string = undefined,
		hint: string | undefined = undefined,
	) {
		return COMPARISON.POST(equivalent, false, false, path, dbc, hint);
	}
	/** See {@link COMPARISON.INVARIANT }. */
	public static override INVARIANT(
		equivalent,
		equalityPermitted = false,
		invert = false,
		dbc: string | undefined = undefined,
		path: string = undefined,
		hint: string | undefined = undefined
	) {
		return COMPARISON.INVARIANT(equivalent, false, false, path, dbc, hint);
	}
	/** See {@link COMPARISON.constructor }. */
	constructor(public override equivalent) {
		super(equivalent, false, false);
	}
}
