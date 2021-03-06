/**
 * @module opcua.address_space
 */

import assert from "better-assert";
import util from "util";
import _ from "underscore";
import BaseNode from "lib/address_space/BaseNode";
import NodeId, { 
    coerceNodeId,
    makeNodeId,
    resolveNodeId,
    sameNodeId
} from "lib/datamodel/NodeId";

import { construct_isSupertypeOf } from "../tool_isSupertypeOf";


import NodeClass from "lib/datamodel/NodeClass";
import DataValue from "lib/datamodel/DataValue";
import { Variant } from "lib/datamodel/variant";
import { DataType } from "lib/datamodel/variant";
import { VariantArrayType } from "lib/datamodel/variant";
import { StatusCodes } from "lib/datamodel/opcua_status_code";
import { AttributeIds } from "lib/services/read_service";


import { 
  make_debugLog, 
  checkDebugFlag,
  isNullOrUndefined
} from "lib/misc/utils";
import { BrowseDirection } from "lib/services/browse_service";

import Reference from "lib/address_space/Reference";
import makeOptionalsMap from "lib/address_space/makeOptionalsMap";


const debugLog = make_debugLog(__filename);
const doDebug = checkDebugFlag(__filename);


function prepareDataType(dataType) {
    return coerceNodeId(dataType);
}


/**
 * return true if node is a mandatory child or a requested optional
 * @param instance
 * @param optionals
 * @param node
 * @return {Boolean}
 */
class MandatoryChildOrRequestedOptionalFilter {
    constructor(instance, optionalsMap) {
        const self = this;
      // should we clone the node to be a component or propertyOf of a instance
        assert(_.isObject(optionalsMap));
        assert(instance != null);
        self.optionalsMap = optionalsMap;
        self.instance = instance;
        self.references = [].concat(_.map(
          instance._referenceIdx), _.map(instance._back_referenceIdx));
    }

    shouldKeep(node) {
        const self = this;

        const addressSpace = node.addressSpace;

        const alreadyIn = self.references.filter((r) => {
            const n = addressSpace.findNode(r.nodeId);
            if (!_.isObject(n)) {
                console.log(" cannot find node ",r.nodeId.toString());
            }
            assert(_.isObject(n) || false);
            return n.browseName.name.toString() === node.browseName.name.toString();
        });

        if (alreadyIn.length > 0) {
            assert(alreadyIn.length === 1, "Duplication found ?");
          // a child with the same browse name has already been install
          // probably from a SuperClass, we should ignore this.
            return false; // ignore
        }

        const modellingRule = node.modellingRule;

        switch (modellingRule) {
        case null:
            return false; // skip
        case "Mandatory":
            return true;  // keep;
        case "Optional":
              // only if in requested optionals
            return (node.browseName.name in self.optionalsMap);
            break;
        case "OptionalPlaceHolder":
            return false; // ignored
        default:
            return false; // ignored
        }
    }

    filterFor(childinstance) {
      // construct
        const self = this;

        const browseName = childinstance.browseName.name;

        let map = {};

        if (browseName in self.optionalsMap) {
            map = self.optionalsMap[browseName];
        }
        const newFilter =  new MandatoryChildOrRequestedOptionalFilter(childinstance,map);
        return newFilter;
    }
}


/*
 * @function _get_parent_as_VariableOrObjectType
 * @param originalObject
 * @return {null|UABaseNode}
 * @private
 */
function _get_parent_as_VariableOrObjectType(originalObject) {
    const addressSpace = originalObject.addressSpace;

    let parent = originalObject.findReferencesEx("HasChild",BrowseDirection.Inverse);

    // istanbul ignore next
    if (parent.length > 1) {
        console.warn(" object ", originalObject.browseName.toString(), " has more than one parent !");
        console.warn(originalObject.toString());
    }

    assert(parent.length === 0 || parent.length === 1);
    if (parent.length === 0) { return null; }
    parent = addressSpace.findNode(parent[0].nodeId);
    if (parent && (parent.nodeClass === NodeClass.VariableType || parent.nodeClass === NodeClass.ObjectType)) {
        return parent;
    }
    return null;
}


class CloneHelper {
    constructor() {
        this.mapOrgToClone = {};
    }

    registerClonedObject(objInType, clonedObj) {
      // xx console.log("zzzz => ",objInType.nodeId.toString(), clonedObj.nodeId.toString());
        this.mapOrgToClone[objInType.nodeId.toString()] = {
            original: objInType,
            cloned: clonedObj
        };

      //
      //   /-----------------------------\
      //   | AcknowledgableConditionType |
      //   \-----------------------------/
      //              ^        |
      //              |        +---------------------|- (EnableState)   (shadow element)
      //              |
      //   /-----------------------------\
      //   |        AlarmConditionType   |
      //   \-----------------------------/
      //              |
      //              +-------------------------------|- EnableState    <
      //
      // find also child object with the same browse name that are
      // overridden in the SuperType
      //
        const origParent = _get_parent_as_VariableOrObjectType(objInType);
        if (origParent) {
            let base = origParent.subtypeOfObj;
            while (base) {
                const shadowChild = base.getChildByName(objInType.browseName);
                if (shadowChild) {
                    this.mapOrgToClone[shadowChild.nodeId.toString()] = {
                        original: shadowChild,
                        cloned: clonedObj
                    };
                  // xx console.log("   zzzz =>     ",shadowChild.nodeId.toString(), clonedObj.nodeId.toString(),objInType.browseName.toString());
                }
                base = base.subtypeOfObj;
            }
        }
      // find subTypeOf
    }
}

// install properties and components on a instantiated Object
//
// based on their ModelingRule
//  => Mandatory                 => Installed
//  => Optional                  => Not Installed , unless it appear in optionals array
//  => OptionalPlaceHolder       => Not Installed
//  => null (no modelling rule ) => Not Installed
//
function _initialize_properties_and_components(instance,topMostType,typeNode,optionalsMap, extraInfo) {
    optionalsMap = optionalsMap || {};

    if (topMostType.nodeId === typeNode.nodeId) {
        return; // nothing to do
    }

    const baseTypeNodeId = typeNode.subtypeOf;

    const baseType = typeNode.subtypeOfObj;

    // istanbul ignore next
    if (!baseType) {
        throw new Error("Cannot find object with nodeId ".red + baseTypeNodeId);
    }

    const filter = new MandatoryChildOrRequestedOptionalFilter(instance,optionalsMap);


    typeNode._clone_children_references(instance,filter,extraInfo);

    // get properties and components from base class
    _initialize_properties_and_components(instance,topMostType,baseType,optionalsMap , extraInfo);
}

/**
 * returns true if the parent object has a child  with the provided browseName
 * @param parent
 * @param childBrowseName
 */
function hasChildWithBrowseName(parent,childBrowseName) {
    assert(parent instanceof BaseNode);
    // extract children
    const children = parent.findReferencesAsObject("HasChild", true);

    return children.filter(child => child.browseName.name.toString()  === childBrowseName).length > 0;
}

function getParent(options) {
    const parent = options.componentOf || options.organizedBy;
    return parent;
}
function assertUnusedChildBrowseName(addressSpace,options) {
    function resolveOptionalObject(node) {
        return  node ? addressSpace._coerceNode(node) : null;
    }
    options.componentOf = resolveOptionalObject(options.componentOf);
    options.organizedBy = resolveOptionalObject(options.organizedBy);

    assert(!(options.componentOf && options.organizedBy));

    const parent = getParent(options);
    if (!parent) {
        return;
    }
    assert(_.isObject(parent));

    // istanbul ignore next
    // verify that no components already exists in parent
    if (parent && hasChildWithBrowseName(parent,options.browseName)) {
        throw new Error(`object ${parent.browseName.name.toString()} have already a child with browseName ${options.browseName.toString()}`);
    }
}

// xx var hasTypeDefintionNodeId = makeNodeId(40);
// xx var hasModellingRuleNodeId = makeNodeId(37);
function _remove_unwanted_ref(references) {
    // filter out HasTypeDefinition (i=40) , HasModellingRule (i=37);
    references = _.filter(references,(reference) => {
        assert(reference instanceof Reference);
        return reference.referenceType !== "HasTypeDefinition"  &&
               reference.referenceType !== "HasModellingRule";
    });
    return references;
}


// todo: MEMOIZE this method
function findNoHierarchicalReferences(originalObject) {
    const addressSpace = originalObject.addressSpace;

    const referenceId = addressSpace.findReferenceType("NonHierarchicalReferences");
    if (!referenceId) { return []; }
    assert(referenceId);

    // we need to explore
    let references = originalObject.findReferencesEx("NonHierarchicalReferences",BrowseDirection.Inverse);
        
    // xx references = [].concat(references,originalObject.findReferencesEx("NonHierarchicalReferences",BrowseDirection.Forward));
    references = [].concat(references,originalObject.findReferencesEx("HasEventSource",BrowseDirection.Inverse));

    const parent = _get_parent_as_VariableOrObjectType(originalObject);

    if (parent && parent.subtypeOfObj) {
        // parent is a ObjectType or VariableType and is not a root type
        assert(parent.nodeClass === NodeClass.VariableType || parent.nodeClass === NodeClass.ObjectType);

        // let investigate the same child base child
        const child = parent.subtypeOfObj.getChildByName(originalObject.browseName);

        if (child) {
            const baseRef = findNoHierarchicalReferences(child);
            // xx console.log("  ... ",originalObject.browseName.toString(), parent.browseName.toString(), references.length, baseRef.length);
            references = [].concat(references,baseRef);
        }
    }
    // perform some cleanup
    references =  _remove_unwanted_ref(references);

    return references;
}

function reconstructNonHierarchicalReferences(extraInfo) {
    function findImplementedObject(ref) {
        const info  = extraInfo.mapOrgToClone[ref.nodeId.toString()];
        if (info) {
            return info;
        }
        return null;
    }

    // navigate through original objects to find those that are being references by node that
    // have been cloned .
    // this could be node organized by some FunctionalGroup
    //
    _.forEach(extraInfo.mapOrgToClone,(value, key) => {
        const originalObject     = value.original;
        const clonedObject       = value.cloned;

        // find NoHierarchical References on original object
        const originalNonHierarchical = findNoHierarchicalReferences(originalObject);

        if (originalNonHierarchical.length === 0) {
            return;
        }

        // istanbul ignore next
        if (doDebug) {
            debugLog(" investigation ", value.original.browseName.toString() , value.cloned.nodeClass.toString(),value.original.nodeClass.toString(),value.original.nodeId.toString(),value.cloned.nodeId.toString());
        }

        originalNonHierarchical.forEach((ref) => {
            const info = findImplementedObject(ref);

            // if the object pointed by this reference is also cloned ...
            if (info) {
                const originalDest = info.original;
                const cloneDest    = info.cloned;

                // istanbul ignore next
                if (doDebug) {
                    debugLog("   adding reference ".cyan ,ref.referenceType , " from cloned ",
                                clonedObject.nodeId.toString(),clonedObject.browseName.toString(),
                                " to cloned ", cloneDest.nodeId.toString(),cloneDest.browseName.toString());
                }

                // restore reference
                clonedObject.addReference({
                    referenceType: ref.referenceType,
                    isForward: false,
                    nodeId: cloneDest.nodeId
                });
            }
        });
    });
}

/**
 * recreate functional group types according to type definition
 *
 * @method reconstructFunctionalGroupType
 * @param baseType
 */

/* @example:
 *
 *    MyDeviceType
 *        |
 *        +----------|- ParameterSet(BaseObjectType)
 *        |                   |
 *        |                   +-----------------|- Parameter1
 *        |                                             ^
 *        +----------|- Config(FunctionalGroupType)     |
 *                                |                     |
 *                                +-------- Organizes---+
 */
function reconstructFunctionalGroupType(extraInfo) {
    // navigate through original objects to find those that are being organized by some FunctionalGroup
    _.forEach(extraInfo.mapOrgToClone,(value, key) => {
        const originalObject = value.original;
        const instantiatedObject = value.cloned;
        const organizedByArray = originalObject.findReferencesEx("Organizes",BrowseDirection.Inverse);


        // function dumpRef(r) {
        //    var referenceTd = addressSpace.findNode(r.referenceTypeId);
        //    var obj = addressSpace.findNode(r.nodeId);
        //    return "<-- " + referenceTd.browseName.toString() + " -- " + obj.browseName.toString();
        // }
        //
        // console.log("xxxxx ========================================================".bgRed,originalObject.browseName.toString(),
        //    organizedByArray.map(dumpRef).join("\n"));
        organizedByArray.forEach((ref) => {
            if (extraInfo.mapOrgToClone.hasOwnProperty(ref.nodeId.toString())) {
                const info = extraInfo.mapOrgToClone[ref.nodeId.toString()];
                const folder = info.original;

                assert(folder.typeDefinitionObj.browseName.name.toString() === "FunctionalGroupType");

                // now create the same reference with the instantiated function group
                const destFolder = info.cloned;

                assert(ref.referenceType);

                destFolder.addReference({
                    referenceType: ref.referenceType,
                    isForward: !ref.isForward,
                    nodeId: instantiatedObject.nodeId
                });
                // xx console.log("xxx ============> adding reference ",ref.browse )
            }
        });
    });
}


function initialize_properties_and_components(instance,topMostType,nodeType,optionals) {
    const extraInfo = new CloneHelper();

    extraInfo.registerClonedObject(nodeType,instance);


    const optionalsMap = makeOptionalsMap(optionals);
    
    _initialize_properties_and_components(instance,topMostType,nodeType,optionalsMap,extraInfo);

    reconstructFunctionalGroupType(extraInfo);

    reconstructNonHierarchicalReferences(extraInfo);
}

export default initialize_properties_and_components;

