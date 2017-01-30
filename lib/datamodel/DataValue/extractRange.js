import assert from "better-assert";
import _ from "underscore";
import { registerSpecialVariantEncoder } from "lib/datamodel/variant";
import { DataType } from "lib/datamodel/variant";
import { VariantArrayType } from "lib/datamodel/variant";
import { TimestampsToReturn } from "schemas/TimestampsToReturn_enum";
import AttributeIds from "lib/datamodel/attribute-ids/AttributeIds";
import NumericRange from "lib/datamodel/numeric-range/NumericRange";
import { sameVariant } from "lib/datamodel/variant_tools";
import { DataValue } from "_generated_/_auto_generated_DataValue";



/*
 * @method _clone_with_array_replacement
 * @param dataValue
 * @param result
 * @return {DataValue}
 * @private
 * @static
 */
function _clone_with_array_replacement(dataValue, result) {
    return new DataValue({
        statusCode: result.statusCode,
        serverTimestamp: dataValue.serverTimestamp,
        serverPicoseconds: dataValue.serverPicoseconds,
        sourceTimestamp: dataValue.sourceTimestamp,
        sourcePicoseconds: dataValue.sourcePicoseconds,
        value: {
            dataType: dataValue.value.dataType,
            arrayType: dataValue.value.arrayType,
            value: result.array
        }
    });
}
function canRange(dataValue) {
    return dataValue.value && ((dataValue.value.arrayType !== VariantArrayType.Scalar) ||
        ((dataValue.value.arrayType === VariantArrayType.Scalar) && (dataValue.value.dataType === DataType.ByteString)) ||
        ((dataValue.value.arrayType === VariantArrayType.Scalar) && (dataValue.value.dataType === DataType.String)));
}


function extractRange(dataValue, indexRange) {
    // xx console.log("xxxxxxx indexRange =".yellow,indexRange ? indexRange.toString():"<null>") ;
    // xx console.log("         dataValue =",dataValue.toString());
    // xx console.log("         can Range =", canRange(dataValue));
    const variant = dataValue.value;
    if (indexRange && canRange(dataValue)) {
        const result = indexRange.extract_values(variant.value);
        return _clone_with_array_replacement(dataValue, result);
        // xx console.log("         dataValue =",dataValue.toString());
    } 
    // clone the whole data Value
    return new DataValue(dataValue);
}

export default extractRange;
