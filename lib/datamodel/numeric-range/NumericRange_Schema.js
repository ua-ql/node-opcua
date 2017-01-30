/**
 * @module opcua.datamodel
 */
import Enum from "lib/misc/enum";

import { registerBasicType } from "lib/misc/factories";
import { StatusCodes } from "lib/datamodel/opcua_status_code";
import * as ec from "lib/misc/encode_decode";
import _ from "underscore";
import assert from "better-assert";
import NumericRange from "./NumericRange"





// BNF of NumericRange
// The following BNF describes the syntax of the NumericRange parameter type.
// <numeric-range>    ::= <dimension> [',' <dimension>]
//     <dimension>    ::= <index> [':' <index>]
//         <index>    ::= <digit> [<digit>]
//         <digit>    ::= '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' |9'
//
const NumericRange_Schema = {
    name: "NumericRange",
    subtype: "UAString",
    defaultValue() {
        return new NumericRange();
    },
    encode(value, stream) {
        assert(value === null || value instanceof NumericRange);
        value = (value === null) ? null : value.toEncodeableString();
        ec.encodeString(value, stream);
    },
    decode(stream) {
        const str = ec.decodeString(stream);
        return new NumericRange(str);
    },
    coerce(value) {
        return NumericRange.coerce(value)
    },
    random() {
        function r() {
            return Math.ceil(Math.random() * 100);
        }

        const start = r();
        const end = start + r();
        return new NumericRange(start, end);
    }
};
registerBasicType(NumericRange_Schema);
export default NumericRange_Schema ;

