"use strict";

import * as  Enum from "lib/misc/enum";

process.env.NODE_PATH=__dirname + ";" + process.env.NODE_PATH;

//require('module').Module._initPaths();

//require("requirish")._(module); 

// common services
const structures       = require("lib/datamodel/structures");
const parseEndpointUrl = require("lib/nodeopcua").parseEndpointUrl;
import NodeId , {
    resolveNodeId,
    makeNodeId,
    coerceNodeId
} from "lib/datamodel/NodeId";
import {
  makeExpandedNodeId,
  coerceExpandedNodeId
} from "lib/datamodel/ExpandedNodeId";
const StatusCodes      = require("lib/datamodel/opcua_status_code").StatusCodes;
const DataType         = require("lib/datamodel/variant").DataType;
import DataValue from "lib/datamodel/DataValue";
const Variant          = require("lib/datamodel/variant").Variant;
const VariantArrayType = require("lib/datamodel/variant").VariantArrayType;
import NumericRange from "lib/datamodel/numeric-range/NumericRange";
import  AccessLevelFlag from "lib/datamodel/access-level/accessLevelFlag";

import LocalizedText, { coerceLocalizedText } from "lib/datamodel/LocalizedText";
const QualifiedName       = require("lib/datamodel/qualified_name").QualifiedName;
const coerceQualifyName   = require("lib/datamodel/qualified_name").coerceQualifyName;

const Range               = require("lib/data_access/Range").Range;

//
const get_fully_qualified_domain_name = require("lib/misc/hostname").get_fully_qualified_domain_name;
const makeApplicationUrn              = require("lib/misc/applicationurn").makeApplicationUrn;

import NodeClass from "lib/datamodel/NodeClass";

// services
const browse_service                             = require("lib/services/browse_service");
const read_service                               = require("lib/services/read_service");
const write_service                              = require("lib/services/write_service");
const call_service                               = require("lib/services/call_service");
const session_service                            = require("lib/services/session_service");
const get_endpoints_service                      = require("lib/services/get_endpoints_service");
const subscription_service                       = require("lib/services/subscription_service");
const historizing_service                        = require("lib/services/historizing_service");
const register_server_service                    = require("lib/services/register_server_service");
const secure_channel_service                     = require("lib/services/secure_channel_service");
const translate_browse_paths_to_node_ids_service = require("lib/services/translate_browse_paths_to_node_ids_service");


const query_service           = require("lib/services/query_service");
const node_managment_service  = require("lib/services/node_management_service");


const EndpointDescription =  get_endpoints_service.EndpointDescription;

const utils              = require("lib/misc/utils");

const AttributeIds       = read_service.AttributeIds;
const AttributeNameById  = read_service.AttributeNameById;
const VariableTypeIds    = require("lib/opcua_node_ids").VariableTypeIds;
const VariableIds        = require("lib/opcua_node_ids").VariableIds;
const MethodIds          = require("lib/opcua_node_ids").MethodIds;
const ObjectIds          = require("lib/opcua_node_ids").ObjectIds;
const ObjectTypeIds      = require("lib/opcua_node_ids").ObjectTypeIds;
const ReferenceTypeIds   = require("lib/opcua_node_ids").ReferenceTypeIds;

const ApplicationType    = get_endpoints_service.ApplicationType;

// client services
import OPCUAClient from "lib/client/OPCUAClient";
import NodeCrawler  from "lib/client/NodeCrawler";
import ClientSubscription from "lib/client/ClientSubscription";
import ClientSession     from "lib/client/ClientSession";

// Server services
import OPCUAServer from "lib/server/OPCUAServer";
import OPCUADiscoveryServer from "lib/server/OPCUADiscoveryServer";
import ServerEngine from "lib/server/ServerEngine";
import generate_address_space from "lib/address_space/generateAddressSpace";
import AddressSpace from "lib/address_space/AddressSpace";
const ServerState        = require("schemas/39394884f696ff0bf66bacc9a8032cc074e0158e/ServerState_enum").ServerState;
const SecurityPolicy     = require("lib/misc/security_policy").SecurityPolicy;
const ServiceCounter     = require("_generated_/_auto_generated_ServiceCounter").ServiceCounter;
// basic opcua NodeClass
import UAObject from "lib/address_space/UAObject";
import UAMethod  from "lib/address_space/UAMethod";
import UAVariable from "lib/address_space/UAVariable";

import UADataType from "lib/address_space/UADataType";


const AnonymousIdentityToken = session_service.AnonymousIdentityToken;
const UserNameIdentityToken = session_service.UserNameIdentityToken;

//
const MessageSecurityMode = get_endpoints_service.MessageSecurityMode;

import makeRelativePath from "lib/address_space/makeRelativePath";


// DA
const standardUnits                  = require("lib/data_access/EUInformation").standardUnits;
const makeEUInformation              = require("lib/data_access/EUInformation").makeEUInformation;


// version
const version               = require("./package.json").version;

import { 
  standard_nodeset_file,
  di_nodeset_filename,
  adi_nodeset_filename,
// an incomplete but sufficient nodeset file used during testing
  mini_nodeset_filename,
  part8_nodeset_filename
} from "lib/server/ServerEngine";


const is_valid_endpointUrl = require("lib/nodeopcua").is_valid_endpointUrl;

const client_utils = require("lib/client/client_utils");

const DataTypeIds = require("lib/opcua_node_ids").DataTypeIds;

// filtering tools
const constructEventFilter = require("lib/tools/tools_event_filter").constructEventFilter;
const checkSelectClause = require("lib/tools/tools_event_filter").checkSelectClause;
const buildVariantArray = require("lib/datamodel/variant_tools").buildVariantArray;
const encode_decode = require("lib/misc/encode_decode");

const factories = require("lib/misc/factories");

export {
  structures,
  parseEndpointUrl,
  resolveNodeId,
  makeNodeId,
  coerceNodeId,
  makeExpandedNodeId,
  coerceExpandedNodeId,
  StatusCodes,
  DataType,
  DataValue,
  Variant,
  VariantArrayType,
  NodeId,
  NumericRange,
  AccessLevelFlag,

  LocalizedText,
  coerceLocalizedText,
  QualifiedName,
  coerceQualifyName,

  Range,


  get_fully_qualified_domain_name,
  makeApplicationUrn,

  NodeClass,

// services
  browse_service,
  read_service,
  write_service,
  call_service,
  session_service,
  get_endpoints_service,
  subscription_service,
  historizing_service,
  register_server_service,
  secure_channel_service,
  translate_browse_paths_to_node_ids_service,


  query_service,
  node_managment_service,


  EndpointDescription,

  utils,

  AttributeIds,
  AttributeNameById,
  VariableTypeIds,
  VariableIds,
  MethodIds,
  ObjectIds,
  ObjectTypeIds,
  ReferenceTypeIds,

  ApplicationType,

// client services
  OPCUAClient,
  NodeCrawler,
  ClientSubscription,
  ClientSession,

// Server services
  OPCUAServer,
  OPCUADiscoveryServer,
  ServerEngine,
  generate_address_space,
  AddressSpace,
  ServerState,
  SecurityPolicy,
  ServiceCounter,
// basic opcua NodeClass
  UAObject,
  UAMethod,
  UAVariable,
  UADataType,


  AnonymousIdentityToken,
  UserNameIdentityToken,

//
  MessageSecurityMode,

  makeRelativePath,


// DA
  standardUnits,
  makeEUInformation,


// version
  version,
  standard_nodeset_file,
  di_nodeset_filename,
  adi_nodeset_filename,

// an incomplete but sufficient nodeset file used during testing
  mini_nodeset_filename,
  part8_nodeset_filename,


  is_valid_endpointUrl,

  client_utils,

  DataTypeIds,

// filtering tools
  constructEventFilter,
  checkSelectClause,
  buildVariantArray,
  encode_decode,

  Enum,
  factories
};


export default {
  structures,
  parseEndpointUrl,
  resolveNodeId,
  makeNodeId,
  coerceNodeId,
  makeExpandedNodeId,
  coerceExpandedNodeId,
  StatusCodes,
  DataType,
  DataValue,
  Variant,
  VariantArrayType,
  NodeId,
  NumericRange,
  AccessLevelFlag,

  LocalizedText,
  coerceLocalizedText,
  QualifiedName,
  coerceQualifyName,

  Range,


  get_fully_qualified_domain_name,
  makeApplicationUrn,

  NodeClass,

// services
  browse_service,
  read_service,
  write_service,
  call_service,
  session_service,
  get_endpoints_service,
  subscription_service,
  historizing_service,
  register_server_service,
  secure_channel_service,
  translate_browse_paths_to_node_ids_service,


  query_service,
  node_managment_service,


  EndpointDescription,

  utils,

  AttributeIds,
  AttributeNameById,
  VariableTypeIds,
  VariableIds,
  MethodIds,
  ObjectIds,
  ObjectTypeIds,
  ReferenceTypeIds,

  ApplicationType,

// client services
  OPCUAClient,
  NodeCrawler,
  ClientSubscription,
  ClientSession,

// Server services
  OPCUAServer,
  OPCUADiscoveryServer,
  ServerEngine,
  generate_address_space,
  AddressSpace,
  ServerState,
  SecurityPolicy,
  ServiceCounter,
// basic opcua NodeClass
  UAObject,
  UAMethod,
  UAVariable,
  UADataType,


  AnonymousIdentityToken,
  UserNameIdentityToken,

//
  MessageSecurityMode,

  makeRelativePath,


// DA
  standardUnits,
  makeEUInformation,


// version
  version,
  standard_nodeset_file,
  di_nodeset_filename,
  adi_nodeset_filename,

// an incomplete but sufficient nodeset file used during testing
  mini_nodeset_filename,
  part8_nodeset_filename,


  is_valid_endpointUrl,

  client_utils,

  DataTypeIds,

// filtering tools
  constructEventFilter,
  checkSelectClause,
  buildVariantArray,
  encode_decode,

  Enum,
  factories
};