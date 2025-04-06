import { DBC } from "./DBC.js";
import { REGEX } from "./DBC/REGEX.js";

export class Calculator {
	@DBC.PRE
	public divide(@REGEX.PRE("r") a: number, b: number): number {
		return a / b;
	}
}

console.log("test", new Calculator().divide(2, 1));
