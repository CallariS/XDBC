import "reflect-metadata";
import { DBC } from "../../src/DBC";
import { AE } from "../../src/DBC/AE";
import { GREATER } from "../../src/DBC/COMPARISON/GREATER";
import { GREATER_OR_EQUAL } from "../../src/DBC/COMPARISON/GREATER_OR_EQUAL";
import { LESS } from "../../src/DBC/COMPARISON/LESS";
import { LESS_OR_EQUAL } from "../../src/DBC/COMPARISON/LESS_OR_EQUAL";
import { EQ } from "../../src/DBC/EQ";
import { DIFFERENT } from "../../src/DBC/EQ/DIFFERENT";
import { INSTANCE } from "../../src/DBC/INSTANCE";
import { OR } from "../../src/DBC/OR";
import { REGEX } from "../../src/DBC/REGEX";
import { TYPE } from "../../src/DBC/TYPE";

// Ensure a DBC instance is registered (DBC.ts module-level code does this via DBC.register)
const dbc: DBC = (window as any).WaXCode?.DBC;

describe("Decorator: @PRE (Preconditions)", () => {
	class PreTestSubject {
		@DBC.ParamvalueProvider
		public regexPre(@REGEX.PRE(/^[A-Z]+$/) input: string): string {
			return input;
		}

		@DBC.ParamvalueProvider
		public typePre(@TYPE.PRE("string") input: unknown): unknown {
			return input;
		}

		@DBC.ParamvalueProvider
		public eqPre(@EQ.PRE("hello") input: string): string {
			return input;
		}

		@DBC.ParamvalueProvider
		public greaterPre(@GREATER.PRE(5) input: number): number {
			return input;
		}

		@DBC.ParamvalueProvider
		public greaterOrEqualPre(@GREATER_OR_EQUAL.PRE(5) input: number): number {
			return input;
		}

		@DBC.ParamvalueProvider
		public lessPre(@LESS.PRE(10) input: number): number {
			return input;
		}

		@DBC.ParamvalueProvider
		public lessOrEqualPre(@LESS_OR_EQUAL.PRE(10) input: number): number {
			return input;
		}

		@DBC.ParamvalueProvider
		public differentPre(
			@DIFFERENT.PRE("forbidden", undefined) input: string,
		): string {
			return input;
		}

		@DBC.ParamvalueProvider
		public instancePre(@INSTANCE.PRE(Date) input: unknown): unknown {
			return input;
		}

		@DBC.ParamvalueProvider
		public aePre(@AE.PRE([new TYPE("string")]) input: unknown[]): unknown[] {
			return input;
		}

		@DBC.ParamvalueProvider
		public orPre(@OR.PRE([new EQ("a"), new EQ("b")]) input: string): string {
			return input;
		}
	}

	const subject = new PreTestSubject();

	// REGEX.PRE
	test("REGEX.PRE passes with matching value", () => {
		expect(() => subject.regexPre("ABC")).not.toThrow();
	});
	test("REGEX.PRE throws on non-matching value", () => {
		expect(() => subject.regexPre("abc123")).toThrow();
	});

	// TYPE.PRE
	test("TYPE.PRE passes with correct type", () => {
		expect(() => subject.typePre("hello")).not.toThrow();
	});
	test("TYPE.PRE throws with wrong type", () => {
		expect(() => subject.typePre(42)).toThrow();
	});

	// EQ.PRE
	test("EQ.PRE passes with equal value", () => {
		expect(() => subject.eqPre("hello")).not.toThrow();
	});
	test("EQ.PRE throws with non-equal value", () => {
		expect(() => subject.eqPre("world")).toThrow();
	});

	// GREATER.PRE
	test("GREATER.PRE passes with value > reference", () => {
		expect(() => subject.greaterPre(10)).not.toThrow();
	});
	test("GREATER.PRE throws with value <= reference", () => {
		expect(() => subject.greaterPre(5)).toThrow();
	});
	test("GREATER.PRE throws with value < reference", () => {
		expect(() => subject.greaterPre(3)).toThrow();
	});

	// GREATER_OR_EQUAL.PRE
	test("GREATER_OR_EQUAL.PRE passes with value >= reference", () => {
		expect(() => subject.greaterOrEqualPre(5)).not.toThrow();
	});
	test("GREATER_OR_EQUAL.PRE passes with value > reference", () => {
		expect(() => subject.greaterOrEqualPre(10)).not.toThrow();
	});
	test("GREATER_OR_EQUAL.PRE throws with value < reference", () => {
		expect(() => subject.greaterOrEqualPre(3)).toThrow();
	});

	// LESS.PRE
	test("LESS.PRE passes with value < reference", () => {
		expect(() => subject.lessPre(5)).not.toThrow();
	});
	test("LESS.PRE throws with value >= reference", () => {
		expect(() => subject.lessPre(10)).toThrow();
	});

	// LESS_OR_EQUAL.PRE
	test("LESS_OR_EQUAL.PRE passes with value <= reference", () => {
		expect(() => subject.lessOrEqualPre(10)).not.toThrow();
	});
	test("LESS_OR_EQUAL.PRE throws with value > reference", () => {
		expect(() => subject.lessOrEqualPre(15)).toThrow();
	});

	// DIFFERENT.PRE
	test("DIFFERENT.PRE passes with different value", () => {
		expect(() => subject.differentPre("allowed")).not.toThrow();
	});
	test("DIFFERENT.PRE throws with equal value", () => {
		expect(() => subject.differentPre("forbidden")).toThrow();
	});

	// INSTANCE.PRE
	test("INSTANCE.PRE passes with correct instance", () => {
		expect(() => subject.instancePre(new Date())).not.toThrow();
	});
	test("INSTANCE.PRE throws with wrong instance", () => {
		expect(() => subject.instancePre("not a date")).toThrow();
	});

	// AE.PRE
	test("AE.PRE passes with all elements matching", () => {
		expect(() => subject.aePre(["a", "b", "c"])).not.toThrow();
	});
	test("AE.PRE throws when an element does not match", () => {
		expect(() => subject.aePre(["a", 42, "c"])).toThrow();
	});

	// OR.PRE
	test("OR.PRE passes when one contract is satisfied", () => {
		expect(() => subject.orPre("a")).not.toThrow();
	});
	test("OR.PRE throws when no contract is satisfied", () => {
		expect(() => subject.orPre("c")).toThrow();
	});
});

describe("Decorator: @POST (Postconditions)", () => {
	class PostTestSubject {
		@REGEX.POST(/^OK:.*$/)
		@DBC.ParamvalueProvider
		public formatResponse(@TYPE.PRE("string") input: string): string {
			return `OK:${input}`;
		}

		@REGEX.POST(/^OK:.*$/)
		public failingPost(): string {
			return "FAIL";
		}

		@EQ.POST("hello")
		public eqPost(returnThis: string): string {
			return returnThis;
		}
	}

	const subject = new PostTestSubject();

	test("POST passes when return value matches", () => {
		expect(() => subject.formatResponse("test")).not.toThrow();
	});

	test("POST throws when return value does not match", () => {
		expect(() => subject.failingPost()).toThrow();
	});

	test("EQ.POST passes with matching return value", () => {
		expect(() => subject.eqPost("hello")).not.toThrow();
	});

	test("EQ.POST throws with non-matching return value", () => {
		expect(() => subject.eqPost("world")).toThrow();
	});
});

describe("Decorator: @INVARIANT (Field contracts)", () => {
	test("INVARIANT allows valid initial value", () => {
		expect(() => {
			class InvariantSubject {
				@REGEX.INVARIANT(/^[A-Z]+$/)
				public code = "ABC";
			}
			new InvariantSubject();
		}).not.toThrow();
	});

	test("INVARIANT throws on invalid initial value", () => {
		expect(() => {
			class InvariantSubject {
				@REGEX.INVARIANT(/^[A-Z]+$/)
				public code = "abc123";
			}
			new InvariantSubject();
		}).toThrow();
	});

	test("INVARIANT throws on invalid reassignment", () => {
		class InvariantSubject {
			@REGEX.INVARIANT(/^[A-Z]+$/)
			public code = "ABC";
		}
		const obj = new InvariantSubject();
		expect(() => {
			obj.code = "invalid!";
		}).toThrow();
	});

	test("INVARIANT allows valid reassignment", () => {
		class InvariantSubject {
			@REGEX.INVARIANT(/^[A-Z]+$/)
			public code = "ABC";
		}
		const obj = new InvariantSubject();
		expect(() => {
			obj.code = "XYZ";
		}).not.toThrow();
	});
});

describe("Decorator: @ParamvalueProvider", () => {
	test("ParamvalueProvider passes multiple parameter contracts", () => {
		class MultiParam {
			@DBC.ParamvalueProvider
			public method(
				@TYPE.PRE("string") a: string,
				@TYPE.PRE("number") b: number,
			): string {
				return `${a}:${b}`;
			}
		}
		const obj = new MultiParam();
		expect(() => obj.method("hello", 42)).not.toThrow();
	});

	test("ParamvalueProvider catches second parameter violation", () => {
		class MultiParam {
			@DBC.ParamvalueProvider
			public method(
				@TYPE.PRE("string") a: string,
				@TYPE.PRE("number") b: number,
			): string {
				return `${a}:${b}`;
			}
		}
		const obj = new MultiParam();
		expect(() => obj.method("hello", "not a number" as any)).toThrow();
	});
});

describe("DBC infringement settings", () => {
	class InfringementTest {
		@DBC.ParamvalueProvider
		public method(@TYPE.PRE("string") input: unknown): unknown {
			return input;
		}
	}

	test("Violations throw DBC.Infringement by default", () => {
		const obj = new InfringementTest();
		expect(() => obj.method(42)).toThrow(/XDBC Infringement/);
	});

	test("Error message includes class name, method name, and parameter info", () => {
		const obj = new InfringementTest();
		try {
			obj.method(42);
			fail("Should have thrown");
		} catch (e: any) {
			expect(e.message).toContain("InfringementTest");
			expect(e.message).toContain("method");
			expect(e.message).toContain("1st parameter");
		}
	});
});

describe("DBC.register()", () => {
	test("registers an instance at the default path", () => {
		const custom = new DBC();
		DBC.register(custom);
		expect((window as any).WaXCode.DBC).toBe(custom);
		// Restore original
		DBC.register(dbc);
	});

	test("registers an instance at a custom path", () => {
		const custom = new DBC();
		DBC.register(custom, "TestVendor.DBC");
		expect((window as any).TestVendor.DBC).toBe(custom);
	});

	test("constructor does not auto-mount to globalThis", () => {
		const original = (window as any).WaXCode.DBC;
		const orphan = new DBC();
		// Constructor should NOT have replaced the registered instance
		expect((window as any).WaXCode.DBC).toBe(original);
		expect(orphan).not.toBe(original);
	});
});

describe("DBC.isolated()", () => {
	test("provides a temporary DBC instance and restores the original", () => {
		const original = (window as any).WaXCode.DBC;
		let isolatedInstance: DBC | undefined;
		DBC.isolated((tempDbc) => {
			isolatedInstance = tempDbc;
			expect(tempDbc).not.toBe(original);
			expect((window as any).WaXCode.DBC).toBe(tempDbc);
		});
		// After isolated() returns, the original is restored
		expect((window as any).WaXCode.DBC).toBe(original);
		expect(isolatedInstance).toBeDefined();
	});

	test("restores original even if callback throws", () => {
		const original = (window as any).WaXCode.DBC;
		expect(() => {
			DBC.isolated(() => {
				throw new Error("test error");
			});
		}).toThrow("test error");
		expect((window as any).WaXCode.DBC).toBe(original);
	});

	test("isolated instance has independent settings", () => {
		DBC.isolated((tempDbc) => {
			tempDbc.executionSettings.checkPreconditions = false;
			expect(dbc.executionSettings.checkPreconditions).toBe(true);
		});
	});
});
