const DeleteReferencesRequest_Schema = {
    name:"DeleteReferencesRequest",
    fields: [
        { name:"requestHeader",  fieldType:"RequestHeader", documentation:"A standard header included in all requests sent to a server." },
        { name: "referencesToDelete",    fieldType: "DeleteReferencesItem", isArray: true, documentation: " "}
    ]
};
export {DeleteReferencesRequest_Schema};



