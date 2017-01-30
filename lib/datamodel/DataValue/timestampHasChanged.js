import assert from "better-assert";
import _ from "underscore";
import { registerSpecialVariantEncoder } from "lib/datamodel/variant";
import { DataValue } from "_generated_/_auto_generated_DataValue";
import { DataType } from "lib/datamodel/variant";
import { VariantArrayType } from "lib/datamodel/variant";
import { TimestampsToReturn } from "schemas/TimestampsToReturn_enum";
import AttributeIds from "lib/datamodel/attribute-ids/AttributeIds";
import NumericRange from "lib/datamodel/numeric-range/NumericRange";
import { sameVariant } from "lib/datamodel/variant_tools";
import sameDate from './sameDate';
import sourceTimestampHasChanged from "./sourceTimestampHasChanged";
import serverTimestampHasChanged from "./serverTimestampHasChanged";

function timestampHasChanged(dataValue1, dataValue2,timestampsToReturn) {
// TODO:    timestampsToReturn = timestampsToReturn || { key: "Neither"};
    if (!timestampsToReturn) {
        return sourceTimestampHasChanged(dataValue1,dataValue2) || serverTimestampHasChanged(dataValue1,dataValue2);
    }
    switch (timestampsToReturn.key) {
    case "Neither":
        return false;
    case "Both":
        return sourceTimestampHasChanged(dataValue1,dataValue2) || serverTimestampHasChanged(dataValue1,dataValue2);
    case "Source":
        return sourceTimestampHasChanged(dataValue1,dataValue2);
    default:
        assert(timestampsToReturn.key === "Server");
        return serverTimestampHasChanged(dataValue1,dataValue2);
    }
//    return sourceTimestampHasChanged(dataValue1,dataValue2) || serverTimestampHasChanged(dataValue1,dataValue2);
}

export default timestampHasChanged;

