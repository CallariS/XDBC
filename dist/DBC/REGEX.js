import { DBC } from "../DBC.js";
export class REGEX extends DBC {
    static PRE(a) {
        return DBC.decPrecondition({
            arguments: [a],
            check: () => { },
        });
    }
}
