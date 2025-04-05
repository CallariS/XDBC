import { DBC } from "../DBC.js";

export class REGEX extends DBC {
	public static PRE(
		a: string,
	): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		return DBC.decPrecondition({
			arguments: [a],
			check: () => {},
		});
	}
}
