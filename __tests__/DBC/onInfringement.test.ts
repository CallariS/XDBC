import "reflect-metadata";
import { DBC } from "../../src/DBC";
import { TYPE } from "../../src/DBC/TYPE";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type InfringementCallback = (
	infringement: InstanceType<typeof DBC.Infringement>,
	context: {
		type: "precondition" | "postcondition" | "invariant";
		value: unknown;
	},
) => void;

function makeDbcWithSpy(throwException = false): {
	dbc: DBC;
	spy: jest.MockedFunction<InfringementCallback>;
} {
	const spy = jest.fn<void, Parameters<InfringementCallback>>();
	const dbc = new DBC({
		throwException,
		logToConsole: false,
		onInfringement: spy,
	});
	return { dbc, spy };
}

// ─── reportParameterInfringement ─────────────────────────────────────────────

describe("onInfringement — reportParameterInfringement", () => {
	test("calls callback with a DBC.Infringement instance", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportParameterInfringement(
			"must be a string",
			{},
			undefined,
			"myMethod",
			0,
			42,
		);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0]).toBeInstanceOf(DBC.Infringement);
	});

	test("context.type is 'precondition'", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportParameterInfringement(
			"must be a string",
			{},
			undefined,
			"myMethod",
			0,
			42,
		);
		expect(spy.mock.calls[0][1].type).toBe("precondition");
	});

	test("context.value reflects the violating argument", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportParameterInfringement(
			"must be a string",
			{},
			undefined,
			"myMethod",
			0,
			42,
		);
		expect(spy.mock.calls[0][1].value).toBe(42);
	});

	test("callback is invoked before the exception is thrown", () => {
		const order: string[] = [];
		const spy = jest.fn(() => order.push("callback"));
		const dbc = new DBC({
			throwException: true,
			logToConsole: false,
			onInfringement: spy,
		});
		try {
			dbc.reportParameterInfringement("msg", {}, undefined, "m", 0, null);
		} catch {
			order.push("throw");
		}
		expect(order).toEqual(["callback", "throw"]);
	});

	test("thrown error is a DBC.Infringement", () => {
		const { dbc } = makeDbcWithSpy(true);
		expect(() =>
			dbc.reportParameterInfringement("msg", {}, undefined, "m", 0, undefined),
		).toThrow(DBC.Infringement);
	});

	test("callback is not called when throwException is true and no infringement", () => {
		const { spy } = makeDbcWithSpy(true);
		// No call made — spy must stay silent
		expect(spy).not.toHaveBeenCalled();
	});
});

// ─── reportFieldInfringement ──────────────────────────────────────────────────

describe("onInfringement — reportFieldInfringement", () => {
	test("calls callback with a DBC.Infringement instance", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportFieldInfringement("must be positive", {}, undefined, "count", -1);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0]).toBeInstanceOf(DBC.Infringement);
	});

	test("context.type is 'invariant'", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportFieldInfringement("must be positive", {}, undefined, "count", -1);
		expect(spy.mock.calls[0][1].type).toBe("invariant");
	});

	test("context.value reflects the violating field value", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportFieldInfringement("must be positive", {}, undefined, "count", -1);
		expect(spy.mock.calls[0][1].value).toBe(-1);
	});
});

// ─── reportReturnvalueInfringement ───────────────────────────────────────────

describe("onInfringement — reportReturnvalueInfringement", () => {
	test("calls callback with a DBC.Infringement instance", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportReturnvalueInfringement(
			"must not be null",
			{},
			undefined,
			"getUser",
			null,
		);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0]).toBeInstanceOf(DBC.Infringement);
	});

	test("context.type is 'postcondition'", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportReturnvalueInfringement(
			"must not be null",
			{},
			undefined,
			"getUser",
			null,
		);
		expect(spy.mock.calls[0][1].type).toBe("postcondition");
	});

	test("context.value reflects the violating return value", () => {
		const { dbc, spy } = makeDbcWithSpy();
		dbc.reportReturnvalueInfringement(
			"must not be null",
			{},
			undefined,
			"getUser",
			null,
		);
		expect(spy.mock.calls[0][1].value).toBeNull();
	});
});

// ─── reportTsCheckInfringement ───────────────────────────────────────────────

describe("onInfringement — reportTsCheckInfringement", () => {
	test("calls callback with a DBC.Infringement instance and precondition context", () => {
		const spy = jest.fn<void, Parameters<InfringementCallback>>();
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = false;
			dbc.infringementSettings.onInfringement = spy;
			DBC.reportTsCheckInfringement("value must be > 0", undefined, -5);
		});
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0]).toBeInstanceOf(DBC.Infringement);
		expect(spy.mock.calls[0][1].type).toBe("precondition");
	});

	test("context.value is the value passed to reportTsCheckInfringement", () => {
		const spy = jest.fn<void, Parameters<InfringementCallback>>();
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = false;
			dbc.infringementSettings.onInfringement = spy;
			DBC.reportTsCheckInfringement("msg", undefined, "badValue");
		});
		expect(spy.mock.calls[0][1].value).toBe("badValue");
	});

	test("throws DBC.Infringement even when no instance is registered", () => {
		expect(() =>
			DBC.reportTsCheckInfringement("msg", "XDBC.NonExistent.Path"),
		).toThrow(DBC.Infringement);
	});

	test("callback is called before exception is thrown", () => {
		const order: string[] = [];
		const spy = jest.fn(() => order.push("callback"));
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = true;
			dbc.infringementSettings.onInfringement = spy;
			try {
				DBC.reportTsCheckInfringement("msg");
			} catch {
				order.push("throw");
			}
		});
		expect(order).toEqual(["callback", "throw"]);
	});
});

// ─── Decorator integration ────────────────────────────────────────────────────
//
// Each test calls makeTypedSubject() to create a fresh class whose decorator closures
// have an un-cached dbcInstance. That way DBC.isolated()'s registered instance is
// always picked up on the first (and only) call within that block.
//

function makeTypedSubject() {
	class Subject {
		@DBC.ParamvalueProvider
		public typed(@TYPE.PRE("string") value: unknown): unknown {
			return value;
		}
	}
	return new Subject();
}

describe("onInfringement — decorator integration", () => {
	test("onInfringement is called via @TYPE.PRE infringement (precondition)", () => {
		const spy = jest.fn<void, Parameters<InfringementCallback>>();
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = false;
			dbc.infringementSettings.onInfringement = spy;
			makeTypedSubject().typed(99);
		});
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0]).toBeInstanceOf(DBC.Infringement);
		expect(spy.mock.calls[0][1].type).toBe("precondition");
		expect(spy.mock.calls[0][1].value).toBe(99);
	});

	test("onInfringement is not called when contract is satisfied", () => {
		const spy = jest.fn<void, Parameters<InfringementCallback>>();
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = false;
			dbc.infringementSettings.onInfringement = spy;
			makeTypedSubject().typed("valid");
		});
		expect(spy).not.toHaveBeenCalled();
	});

	test("the Infringement message contains the raw message text", () => {
		const spy = jest.fn<void, Parameters<InfringementCallback>>();
		DBC.isolated((dbc) => {
			dbc.infringementSettings.throwException = false;
			dbc.infringementSettings.onInfringement = spy;
			makeTypedSubject().typed(true);
		});
		expect(spy.mock.calls[0][0].message).toContain("XDBC Infringement");
	});
});
