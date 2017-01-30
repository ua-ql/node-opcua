import NumericRange_Schema from "lib/datamodel/numeric-range/NumericRange_Schema";

const WriteValue_Schema = {
    name: "WriteValue",
    fields: [
        { name: "nodeId" ,       fieldType: "NodeId"},
        { name: "attributeId" ,  fieldType: "IntegerId"}, // see AttributeIds
        { name: "indexRange" ,   fieldType: "NumericRange"},
        { name: "value",         fieldType: "DataValue"}
    ]
};
export {WriteValue_Schema};
