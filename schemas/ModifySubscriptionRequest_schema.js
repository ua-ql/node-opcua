const ModifySubscriptionRequest_Schema = {
    name: "ModifySubscriptionRequest",
    fields: [
        { name: "requestHeader", fieldType: "RequestHeader" },
        { name: "subscriptionId", fieldType: "IntegerId" },
        { name: "requestedPublishingInterval", fieldType: "Duration" },
        { name: "requestedLifetimeCount", fieldType: "Counter" },
        { name: "requestedMaxKeepAliveCount", fieldType: "Counter" },
        { name: "maxNotificationsPerPublish", fieldType: "Counter" },
        { name: "priority", fieldType: "Byte" }
    ]
};
export {ModifySubscriptionRequest_Schema};
