/* jslint bitwise: true */
/**
 * @module opcua.address_space
 */
require("requirish")._(module);

import util from "util";
import { isNullOrUndefined } from "lib/misc/utils";
import { EventEmitter } from "events";
import NodeId, { 
  makeNodeId,
  resolveNodeId,
  sameNodeId
} from "lib/datamodel/NodeId";
import QualifiedName, { 
  coerceQualifyName 
} from "lib/datamodel/QualifiedName";
import { coerceLocalizedText } from "lib/datamodel/LocalizedText";
import DataValue from "lib/datamodel/DataValue";
import { DataType } from "lib/datamodel/variant";
import { StatusCodes } from "lib/datamodel/opcua_status_code";
import AttributeIds from "lib/datamodel/attribute-ids/AttributeIds";
import AttributeNameById from "lib/datamodel/attribute-ids/AttributeNameById";
import { ResultMask } from "schemas/ResultMask_enum";
import { NodeClass } from "schemas/NodeClass_enum";
import { 
  BrowseDirection,
  ReferenceDescription,
  makeNodeClassMask
} from "lib/services/browse_service";

import assert from "better-assert";
import _ from "underscore";
import { dumpIf } from "lib/misc/utils";
const ReferenceType = null;
// will be defined after baseNode is defined

import { lowerFirstLetter } from "lib/misc/utils";
import { capitalizeFirstLetter } from "lib/misc/utils";

const doDebug = false;

import Reference from "lib/address_space/Reference";
import {
  _handle_add_reference_change_event  
} from "../address_space_change_event_tools";

import { check_flag } from "lib/misc/utils";

import nodeIdInfo from "./nodeIdInfo";

/**
 * @method dumpReferences
 * @param addressSpace    {AddressSpace}
 * @param references  {Array<Reference>||null}
 * @static
 */
function dumpReferences(addressSpace, references) {
    assert(addressSpace);

    _.forEach(references,(reference) => {
        const referenceType = Reference._resolveReferenceType(addressSpace,reference);
        if (!referenceType) {
            // unknown type ... this may happen when the address space is not fully build
            return;
        }
        const dir = reference.isForward ? "(=>)" : "(<-)";
        const objectName = nodeIdInfo(addressSpace, reference.nodeId);

        console.log(" referenceType : ", dir, referenceType ? referenceType.browseName.toString() : reference.referenceType.toString(), " ", objectName);
    });
}

export default dumpReferences;
