import factories from "lib/misc/factories";
import fs from "fs";
import path from "path";
import _ from "underscore";
import assert from "better-assert";
import {_defaultTypeMap}  from  "lib/misc/factories_builtin_types";
import __ from "lib/datamodel/numeric-range/NumericRange_Schema";

function getFiles(dir, files_) {
    files_ = files_ || [];
    if (typeof files_ === 'undefined') { files_ = []; }
    const files = fs.readdirSync(dir);
    for (let i in files) {
        if (!files.hasOwnProperty(i)) { continue; }
        const name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            //xx getFiles(name,files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

require("lib/datamodel/variant");
//require("lib/datamodel/buildinfo");
require("lib/services/browse_service");
require("lib/services/historizing_service");
require("lib/datamodel/opcua_status_code");
require("schemas/39394884f696ff0bf66bacc9a8032cc074e0158e/ServerState_enum");
require("schemas/39394884f696ff0bf66bacc9a8032cc074e0158e/ServerStatus");
require("lib/services/write_service");

require("lib/services/get_endpoints_service");
const _enumerations = require("lib/misc/factories_enumerations")._private._enumerations;
assert(_enumerations.MessageSecurityMode);

const encode_decode_round_trip_test = require("test/helpers/encode_decode_round_trip_test").encode_decode_round_trip_test;

const folderForGeneratedFile = require("lib/misc/factory_code_generator").folderForGeneratedFile;

const services_folder = path.join(__dirname, "../lib/services");

if (fs.existsSync("../_generated_/_auto_generated_SCHEMA_ServerState")) {
    require("../_generated_/_auto_generated_SCHEMA_ServerState");
}

describe("testing all auto_generated Class", function () {

    const services_javascript_source = getFiles(services_folder);
    services_javascript_source.forEach(function (filename) {
        require(filename);
    });

    let files = getFiles(folderForGeneratedFile);
    files = files.filter(function (f) {
        return (f.indexOf("_auto_generated_") > 0 && f.indexOf("SCHEMA") === -1);
    });

    // remove Callxxxx class that requires a special treatment
    files = files.filter(function (f) {
        return !(f.indexOf("_Call") > 0);
    });


    files.forEach(function (filename) {

        const re = /.*_auto_generated_(.*)\.js/;

        const name = re.exec(filename)[1];
        //xx console.log(name);

        if (name === "Variant") {
            // ignore Variant as Variant use specifics consistency rules in constructor
            // that cannot be easily randomly checked here -  Variant are fully tested in dedicated test anyway.
            return;
        }
        it("verify auto generated class encoding and decoding " + name, function () {

            const CLASSCONSTRUCTOR = require(filename)[name];

            const schema = CLASSCONSTRUCTOR.prototype._schema;
            const options = {};

            schema.fields.forEach(function (field) {
                if (field.isArray) {
                    if (_defaultTypeMap[field.fieldType]) {
                        const defVal = _defaultTypeMap[field.fieldType].defaultValue;

                        if (defVal !== undefined) {
                            if (_.isFunction(defVal)) {
                                options[field.name] = [defVal(), defVal(), defVal()];

                            } else {
                                //xx console.log(field.name);
                                options[field.name] = [defVal, defVal, defVal];
                            }
                        }
                    } else {

                        options[field.name] = [{}, {}, {}];
                    }
                }
            });


            const obj = new CLASSCONSTRUCTOR(options);
            encode_decode_round_trip_test(obj);
            obj.explore();

            const txt = obj.toString();


        });

    });

});
