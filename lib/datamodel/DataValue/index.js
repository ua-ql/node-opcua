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
import { Variant } from "lib/datamodel/variant";

registerSpecialVariantEncoder(DataValue);

DataValue.prototype.toString = function () {
    
    let str = "DataValue:";
    if (this.value) {
        str += `\n   value:           ${Variant.prototype.toString.apply(this.value)}`;// this.value.toString();
    } else {
        str += "\n   value:            <null>";
    }
    str += `\n   statusCode:      ${this.statusCode ? this.statusCode.toString() : "null"}`;
    str += `\n   serverTimestamp: ${this.serverTimestamp ? `${this.serverTimestamp.toISOString()} $ ${this.serverPicoseconds}` : "null"}`;// + "  " + (this.serverTimestamp ? this.serverTimestamp.getTime() :"-");
    str += `\n   sourceTimestamp: ${this.sourceTimestamp ? `${this.sourceTimestamp.toISOString()} $ ${this.sourcePicoseconds}` : "null"}`;// + "  " + (this.sourceTimestamp ? this.sourceTimestamp.getTime() :"-");
    return str;
};

DataValue.prototype.clone = function () {
    const self = this;
    const tmp = new DataValue({
        serverTimestamp: self.serverTimestamp,
        sourceTimestamp: self.sourceTimestamp,
        serverPicoseconds: self.serverPicoseconds,
        sourcePicoseconds: self.sourcePicoseconds,
        statusCode: self.statusCode,
        value: {
            dataType: self.value.dataType,
            arrayType: self.value.arrayType,
            value: self.value.value
        }
    });

    return tmp;
};



export default DataValue;