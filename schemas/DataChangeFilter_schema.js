require("./DataChangeTrigger_enum");
require("./DeadbandType_enum");

const DataChangeFilter_Schema = {
    name: "DataChangeFilter",
    //  BaseType="MonitoringFilter"
    fields: [
        { name:"trigger"      ,fieldType:"DataChangeTrigger"},
        { name:"deadbandType" ,fieldType:"DeadbandType" },
        { name:"deadbandValue",fieldType:"Double" }
    ]
};
export {DataChangeFilter_Schema};
