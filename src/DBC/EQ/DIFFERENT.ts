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
	/**
	 * Precondition overload signature.
	 * @param equivalent - The value to compare for inequality
	 * @param path - The property path
	 * @param hint - Optional hint message
	 */
	public static override  PRE(
		equivalent,
		path,
		hint
	);
	/**
	 * Precondition overload signature.
	 * @param equivalent - The value to compare for inequality
	 * @param path - The property path
	 */
	public static override PRE(
		equivalent,
		path,
	);
	/** See {@link COMPARISON.PRE }. */
	public static override PRE(
		equivalent,
		invert: boolean = false,
		path: string = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return EQ.PRE(equivalent, true, path, hint, dbc);
	}

	public static override POST(
		equivalent,
		path,
		hint
	);
	public static override POST(
		equivalent,
		path,
	);

	/** See {@link COMPARISON.POST }. */
	public static override POST(
		equivalent,
		invert = false,
		path: string = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return EQ.POST(equivalent, true, path, hint, dbc);
	}
	public static override INVARIANT(
		equivalent,
		path,
		hint
	);
	public static override INVARIANT(
		equivalent,
		path,
	);

	/** See {@link COMPARISON.INVARIANT }. */
	public static INVARIANT(
		equivalent,
		invert = false,
		path: string = undefined,
		hint: string | undefined = undefined,
		dbc: string | undefined = undefined,
	) {
		return EQ.INVARIANT(equivalent, true, path, hint, dbc);
	}
	/** See {@link COMPARISON.constructor }. */
	constructor(public equivalent) {
		super(equivalent, true);
	}
}
