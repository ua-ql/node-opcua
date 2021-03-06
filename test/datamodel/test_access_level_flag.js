import { registerEnumeration, registerObject } from "lib/misc/factories";

import accessLevelFlag from "lib/datamodel/access-level/accessLevelFlag";
import makeAccessLevel from "lib/datamodel/access-level/makeAccessLevel";
var should = require("should");
var findBuiltInType = require("lib/misc/factories_builtin_types").findBuiltInType;
var assert = require("assert");

var _ = require("underscore");

import createObject from "lib/misc/create-factory";

createObject("test/fixtures/schemas|ObjWithAccessLevel", "tmp");


var ObjWithAccessLevel = registerObject("test/fixtures/schemas|ObjWithAccessLevel", "tmp");

assert(_.isFunction(ObjWithAccessLevel));

describe("Testing AccessLevelFlag", function () {

    it("should create a access level flags from a string", function () {

        makeAccessLevel("CurrentRead").value.should.equal(0x01);
        makeAccessLevel("CurrentWrite").value.should.equal(0x02);
        makeAccessLevel("CurrentRead | CurrentWrite").value.should.equal(0x03);
        makeAccessLevel("CurrentWrite | CurrentRead").value.should.equal(0x03);


        accessLevelFlag.get(0x1).key.should.eql("CurrentRead");
        accessLevelFlag.get(0x2).key.should.eql("CurrentWrite");
        accessLevelFlag.get(0x3).key.should.eql("CurrentRead | CurrentWrite");

        makeAccessLevel(makeAccessLevel("CurrentRead")).value.should.equal(0x01);
    });

    it("should create a flag with no bit set", function () {
        var accessLevel = makeAccessLevel("");
        accessLevel.key.should.eql("NONE");
        accessLevel.value.should.equal(accessLevelFlag.NONE.value);
        accessLevel.has("CurrentRead").should.eql(false);
        accessLevel.has("CurrentWrite").should.eql(false);

    });
    it("should create a flag with no bit set -> 0", function () {
        var accessLevel = makeAccessLevel(0);
        accessLevel.key.should.eql("NONE");
        accessLevel.value.should.equal(accessLevelFlag.NONE.value);
        accessLevel.has("CurrentRead").should.eql(false);
        accessLevel.has("CurrentWrite").should.eql(false);

    });
    it("should have a accessLevel Flag Basic Type", function () {
        _.isObject(findBuiltInType("AccessLevelFlag")).should.equal(true);
    });

    it("should create an object with access_level", function () {
        var o = new ObjWithAccessLevel();
        o.should.have.property("accessLevel");
        o.accessLevel.should.eql(accessLevelFlag.get("CurrentRead | CurrentWrite"));
    });

    it("should create an object with access_level defined as a 'string'", function () {

        var o = new ObjWithAccessLevel({
            accessLevel: "HistoryWrite | SemanticChange"
        });
        o.should.have.property("accessLevel");
        o.accessLevel.should.eql(accessLevelFlag.get("HistoryWrite | SemanticChange"));

    });

    it("should create an object with access_level defined as a Int8'", function () {

        var o = new ObjWithAccessLevel({
            accessLevel: 0x5
        });
        o.should.have.property("accessLevel");
        o.accessLevel.should.eql(accessLevelFlag.get("CurrentRead | HistoryRead"));
    });

    it("should persist a accessLevel Flag", function () {

        var o = new ObjWithAccessLevel({});
        o.accessLevel.should.eql(accessLevelFlag.get("CurrentRead | CurrentWrite"));

        var encode_decode_round_trip_test = require("test/helpers/encode_decode_round_trip_test").encode_decode_round_trip_test;
        encode_decode_round_trip_test(o);


    });

    it("should provide a easy way to check if a flag is set or not", function () {

        var accessLevel = makeAccessLevel("CurrentWrite | CurrentRead");

        accessLevel.has("CurrentWrite").should.be.eql(true);
        accessLevel.has("CurrentRead").should.be.eql(true);
        accessLevel.has("HistoryRead").should.be.eql(false);

    });
});
