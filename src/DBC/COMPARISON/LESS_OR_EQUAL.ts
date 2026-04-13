import { COMPARISON } from "../COMPARISON";
/** See {@link COMPARISON }. */
export class LESS_OR_EQUAL extends COMPARISON {
	/** See {@link COMPARISON.PRE }. */
	public static override PRE(
		// biome-ignore lint/suspicious/noExplicitAny: Comparison target can be any numeric value
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
		// biome-ignore lint/suspicious/noExplicitAny: Comparison target can be any numeric value
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
		// biome-ignore lint/suspicious/noExplicitAny: Comparison target can be any numeric value
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
	// biome-ignore lint/suspicious/noExplicitAny: Comparison target can be any numeric value
	constructor(public equivalent: any) {
		super(equivalent, true, true);
	}
}
