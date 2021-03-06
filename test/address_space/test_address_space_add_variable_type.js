"use strict";
/* global describe,it,before*/
require("requirish")._(module);
var should = require("should");

var _ = require("underscore");
var assert = require("better-assert");
var path = require("path");

var StatusCodes = require("lib/datamodel/opcua_status_code").StatusCodes;
import UAObjectType from "lib/address_space/UAObjectType";
import NodeClass from "lib/datamodel/NodeClass"
var DataType = require("lib/datamodel/variant").DataType;
var AttributeIds = require("lib/services/read_service").AttributeIds;
import AddressSpace from "lib/address_space/AddressSpace";
import generateAddressSpace from "lib/address_space/generateAddressSpace";
import NodeId from "lib/datamodel/NodeId";

var browse_service = require("lib/services/browse_service");
var BrowseDirection = browse_service.BrowseDirection;

describe("testing add new ObjectType ", function () {

    var addressSpace;
    require("test/helpers/resource_leak_detector").installResourceLeakDetector(true,function() {

        before(function (done) {
            addressSpace = new AddressSpace();

            var xml_file = path.join(__dirname, "../../lib/server/mini.Node.Set2.xml");
            require("fs").existsSync(xml_file).should.be.eql(true);

            generateAddressSpace(addressSpace, xml_file, function (err) {
                done(err);
            });
        });
        after(function () {
            addressSpace.dispose();
            addressSpace = null;
        });
    });
    it("should add a new ObjectType (=> BaseObjectType)",function() {

        var myObjectType = addressSpace.addObjectType({ browseName: "MyObjectType"});
        myObjectType.browseName.toString().should.eql("MyObjectType");
        myObjectType.subtypeOfObj.browseName.toString().should.eql("BaseObjectType");
        myObjectType.nodeClass.should.eql(NodeClass.ObjectType);
    });
    it("should add a new VariableType (=> BaseVariableType)",function() {

        var myVariableType = addressSpace.addVariableType({ browseName: "MyVariableType"});
        myVariableType.browseName.toString().should.eql("MyVariableType");
        myVariableType.subtypeOfObj.browseName.toString().should.eql("BaseVariableType");
        myVariableType.nodeClass.should.eql(NodeClass.VariableType);

    });
    it("should add a new VariableType (=> BaseDataVariableType)",function() {

        var myVariableType = addressSpace.addVariableType({
            browseName: "MyVariableType2",
            subtypeOf: "BaseDataVariableType"
        });
        myVariableType.browseName.toString().should.eql("MyVariableType2");
        myVariableType.subtypeOfObj.browseName.toString().should.eql("BaseDataVariableType");
        myVariableType.nodeClass.should.eql(NodeClass.VariableType);

    });

});
