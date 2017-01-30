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


function apply_timestamps(dataValue, timestampsToReturn, attributeId) {
    assert(attributeId > 0);
    assert(timestampsToReturn.hasOwnProperty("key"));
    assert(dataValue instanceof DataValue);
    assert(dataValue.hasOwnProperty("serverTimestamp"));
    assert(dataValue.hasOwnProperty("sourceTimestamp"));

    const cloneDataValue = new DataValue({});
    cloneDataValue.value = dataValue.value;
    cloneDataValue.statusCode = dataValue.statusCode;

    // apply timestamps
    switch (timestampsToReturn) {
        case TimestampsToReturn.Server:
            cloneDataValue.serverTimestamp = dataValue.serverTimestamp;
            cloneDataValue.serverPicoseconds = dataValue.serverPicoseconds;
            if (!cloneDataValue.serverTimestamp) {
                cloneDataValue.serverTimestamp = new Date();
            }
            break;
        case TimestampsToReturn.Source:
            cloneDataValue.sourceTimestamp = dataValue.sourceTimestamp;
            cloneDataValue.sourcePicoseconds = dataValue.sourcePicoseconds;
            break;
        case TimestampsToReturn.Both:
            cloneDataValue.serverTimestamp = dataValue.serverTimestamp;
            cloneDataValue.serverPicoseconds = dataValue.serverPicoseconds;
            if (!cloneDataValue.serverTimestamp) {
                cloneDataValue.serverTimestamp = new Date();
            }

            cloneDataValue.sourceTimestamp = dataValue.sourceTimestamp;
            cloneDataValue.sourcePicoseconds = dataValue.sourcePicoseconds;
            break;
    }

    // unset sourceTimestamp unless AttributeId is Value
    if (attributeId !== AttributeIds.Value) {
        cloneDataValue.sourceTimestamp = null;
    }
    return cloneDataValue;
}



export default apply_timestamps;
