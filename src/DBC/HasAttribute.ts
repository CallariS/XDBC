import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that a {@link HTMLElement } gotta have a certain attribute set.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (XDBC@WaXCode.net) */
export class HasAttribute extends DBC {
	// #region Condition checking.
	/**
	 * Checks if the {@link HTMLElement } **toCheck** has the attribute **toCheckFor**.
	 *
	 * @param toCheckFor  name of the attribute to check for whether it is set or not.
	 *
	 * @returns TRUE if the {@link HTMLElement } **toCheck** has set the attribute **toCheckFor**,
	 * 			otherwise a proper errormessage. */
	public static checkAlgorithm(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		toCheck: any,
		toCheckFor: string,
		invert,
	): boolean | string {
		if (!(toCheck instanceof HTMLElement)) {
			return `The object to check for whether it has the attribute "${toCheckFor}" is not a HTMLElement. It is of type "${typeof toCheck}".`;
		}

		if (!invert && !(toCheck as HTMLElement).hasAttribute(toCheckFor)) {
			return `Required Attribute "${toCheckFor}" is not set.`;
		}

		if (invert && (toCheck as HTMLElement).hasAttribute(toCheckFor)) {
			return `Forbidden Attribute "${toCheckFor}" is set.`;
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link HasAttribute.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param toCheckFor	See {@link HasAttribute.checkAlgorithm }.
	 * @param path			See {@link DBC.decPrecondition }.
	 * @param dbc			See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	public static PRE(
		toCheckFor: string,
		invert = false,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		methodName: string | symbol | undefined,
		parameterIndex: number,
	) => void {
		return DBC.createPRE(
			HasAttribute.checkAlgorithm,
			[toCheckFor, invert],
			dbc,
			path,
		);
	}
	/**
	 * A method-decorator factory using the {@link HasAttribute.checkAlgorithm } to determine whether this {@link DBC } is
	 * fulfilled by the tagged method's returnvalue.
	 *
	 * @param toCheckFor	See {@link HasAttribute.checkAlgorithm }.
	 * @param path			See {@link DBC.Postcondition }.
	 * @param dbc			See {@link DBC.decPostcondition }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	public static POST(
		toCheckFor: string,
		invert = false,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.createPOST(
			HasAttribute.checkAlgorithm,
			[toCheckFor, invert],
			dbc,
			path,
		);
	}
	/**
	 * A field-decorator factory using the {@link hasAttribute.checkAlgorithm } to determine whether this {@link DBC } is
	 * fulfilled by the tagged field.
	 *
	 * @param toCheckFor	See {@link hasAttribute.checkAlgorithm }.
	 * @param path			See {@link DBC.decInvariant }.
	 * @param dbc			See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	public static INVARIANT(
		toCheckFor: any,
		invert = false,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.createINVARIANT(HasAttribute, [toCheckFor, invert], dbc, path);
	}
	/**
	 * A field-decorator factory using the {@link hasAttribute.checkAlgorithm } to determine whether this {@link DBC } is
	 * fulfilled by the tagged field's class instance.
	 *
	 * @param toCheckFor	See {@link hasAttribute.checkAlgorithm }.
	 * @param path			See {@link DBC.decInvariant }.
	 * @param dbc			See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	public static cINVARIANT(
		toCheckFor: any,
		invert = false,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.decClassInvariant(
			[new HasAttribute(toCheckFor, invert)],
			path,
			dbc,
		);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link hasAttribute.checkAlgorithm } passing the value **toCheck**, {@link hasAttribute.equivalent } and
	 * {@link hasAttribute.invert }.
	 *
	 * @param toCheck See {@link EQ.checkAlgorithm }.
	 *
	 * @returns See {@link EQ.checkAlgorithm}. */
	// biome-ignore lint/suspicious/noExplicitAny: Necessary to check against NULL & UNDEFINED.
	public check(toCheck: any) {
		return HasAttribute.checkAlgorithm(toCheck, this.toCheckFor, this.invert);
	}
	/**
	 * Creates this {@link DBC } by setting the protected property {@link hasAttribute.equivalent } used by
	 * {@link hasAttribute.check }.
	 *
	 * @param toCheckFor See {@link hasAttribute.check }. */
	public constructor(
		protected toCheckFor: string,
		protected invert = false,
	) {
		super();
	}
	// #endregion Referenced Condition checking.
}
