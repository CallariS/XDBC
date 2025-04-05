/**
 * Provides a [D]esign [B]y [C]ontract Framework using decorators.
 */
export class DBC {
	static paramValueRequests: Map<
		object,
		Map<string | symbol, Map<number, Array<(value: unknown) => undefined>>>
	> = new Map<
		object,
		Map<string | symbol, Map<number, Array<(value: unknown) => undefined>>>
	>();
	protected static requestParamValue(
		target: object,
		methodName: string | symbol,
		index: number,
		receptor: (value: unknown) => undefined,
	): undefined {
		if (DBC.paramValueRequests.has(target)) {
			if (DBC.paramValueRequests.get(target).has(methodName)) {
				if (DBC.paramValueRequests.get(target).get(methodName).has(index)) {
					DBC.paramValueRequests
						.get(target)
						.get(methodName)
						.get(index)
						.push(receptor);
				} else {
					DBC.paramValueRequests
						.get(target)
						.get(methodName)
						.set(index, new Array<(value: unknown) => undefined>(receptor));
				}
			} else {
				DBC.paramValueRequests
					.get(target)
					.set(
						methodName,
						new Map<number, Array<(value: unknown) => undefined>>([
							[index, new Array<(value: unknown) => undefined>(receptor)],
						]),
					);
			}
		} else {
			DBC.paramValueRequests.set(
				target,
				new Map<
					string | symbol,
					Map<number, Array<(value: unknown) => undefined>>
				>([
					[
						methodName,
						new Map<number, Array<(value: unknown) => undefined>>([
							[index, new Array<(value: unknown) => undefined>(receptor)],
						]),
					],
				]),
			);
		}
		return undefined;
	}
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
	protected static decPrecondition(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		check: (...args: any[]) => void,
	): (
		target: object,
		methodName: string | symbol,
		parameterIndex: number,
	) => void {
		return (
			target: object,
			methodName: string | symbol,
			parameterIndex: number,
		): void => {
			DBC.requestParamValue(
				target,
				methodName,
				parameterIndex,
				(value: unknown) => {
					console.log("y", value);
					check(value);
				},
			);
			//console.log(`X:${DBC.parameterValues.get(target).get(methodName as string)}`,);
			console.log("x333", target);
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
			console.log("A", target);
			console.log("B	", propertyKey);
			if (
				DBC.paramValueRequests.has(target) &&
				DBC.paramValueRequests.get(target).has(propertyKey)
			) {
				console.log("K", DBC.paramValueRequests.get(target).get(propertyKey));
				for (const index of DBC.paramValueRequests
					.get(target)
					.get(propertyKey)
					.keys()) {
					console.log("R", index);
					if (index < args.length) {
						for (const receptor of DBC.paramValueRequests
							.get(target)
							.get(propertyKey)
							.get(index)) {
							receptor(args[index]);
						}
					}
				}
			}
			console.log(DBC.paramValueRequests);
			/*if (DBC.parameterValues.has(target)) {
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
			}*/
			const result = originalMethod.apply(this, args);
			console.log(`Result: ${result}`);
			return result;
		};

		return descriptor;
	}
}
