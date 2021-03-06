import {nextAvailableId} from "lib/misc/factoryIdGenerator";

const BrowseResult_Schema = {
    name: "BrowseResult",
    id: nextAvailableId(),
    documentation: "The result of a browse operation.",
    fields: [
        { name: "statusCode", fieldType: "StatusCode", documentation: "A code indicating any error during the operation."},
        { name: "continuationPoint", fieldType: "ContinuationPoint", defaultValue: null, documentation: "A value that indicates the operation is incomplete and can be continued by calling BrowseNext."},
        { name: "references", isArray: true, fieldType: "ReferenceDescription", documentation: "A list of references that meet the criteria specified in the request."}
    ]
};
export {BrowseResult_Schema};


