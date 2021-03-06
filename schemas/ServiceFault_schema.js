
const ServiceFault_Schema = {
    documentation: "The response returned by all services when there is a service level error.",
    name: "ServiceFault",
    fields: [
        { name: "responseHeader", fieldType: "ResponseHeader"                  }
    ],
    construct_hook: function (options) {
        let breakpoint;
        return options;
    }

};
export {ServiceFault_Schema};