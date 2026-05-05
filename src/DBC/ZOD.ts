import type { z } from "zod";
import { DBC } from "../DBC";
/**
 * A {@link DBC } defining that the an {@link object }s gotta be an instance of a certain {@link ZOD.schema }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (XDBC@WaXCode.net) */
export class ZOD extends DBC {
	/**
	 * Checks if the value **toCheck** complies to the specified {@link z.ZodType }.
	 *
	 * @param toCheck	The value that has to comply to the specified **schema** in order for this {@link DBC }
	 * @param schema	The {@link z.ZodType } the {@link object } **toCheck** has comply to in order for this {@link DBC } to be
	 * 					fulfilled.
	 *
	 * @returns TRUE if the value **toCheck** complies to the specified **schema**, otherwise FALSE. */
	// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
	public static checkAlgorithm(
		toCheck: any,
		schema: z.ZodType,
	): boolean | string {
		const result = schema.safeParse(toCheck);
		if (!result.success) {
			return `Value does not comply to the specified schema. Received: "${JSON.stringify(toCheck)}". Errors: ${result.error.message}`;
		}

		return true;
	}
	/**
	 * A parameter-decorator factory using the {@link ZOD.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged parameter.
	 *
	 * @param schema	See {@link ZOD.checkAlgorithm }.
	 * @param path		See {@link DBC.decPrecondition }.
	 * @param dbc		See {@link DBC.decPrecondition }.
	 *
	 * @returns See {@link DBC.decPrecondition }. */
	public static PRE(
		// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
		schema: z.ZodType,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		methodName: string | symbol | undefined,
		parameterIndex: number,
	) => void {
		return DBC.createPRE(ZOD.checkAlgorithm, [schema], dbc, path);
	}
	/**
	 * A method-decorator factory using the {@link ZOD.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param schema	See {@link ZOD.checkAlgorithm }.
	 * @param path	See {@link DBC.Postcondition }.
	 * @param dbc	See {@link DBC.decPostcondition }.
	 *
	 * @returns See {@link DBC.decPostcondition }. */
	public static POST(
		// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
		schema: z.ZodType,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	): (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => PropertyDescriptor {
		return DBC.createPOST(ZOD.checkAlgorithm, [schema], dbc, path);
	}
	/**
	 * A field-decorator factory using the {@link ZOD.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
	 * by the tagged method's returnvalue.
	 *
	 * @param schema	See {@link ZOD.checkAlgorithm }.
	 * @param path	See {@link DBC.decInvariant }.
	 * @param dbc	See {@link DBC.decInvariant }.
	 *
	 * @returns See {@link DBC.decInvariant }. */
	public static INVARIANT(
		// biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
		schema: z.ZodType,
		path: string | undefined = undefined,
		dbc = "WaXCode.DBC",
	) {
		return DBC.createINVARIANT(ZOD, [schema], dbc, path);
	}
	// #endregion Condition checking.
	// #region Referenced Condition checking.
	//
	// For usage in dynamic scenarios (like with AE-DBC).
	//
	/**
	 * Invokes the {@link ZOD.checkAlgorithm } passing the value **toCheck** and the {@link ZOD.schema } .
	 *
	 * @param toCheck See {@link ZOD.checkAlgorithm }.
	 *
	 * @returns See {@link ZOD.checkAlgorithm}. */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public check(toCheck: any) {
		return ZOD.checkAlgorithm(toCheck, this.schema);
	}
	/**
	 * Invokes the {@link ZOD.checkAlgorithm } passing the value **toCheck** and the {@link ZOD.schema } .
	 *
	 * @param toCheck 	See {@link ZOD.checkAlgorithm }.
	 * @param schema	See {@link ZOD.checkAlgorithm }.
	 * @param id		A {@link string } identifying this {@link ZOD } via the {@link DBC.Infringement }-Message.
	 *
	 * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link ZOD }.
	 *
	 * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
	public static tsCheck<CANDIDATE = unknown>(
		toCheck: any,
		schema: z.ZodType,
		id: string | undefined = undefined,
		dbc: string | undefined = undefined,
	): CANDIDATE {
		const result = ZOD.checkAlgorithm(toCheck, schema);

		if (result === true) {
			return toCheck;
		}
		DBC.reportTsCheckInfringement(`${id ? `(${id}) ` : ""}${result as string}`, dbc);
		return toCheck as CANDIDATE;
	}
	/**
	 * Creates this {@link ZOD } by setting the protected property {@link ZOD.schema } used by {@link ZOD.check }.
	 *
	 * @param schema See {@link ZOD.check }. */
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	public constructor(protected schema: z.ZodType) {
		super();
	}
}
