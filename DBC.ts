/**
 * Provides a [D]esign [B]y [C]ontract Framework using decorators.
 */
export class DBC {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	protected static parameterValues: Map<object, Map<string, Array<any>>> =
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		new Map<object, Map<string, Array<any>>>();
	/** A decorator that checks
	 *
	 * @param target
	 * @param methodName
	 * @param parameterIndex
	 */
	protected static decPrecondition(init: {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		arguments: any[];
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		check: (...args: any[]) => void;
	}): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		const b = init;
		return (
			target: object,
			methodName: string | symbol,
			parameterIndex: number,
		): void => {
			console.log(
				`X:${DBC.parameterValues.get(target).get(methodName as string)}`,
			);
			console.log(target);
		};
	}
	public g = 0;

	public static log(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value;

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		descriptor.value = function (...args: any[]) {
			console.log(
				`Calling ${target.constructor.name}.${propertyKey} with arguments: ${JSON.stringify(args)}`,
			);
			if (DBC.parameterValues.has(target)) {
				if (DBC.parameterValues.get(target).has(propertyKey)) {
					DBC.parameterValues.get(target).set(propertyKey, args);
				} else {
					DBC.parameterValues.get(target).set(propertyKey, args);
				}
			} else {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				DBC.parameterValues.set(
					target,
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					new Map<string, Array<any>>([[propertyKey, args]]),
				);
			}
			const result = originalMethod.apply(this, args);
			console.log(`Result: ${result}`);
			return result;
		};

		return descriptor;
	}
}
