
const GetEndpointsResponse_Schema = {
    name: "GetEndpointsResponse",
    fields: [
        { name: "responseHeader", fieldType: "ResponseHeader"       },
        { name: "endpoints", isArray: true, fieldType: "EndpointDescription"  }
    ]
};

export {GetEndpointsResponse_Schema};