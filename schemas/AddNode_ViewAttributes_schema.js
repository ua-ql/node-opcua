const AddNodes_DataTypeAttributes_Schema = {
    name: "DataTypeAttributes",
    fields: [
        {
            name: "specifiedAttributes",
            fieldType: "UInt32",
            documentation: "A bit mask that indicates which fields contain valid values.A field shall be ignored if the corresponding bit is set to 0."
        },
        {name: "displayName",   fieldType: "LocalizedText"},
        {name: "description",   fieldType: "LocalizedText"},
        {name: "containsNoLoop",fieldType: "Boolean"},
        {name: "eventNotifier", fieldType: "Byte"},
        {name: "writeMask",     fieldType: "UInt32"},
        {name: "userWriteMask", fieldType: "UInt32"}
    ]
};
export {AddNodes_DataTypeAttributes_Schema};
