import { DBC } from "../DBC.js";
export class REGEX extends DBC {
    static PRE(a) {
        return DBC.decPrecondition((value) => {
            console.log("xxxxxxxxxxJJJJ", value);
        });
    }
}
