import { COMPARISON } from "../COMPARISON";
/** See {@link COMPARISON }. */
export class LESS_OR_EQUAL extends COMPARISON {
	/** See {@link COMPARISON.PRE }. */
	public static override PRE(
		equivalent: any,
		equalityPermitted = false,
		invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return COMPARISON.PRE(equivalent, true, true, path, hint, dbc);
	}
	/** See {@link COMPARISON.POST }. */
	public static override POST(
		equivalent: any,
		equalityPermitted = false,
		invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return COMPARISON.POST(equivalent, true, true, path, hint, dbc);
	}
	/** See {@link COMPARISON.INVARIANT }. */
	public static INVARIANT(
		equivalent: any,
		equalityPermitted = false,
		invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return COMPARISON.INVARIANT(equivalent, true, true, path, hint, dbc);
	}
	/** See {@link COMPARISON.constructor }. */
	constructor(public equivalent: any) {
		super(equivalent, true, true);
	}
}
