# XDbC / e**X**plicit **D**esign **b**y **C**ontract™

Leverages the explicit nature of metadata to provide a **D**esign **b**y **C**ontract™ Framework in a precise and comprehensible manner.

| Do...             | Instead Of                                                 |
|-------------------|------------------------------------------------------------|
| <pre>@DBC.ParamvalueProvider<br>public method(@AE.PRE([new REGEX(/^\.*XDBC.\*$/i)]) input : Array\<string>) {<br> ... <br>}</pre>|<pre>public method( input : Array\<string>) {<br>  input.forEach(( element, index ) => {<br>   console.assert(/^.\*XDBC.\*$/i.test(element),"inconsistent error message");<br>  });<br><br>  ...<br>}</pre>
| <pre>@REGEX.INVARIANT(/^.\*XDBC.\*$/i)<br>public field = "XDBC";</pre>|<pre>get field() : string { return ... }<br>set field( toSet : string ) {<br> console.assert(/^.\*XDBC.\*$/i.test(element),"Inconsistent error message"); <br><br> ...<br>}</pre>
| <pre>@REGEX.POST(/^XDBC$/i)<br>public method( input : unknown ) : string {<br> ...<br><br> return result ;<br>}</pre>|<pre>public method( input : unknown ) : string {<br> ...<br><br> if(!/^.\*XDBC.\*$/i.test(result) {<br>   throw new Error("inconsistent error message");<br> }<br><br> return result ;<br>}</pre>
<pre>...and get consistent details about errors like: <code style = "background-color : beige ; color : red ;">[ XDBC Infringement [ From "method" in "MyClass": [ Parameter-value "+1d,+5d,-x10y" of the 1st parameter did not fulfill one of it's contracts: Violating-Arrayelement at index 2. Value has to comply to regular expression "/^(?i:(NOW)|([+-]\d+[dmy]))$/i"]]]</code></pre>

## What is **D**esign **b**y **C**ontract™ ?
[**D**esign **b**y **C**ontract™ (DbC)](https://en.wikipedia.org/wiki/Design_by_contract) is a software development approach focused on defining precise and verifiable contracts between software components. These contracts specify the preconditions that must be true when calling a component (e.g., a function or method), the postconditions guaranteed after the component's execution, and the invariants that must hold true throughout the lifetime of an object or class.

## Benefits of Design by Contract:

| Benefit               | Description                                                |
|-----------------------|------------------------------------------------------------|
| More Reliable         | Early error detection through contract checking            |
| More Maintainable     | Clear responsibilities and expected behavior               |
| Better Documentation  | Contracts as living behavior descriptions                  |
| Easier Debugging      | Error causes traceable through contract violations         |


**DbC** improves software quality and maintainability by explicitly defining and verifying contract conditions.

## What is the difference between DbC and Assertions ?

| Feature          | DBC with Decorators                    | Assertions                            |
|------------------|----------------------------------------|---------------------------------------|
| Formality        | Formal, explicit in definition         | Informal, often within the body       |
| Integration      | Metadata                               | Built-in keyword                      |
| Features         | Can be more feature-rich               | Simple, primarily for error detection |
| Readability      | Generally good, contracts are clear    | Can become cluttered                  |
| Maintainability  | Often better, contracts are localized  | Can be harder to track and modify     |
| Production       | Contracts can be kept or disabled      | Often disabled for performance        |

## Demo & API Documentation
Check out the **Demo.ts** to see some examples usages and the [API](https://callaris.github.io/XDBC/)'s documentation.

## Installation

```sh
npm install --save xdbc
```

## Usage

As by now there're nine contracts that can be used:

- AE (*Each element of the value-array has to fulfill a certain set of contracts*)
- EQ (*Value has to be equal to a supplied reference value*)
- GREATER (*Value has to be greater than a supplied reference value*)
- INSTANCE (*Value has to be an instance of a supplied type*)
- JSON.OP (*Value has to contain certain properties of certain type*)
- JSON.Parse (*String-value has to be a parsable JSON*)
- OR (*At least one of a set of contracts has to be fulfilled*)
- REGEX (*Value has to be validated by a supplied regular expression*)
- TYPE (*Value has to be of a certain type*)

All of which expose a method **PRE**, **POST** and **INVARIANT** (*precondition, postcondition and invariant*).<br>
Import the classes to use from **xdbc**. If parameters shall be decorated with contracts import class **DBC** also. <br><br>

The **PRE**-Method can be used to decorate method-parameter: <code>public method(@REGEX.PRE(/XDBC.\*/g) input : string)</code>.<br>Whenever the method is invoked the value will be checked. Since parameter decorators don't have access to the parameter's value, the method itself must additionally be decorated with the **ParamvalueProvider**:<br>
<code>
@DBC.**ParamvalueProvider**<br>
public method(@REGEX.PRE(/XDBC.\*/g) input : string)
</code><br><br>
The **POST**-Method can be used to decorate a method:<br>
<code>
@EQ.POST(10)<br>
public method() { return 10 ;}<br></code>
Whenever the method returns, it's return-value will be checked.<br>

The **INVARIANT**-Method can be used to decorate fields:<br>
<code>
@REGEX.INVARIANT(/^a$/)<br>
public testProperty = "a";
</code><br>
Whenever the field is assigned a value and also when initialized, the new value will be checked. So there's no need to write a getter and setter just because there's is the necessity to perform checks on the value anymore.<br>

Certain contracts take other contracts as a parameter. For example the **AE** contract that applies a specified set of contracts on each element of the tagged object's value if it is an array or the object itself if it isn't: <code>@AE.PRE([new REGEX(/^(?i:(NOW)|([+-]\d+[dmy]))$/i, new GREATER(10,"length")])</code>.

With **PRE**, **POST** and **INVARIANT** decorators an optional **path** parameter may be specified. This parameter is a dotted path to a nested property of the tagged object that shall be checked instead of the tagged one. Thus **@DBC.INVARIANT([new REGEX(/^.$/)])** could also be defined as: **@DBC.INVARIANT([new EQ(1)],"length")**, that way demanding that the value to be set is a string with exactly one character.

Multiple instances of the class **DBC** with varying settings for e.g. reporting infringements may be instantiated. Which of these instances is used to report can be defined when either using **PRE**, **POST** or **INVARIANT** by defining their **dbc** parameter: **@DBC.INVARIANT([new EQ(1)],"length","MyVendor.MyDBCInstance")**, for example. The standard path (*WaXCode.DBC*) leads to an automatically created instance, that is generated when the Framework is imported.

Many contracts got further features like the **AE**-Contract that can check specific ranges within the tagged array or the **EQ**- and **GREATER**-Contract that can be inverted turning them into **not EQual**- or **LESS**-Contracts. Check out the [API](https://callaris.github.io/XDBC/) for details.

A **DBC**'s **warningSettings** & **infringementSettings** determine what happens on warnings and errors, whereas warnings are not implemented yet.

## Contribution
Participation is highly valued and warmly welcomed. The ultimate goal is to create a tool that proves genuinely useful and empowers a wide range of developers to build more robust and reliable applications.



