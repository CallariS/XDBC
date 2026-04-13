import { COMPARISON } from "../COMPARISON";
/** See {@link COMPARISON }. */
export class GREATER extends COMPARISON {
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
		return COMPARISON.PRE(equivalent, false, false, path, hint, dbc);
	}
	/** See {@link COMPARISON.POST }. */
	public static override POST(
		// biome-ignore lint/suspicious/noExplicitAny: Comparison target can be any numeric value
		equivalent: any,
		equalityPermitted = false,
		invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined
	) {
		return COMPARISON.POST(equivalent, false, false, path, hint, dbc);
	}
	/** See {@link COMPARISON.INVARIANT }. */
	public static override INVARIANT(
		// biome-ignore lint/suspicious/noExplicitAny: Comparison target can be any numeric value
		equivalent: any,
		equalityPermitted = false,
		invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined
	) {
		return COMPARISON.INVARIANT(equivalent, false, false, path, hint, dbc);
	}
	/** See {@link COMPARISON.constructor }. */
	// biome-ignore lint/suspicious/noExplicitAny: Comparison target can be any numeric value
	constructor(public override equivalent: any) {
		super(equivalent, false, false);
	}
}
