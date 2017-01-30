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
import sameDate from './sameDate'



function sourceTimestampHasChanged(dataValue1, dataValue2) {
    assert(dataValue1,"expecting valid dataValue1");
    assert(dataValue2,"expecting valid dataValue2");
    const hasChanged =
        !sameDate(dataValue1.sourceTimestamp, dataValue2.sourceTimestamp) ||
        (dataValue1.sourcePicoseconds !== dataValue2.sourcePicoseconds);
    return hasChanged;
}


export default sourceTimestampHasChanged;
