/**
 * @module opcua.address_space
 * @class AddressSpace
 */
import assert from "better-assert";
import _ from "underscore";
import NodeClass from "lib/datamodel/NodeClass";
import Argument from "lib/datamodel/argument-list/Argument";
import DataValue from "lib/datamodel/DataValue";
import { Variant } from "lib/datamodel/variant";
import { DataType } from "lib/datamodel/variant";
import { VariantArrayType } from "lib/datamodel/variant";
import { StatusCodes } from "lib/datamodel/opcua_status_code";
import { BrowseDirection } from "lib/services/browse_service";
import UAVariable from "lib/address_space/UAVariable";
import util from "util";

// Release 1.03 12 OPC Unified Architecture, Part 9
// Two-state state machines
// Most states defined in this standard are simple – i.e. they are either TRUE or FALSE. The
// TwoStateVariableType is introduced specifically for this use case. More complex states are
// modelled by using a StateMachineType defined in Part 5.
// The TwoStateVariableType is derived from the StateVariableType.
//
// Attribute        Value
// BrowseName       TwoStateVariableType
// DataType         LocalizedText
// ValueRank        -1 (-1 = Scalar)
// IsAbstract       False
//
// Subtype of the StateVariableType defined in Part 5.
// Note that a Reference to this subtype is not shown in the definition of the StateVariableType
//
// References      NodeClass BrowseName              DataType      TypeDefinition Modelling Rule
// HasProperty     Variable  Id                      Boolean       PropertyType   Mandatory
// HasProperty     Variable  TransitionTime          UtcTime       PropertyType   Optional
// HasProperty     Variable  EffectiveTransitionTime UtcTime       PropertyType   Optional
// HasProperty     Variable  TrueState               LocalizedText PropertyType   Optional
// HasProperty     Variable  FalseState              LocalizedText PropertyType   Optional
// HasTrueSubState StateMachine or
//                 TwoStateVariableType
//                                                  <StateIdentifier> Defined in Clause 5.4.2 Optional
// HasFalseSubState StateMachine or
//                  TwoStateVariableType
//                                                  <StateIdentifier> Defined in Clause 5.4.3 Optional

function _updateTransitionTime(node) {
    // TransitionTime specifies the time when the current state was entered.
    if (node.transitionTime) {
        node.transitionTime.setValueFromSource({ dataType: DataType.DateTime, value: (new Date()) });
    }
}

function _updateEffectiveTransitionTime(node,subStateNode) {
    if (node.effectiveTransitionTime) {
        // xx console.log("xxxx _updateEffectiveTransitionTime because subStateNode ",subStateNode.browseName.toString());
        node.effectiveTransitionTime.setValueFromSource({ dataType: DataType.DateTime,value: (new Date()) });
    }
}


function _getEffectiveDisplayName(node) {
    const dataValue = node.id.readValue();
    if (dataValue.statusCode !== StatusCodes.Good) {
        return dataValue;
    }
    assert(dataValue.value.dataType === DataType.Boolean);
    const boolValue = dataValue.value.value;

    const humanReadableString = _getHumanReadableString(node);

    let subStateNodes;
    if (boolValue) {
        subStateNodes = node.findReferencesExAsObject("HasTrueSubState",BrowseDirection.Forward);
    } else {
        subStateNodes = node.findReferencesExAsObject("HasFalseSubState",BrowseDirection.Forward);
    }
    const states = subStateNodes.forEach((n) => {
        // todo happen
    });

    return humanReadableString;
}
function _getHumanReadableString(node) {
    let dataValue = node.id.readValue();
    if (dataValue.statusCode !== StatusCodes.Good) {
        return dataValue;
    }
    assert(dataValue.value.dataType === DataType.Boolean);
    const boolValue = dataValue.value.value;

    // The Value Attribute of a TwoStateVariable contains the current state as a human readable name.
    // The EnabledState for example, might contain the name “Enabled” when TRUE and “Disabled” when FALSE.

    let valueAsLocalizedText;

    if (boolValue) {
        const _trueState = (node._trueState) ? node._trueState : "TRUE";
        valueAsLocalizedText = { dataType: "LocalizedText", value: { text: _trueState } };
    } else {
        const _falseState = (node._falseState) ? node._falseState : "FALSE";
        valueAsLocalizedText = { dataType: "LocalizedText", value: { text: _falseState } };
    }
    dataValue = dataValue.clone();
    dataValue.value = new Variant(valueAsLocalizedText);
    return dataValue;
}


/** *
 * @class UATwoStateVariable
 * @constructor
 * @extends UAVariable
 */
class UATwoStateVariable extends UAVariable {
  /**
   * @method initialize
   * @private
   * @param options
   */
    initialize(options) {
        const node = this;

        if (options.trueState) {
            assert(options.falseState);
            assert(typeof (options.trueState) === "string");
            assert(typeof (options.falseState) === "string");
            node._trueState  = options.trueState;
            node._falseState = options.falseState;

            if (node.falseState) {
                node.falseState.bindVariable({
                    get() {
                        const node = this;
                        return new Variant({
                            dataType: DataType.LocalizedText,
                            value: node._falseState
                        });
                    }
                },true);
            }
            if (node.trueState) {
                node.trueState.bindVariable({
                    get() {
                        const node = this;
                        return new Variant({
                            dataType: DataType.LocalizedText,
                            value: node._trueState
                        });
                    }
                }, true);
            }
        }
        node.id.setValueFromSource({ dataType: "Boolean", value: false } , StatusCodes.UncertainInitialValue);

      // handle isTrueSubStateOf
        if (options.isTrueSubStateOf) {
            node.addReference({ referenceType: "HasTrueSubState", isForward: false, nodeId: options.isTrueSubStateOf });
        }

        if (options.isFalseSubStateOf) {
            node.addReference({ referenceType: "HasFalseSubState", isForward: false, nodeId: options.isFalseSubStateOf });
        }

        if (node.effectiveTransitionTime) {
          // install "value_changed" event handler on SubState that are already defined
            const subStates = [].concat(node.getTrueSubStates(),node.getFalseSubStates());
            subStates.forEach((subState) => {
                subState.on("value_changed",_updateEffectiveTransitionTime.bind(null,node,subState));
            });
        }

      // it should be possible to define a trueState and falseState LocalizedText even if the trueState or FalseState node
      // is not exposed. Therefore we need to store their value into dedicated variables.
        node.id.on("value_changed",() => {
            node._internal_set_dataValue(_getHumanReadableString(node));
        });
        node._internal_set_dataValue(_getHumanReadableString(node));

      // todo : also set the effectiveDisplayName if present

      // from spec Part 5
      // Release 1.03 OPC Unified Architecture, Part 5
      // EffectiveDisplayName contains a human readable name for the current state of the state
      // machine after taking the state of any SubStateMachines in account. There is no rule specified
      // for which state or sub-state should be used. It is up to the Server and will depend on the
      // semantics of the StateMachineType
      //
      // EffectiveDisplayName will be constructed by added the EnableState
      // and the State of the addTrue state
        if (node.effectiveDisplayName) {
            node.id.on("value_changed",() => {
                node.effectiveDisplayName._internal_set_dataValue(_getEffectiveDisplayName(node));
            });
            node.effectiveDisplayName._internal_set_dataValue(_getEffectiveDisplayName(node));
        }
    }

  // TODO : shall we care about overloading the remove_backward_reference method ?
  // some TrueSubState and FalseSubState relationship may be added later
  // so we need a mechanism to keep adding the "value_changed" event handle on subStates that
  // will be defined later.
  // install change detection on sub State
  // this is useful to change the effective transitionTime
  // EffectiveTransitionTime specifies the time when the current state or one of its sub states was entered.
  // If, for example, a LevelAlarm is active and – while active – switches several times between High and
  // HighHigh, then the TransitionTime stays at the point in time where the Alarm became active whereas the
  // EffectiveTransitionTime changes with each shift of a sub state.
    _add_backward_reference(reference) {
        const self = this;
        const _base_add_backward_reference = UAVariable.prototype._add_backward_reference;
      // call base method
        _base_add_backward_reference.call(self,reference);

        if ((reference.referenceType === "HasTrueSubState" ||  reference.referenceType === "HasFalseSubState") && reference.isForward) {
            const addressSpace = self.addressSpace;
          // add event handle
            const subState = addressSpace.findNode(reference.nodeId);
            subState.on("value_changed",_updateEffectiveTransitionTime.bind(null,self,subState));
        }
    }

  /**
   * @method setValue
   * @param boolValue {Boolean}
   */
    setValue(boolValue) {
        const node = this;
        assert(_.isBoolean(boolValue));
        const dataValue = node.id.readValue();
        const oldValue = dataValue.value.value;
        if (dataValue.statusCode === StatusCodes.Good && boolValue === oldValue) {
            return; // nothing to do
        }
      //
        node.id.setValueFromSource(new Variant({ dataType: DataType.Boolean, value: boolValue }));
        _updateTransitionTime(node);
        _updateEffectiveTransitionTime(node,node);
    }

  /**
   * @method getValue
   * @return {Boolean}
   */
    getValue() {
        const node = this;
        const dataValue = node.id.readValue();
        assert(dataValue.statusCode === StatusCodes.Good);
        assert(dataValue.value.dataType === DataType.Boolean);
        return dataValue.value.value;
    }

  /**
   * @method getValueAsString
   * @return {string}
   */
    getValueAsString() {
        const node = this;
        const dataValue = node.readValue();
        assert(dataValue.statusCode === StatusCodes.Good);
        assert(dataValue.value.dataType === DataType.LocalizedText);
        return dataValue.value.value.text.toString();
    }
}

export default UATwoStateVariable;

