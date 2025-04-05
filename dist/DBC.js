/**
 * Provides a [D]esign [B]y [C]ontract Framework using decorators.
 */
export class DBC {
    constructor() {
        this.g = 0;
    }
    static requestParamValue(target, methodName, index, receptor) {
        if (DBC.paramValueRequests.has(target)) {
            if (DBC.paramValueRequests.get(target).has(methodName)) {
                if (DBC.paramValueRequests.get(target).get(methodName).has(index)) {
                    DBC.paramValueRequests
                        .get(target)
                        .get(methodName)
                        .get(index)
                        .push(receptor);
                }
                else {
                    DBC.paramValueRequests
                        .get(target)
                        .get(methodName)
                        .set(index, new Array(receptor));
                }
            }
            else {
                DBC.paramValueRequests
                    .get(target)
                    .set(methodName, new Map([
                    [index, new Array(receptor)],
                ]));
            }
        }
        else {
            DBC.paramValueRequests.set(target, new Map([
                [
                    methodName,
                    new Map([
                        [index, new Array(receptor)],
                    ]),
                ],
            ]));
        }
        return undefined;
    }
    /** A decorator that checks
     *
     * @param target
     * @param methodName
     * @param parameterIndex
     */
    static decPrecondition(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    check) {
        return (target, methodName, parameterIndex) => {
            DBC.requestParamValue(target, methodName, parameterIndex, (value) => {
                console.log("y", value);
                check(value);
            });
            //console.log(`X:${DBC.parameterValues.get(target).get(methodName as string)}`,);
            console.log("x333", target);
        };
    }
    static log(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        descriptor.value = function (...args) {
            console.log(`Calling ${target.constructor.name}.${propertyKey} with arguments: ${JSON.stringify(args)}`);
            console.log("A", target);
            console.log("B	", propertyKey);
            if (DBC.paramValueRequests.has(target) &&
                DBC.paramValueRequests.get(target).has(propertyKey)) {
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
DBC.paramValueRequests = new Map();
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
DBC.parameterValues = 
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
new Map();
