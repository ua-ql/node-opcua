/*=
 * Release 1.03 page 152 OPC Unified Architecture, Part 4
 * Annex A (informative) BNF definitions
 * BNF for RelativePath
 */
import assert from "better-assert";
import _ from "underscore";
import { 
    resolveNodeId,
    coerceNodeId,
    makeNodeId
} from "lib/datamodel/NodeId";
import QualifiedName from "lib/datamodel/QualifiedName";
import { RelativePath } from "_generated_/_auto_generated_RelativePath";


/*

 “/2:Block&.Output”  Follows any forward hierarchical Reference with target BrowseName = “2:Block.Output”.

 “/3:Truck.0:NodeVersion”
 Follows any forward hierarchical Reference with target BrowseName = “3:Truck” and from there a forward
 Aggregates Reference to a target with BrowseName “0:NodeVersion”.

 “<1:ConnectedTo>1:Boiler/1:HeatSensor”
 Follows any forward Reference with a BrowseName = ‘1:ConnectedTo’ and
 finds targets with BrowseName = ‘1:Boiler’. From there follows any hierarchical
 Reference and find targets with BrowseName = ‘1:HeatSensor’.


 “<1:ConnectedTo>1:Boiler/”
 Follows any forward Reference with a BrowseName = ‘1:ConnectedTo’ and finds targets
 with BrowseName = ‘1:Boiler’. From there it finds all targets of hierarchical References.

 “<0:HasChild>2:Wheel”
 Follows any forward Reference with a BrowseName = ‘HasChild’ and qualified
 with the default OPC UA namespace. Then find targets with BrowseName =
 ‘Wheel’ qualified with namespace index ‘2’.

 “<!HasChild>Truck”
 Follows any inverse Reference with a BrowseName = ‘HasChild’. Then find targets with BrowseName = ‘Truck’.
 In both cases, the namespace component of the BrowseName is assumed to be 0.

 “<0:HasChild>”
 Finds all targets of forward References with a BrowseName = ‘HasChild’
 and qualified with the default OPC UA namespace.
 */

/*
 *   /                      The forward slash character indicates that the Server is to follow
 *                          any subtype of HierarchicalReferences.
 *   .                      The period (dot) character indicates that the Server is to follow
 *                          any subtype of a Aggregates ReferenceType.
 *  <[#!ns:]ReferenceType>
 *                          A string delimited by the ‘<’ and ‘>’ symbols specifies the BrowseName
 *                          of a ReferenceType to follow. By default, any References of the subtypes
 *                          the ReferenceType are followed as well. A ‘#’ placed in front of the BrowseName
 *                          indicates that subtypes should not be followed.
 *                          A ‘!’ in front of the BrowseName is used to indicate that the inverse Reference
 *                          should be followed.
 *                          The BrowseName may be qualified with a namespace index (indicated by a numeric
 *                          prefix followed by a colon). This namespace index is used specify the namespace
 *                          component of the BrowseName for the ReferenceType. If the namespace prefix is
 *                          omitted then namespace index 0 is used.
 */

const hierarchicalReferenceTypeNodeId = resolveNodeId("HierarchicalReferences");
const aggregatesReferenceTypeNodeId = resolveNodeId("Aggregates");


//  The following BNF describes the syntax of the RelativePath text format.
//  <relative-path> ::= <reference-type> <browse-name> [relative-path]
//  <reference-type> ::= '/' | '.' | '<' ['#'] ['!'] <browse-name> '>'
//  <browse-name> ::= [<namespace-index> ':'] <name>
//  <namespace-index> ::= <digit> [<digit>]
//  <digit> ::= '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
//  <name>  ::= (<name-char> | '&' <reserved-char>) [<name>]
//  <reserved-char> ::= '/' | '.' | '<' | '>' | ':' | '#' | '!' | '&'
//  <name-char> ::= All valid characters for a String (see Part 3) excluding reserved-chars.
//
const name_char = /[0-9a-zA-Z_\ \(\()]/;
const reserved_char = /[/\.<>:#!&]/;
const regName = new RegExp(`(${name_char.source}|(\&${reserved_char.source}))+`);
const regNamespaceIndex = /[0-9]+/;
const regBrowseName = new RegExp(`(${regNamespaceIndex.source}:)?(${regName.source})`);
const regReferenceType = new RegExp(`\/|\\.|(\<(\#)?(\!)?(${regBrowseName.source})\>)`);

const regRelativePath = new RegExp(`(${regReferenceType.source})(${regBrowseName.source})?`);
function unescape(str) {
    return str.replace(/&/g,"");
}
function makeQualifiedName(mm) {
    const strName = mm[10];
    if (!strName || strName.length === 0) {
        return new QualifiedName();
    }
    const namespaceIndex = mm[11] ? parseInt(mm[11]) : 0;
    const name = unescape(mm[12]);
    return  new QualifiedName({ namespaceIndex,name });
}

/**
 * construct a RelativePath from a string containing the relative path description.
 * The string must comply to the OPCUA BNF for RelativePath ( see part 4 - Annexe A)
 * @method makeRelativePath
 * @param str {String}
 * @param addressSpace {AddressSpace}
 * @return {RelativePath}
 *
 * @example:
 *
 *      var relativePath = makeRelativePath("/Server.ServerStatus.CurrentTime");
 *
 */
function makeRelativePath(str,addressSpace) {
    let r = {
        elements:[]
    };

    while (str.length > 0) {
        const matches = str.match(regRelativePath);
        if (!matches) {
            throw new Error(`Malformed relative path  :'${str}'`);
        }

        // console.log(mm);

        let referenceTypeId;

        let includeSubtypes;
        let isInverse;

        //
        // ------------ extract reference type
        //
        const refStr = matches[1];
        if (refStr === "/") {
            referenceTypeId = hierarchicalReferenceTypeNodeId;
            isInverse = false;
            includeSubtypes = true;
        } else if (refStr === ".") {
            referenceTypeId = aggregatesReferenceTypeNodeId;
            isInverse = false;
            includeSubtypes = true;
        } else {
            // match  3 =>    "#" or null
            includeSubtypes = !(matches[3] === "#");

            // match  4 =>    "!" or null
            isInverse = (matches[4] === "!");

            // match 5
            // namespace match 6 ( ns:)
            // name      match 7
            const ns = matches[6] ? parseInt(matches[6]) : 0;
            const name = matches[7];
            if (!matches[6]) {
                // xx console.log( mm[6])
                referenceTypeId = resolveNodeId(name);
            } else {
                // AddressSpace.prototype.findReferenceType = function (refType,namespace)
                referenceTypeId = addressSpace.findReferenceType(name,ns);
            }
            assert(referenceTypeId && !referenceTypeId.isEmpty());
        }

        r.elements.push({
            referenceTypeId,
            isInverse,
            includeSubtypes,
            targetName: makeQualifiedName(matches)
        });

        str = str.substr(matches[0].length);
    }


    r = new RelativePath(r);
    // xx console.log(r.toString());
    return r;
}

export default makeRelativePath;
