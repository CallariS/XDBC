/**
 * Provides a [D]esign [B]y [C]ontract Framework using decorators.
 */
export class DBC {
    constructor() {
        this.g = 0;
    }
    /** A decorator that checks
     *
     * @param target
     * @param methodName
     * @param parameterIndex
     */
    static decPrecondition(init) {
        const b = init;
        return (target, methodName, parameterIndex) => {
            //console.log(`X:${DBC.parameterValues.get(target).get(methodName as string)}`,);
            console.log(target);
        };
    }
    static log(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        descriptor.value = function (...args) {
            console.log(`Calling ${target.constructor.name}.${propertyKey} with arguments: ${JSON.stringify(args)}`);
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
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
DBC.parameterValues = 
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
new Map();
