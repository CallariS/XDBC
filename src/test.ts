import { DBC } from "./DBC.js";
import { REGEX } from "./DBC/REGEX.js";

export class Calculator {
	@DBC.log
	public divide(@REGEX.PRE("r") a: number, b: number): number {
		return a / b;
	}
}

alert(new Calculator().divide(2, 1));
