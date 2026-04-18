import { EQ } from "../EQ";
/**
 * DIFFERENT class for inequality comparisons.
 *
 * This class extends EQ and provides methods to check if a value is different (not equal)
 * from a specified equivalent value. It inverts the equality check by always passing
 * `true` for the invert parameter to the parent EQ class methods.
 *
 * @remarks
 * The class provides precondition (PRE), postcondition (POST), and invariant (INVARIANT)
 * checks for Design by Contract programming patterns.
 *
 * @see {@link COMPARISON}
 * @see {@link EQ}
 */
export class DIFFERENT extends EQ {
	/** See {@link EQ.PRE }. Always inverts equality check. */
	// biome-ignore lint/suspicious/noExplicitAny: Must match parent signature
	public static override PRE(
		equivalent: any,
		_invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return EQ.PRE(equivalent, true, path, hint, dbc);
	}

	/** See {@link EQ.POST }. Always inverts equality check. */
	// biome-ignore lint/suspicious/noExplicitAny: Must match parent signature
	public static override POST(
		equivalent: any,
		_invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return EQ.POST(equivalent, true, path, hint, dbc);
	}

	/** See {@link EQ.INVARIANT }. Always inverts equality check. */
	// biome-ignore lint/suspicious/noExplicitAny: Must match parent signature
	public static INVARIANT(
		equivalent: any,
		_invert = false,
		path: string | undefined = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return EQ.INVARIANT(equivalent, true, path, hint, dbc);
	}
	/** See {@link EQ.constructor }. */
	// biome-ignore lint/suspicious/noExplicitAny: Must match parent signature
	constructor(public equivalent: any) {
		super(equivalent, true);
	}
}
