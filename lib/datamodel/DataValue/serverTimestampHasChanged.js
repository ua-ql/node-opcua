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

function serverTimestampHasChanged(dataValue1, dataValue2) {
    assert(dataValue1,"expecting valid dataValue1");
    assert(dataValue2,"expecting valid dataValue2");
    const hasChanged =
        !sameDate(dataValue1.serverTimestamp ,dataValue2.serverTimestamp) ||
        (dataValue1.serverPicoseconds !== dataValue2.serverPicoseconds);
    return hasChanged;
}

export default serverTimestampHasChanged;
