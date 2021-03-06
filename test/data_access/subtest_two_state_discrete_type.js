require("requirish")._(module);
var _ = require("underscore");
var should = require("should");
import ServerEngine from "lib/server/ServerEngine";

import DataValue from "lib/datamodel/DataValue";
var Variant = require("lib/datamodel/variant").Variant;
var DataType = require("lib/datamodel/variant").DataType;
import NodeId from "lib/datamodel/NodeId";
var StatusCodes = require("lib/datamodel/opcua_status_code").StatusCodes;
var read_service = require("lib/services/read_service");
var AttributeIds = read_service.AttributeIds;

var EUInformation = require("lib/data_access/EUInformation").EUInformation;
var Range = require("lib/data_access/Range").Range;

var async = require("async");

var path = require("path");



module.exports = function(engine) {

    describe("TwoStateDiscreteType", function () {

        it("should add a TwoStateDiscreteType variable",function() {

            var addressSpace = engine.addressSpace;
            var objectsFolder = addressSpace.findNode("ObjectsFolder");
            objectsFolder.browseName.toString().should.eql("Objects");

            var prop = addressSpace.addTwoStateDiscrete({
                organizedBy: objectsFolder,
                browseName: "MySwitch",
                trueState: "busy",
                falseState: "idle",
                value: false
            });
            prop.browseName.toString().should.eql("MySwitch");

            prop.getPropertyByName("TrueState").readValue().value.toString()
                .should.eql("Variant(Scalar<LocalizedText>, value: locale=null text=busy)");

            prop.getPropertyByName("FalseState").readValue().value.toString()
                .should.eql("Variant(Scalar<LocalizedText>, value: locale=null text=idle)");

            prop.readValue().value.toString().should.eql("Variant(Scalar<Boolean>, value: false)");
        });

    });

};
