/**
 * @module opcua.datamodel
 */
import Enum from "lib/misc/enum";

import { registerBasicType } from "lib/misc/factories";
import { StatusCodes } from "lib/datamodel/opcua_status_code";
import * as ec from "lib/misc/encode_decode";
import _ from "underscore";
import assert from "better-assert";

const NumericRangeEmpty_str = "NumericRange:<Empty>";


const NumericRangeType = new Enum(["Empty", "SingleValue", "ArrayRange", "MatrixRange", "InvalidRange"]);

const regexNumericRange = /^[0-9:,]*$/;

function _valid_range(low, high) {
    return !((low >= high) || (low < 0 || high < 0));
}

function construct_numeric_range_bit_from_string(str) {
    const values = str.split(":");

    if (values.length === 1) {
        return {
            type: NumericRangeType.SingleValue,
            value: parseInt(values[0], 10)
        };
    } else if (values.length === 2) {
        const array = values.map(a => parseInt(a, 10));
        if (!_valid_range(array[0], array[1])) {
            return { type: NumericRangeType.InvalidRange, value: str };
        }
        return {
            type: NumericRangeType.ArrayRange,
            value: array
        };
    } 
    return {
        type: NumericRangeType.InvalidRange,
        value: str
    };
}
function _normalize(e) {
    return e.type === NumericRangeType.SingleValue ? [e.value, e.value] : e.value;
}
function construct_numeric_range_from_string(str) {
    if (!regexNumericRange.test(str)) {
        return {
            type: NumericRangeType.InvalidRange,
            value: str
        };
    }

    // detect multi dim range
    const values = str.split(",");

    if (values.length === 1) {
        return construct_numeric_range_bit_from_string(values[0]);
    } else if (values.length === 2) {
        let rowRange;
        let colRange;
        const elements = values.map(construct_numeric_range_bit_from_string);
        rowRange = elements[0];
        colRange = elements[1];
        if (rowRange === NumericRangeType.InvalidRange || colRange === NumericRangeType.InvalidRange) {
            return { type: NumericRangeType.InvalidRange, value: str };
        }

        rowRange = _normalize(rowRange);
        colRange = _normalize(colRange);
        return { type: NumericRangeType.MatrixRange, value: [rowRange, colRange] };
    } 
        // not supported yet
    return { type: NumericRangeType.InvalidRange, value: str };
}

function NumericRange(value, second_value) {
    const self = this;

    function _construct_from_string(value) {
        const nr = construct_numeric_range_from_string(value);
        self.type = nr.type;
        self.value = nr.value;
    }

    function _construct_from_values(value, second_value) {
        if (_.isUndefined(second_value)) {
            self._set_single_value(value);
        } else {
            if (!_.isFinite(second_value)) {
                throw new Error(" invalid second argument, expecting a number");
            }
            self._set_range_value(value, second_value);
        }
    }

    function _construct_from_array(value) {
        assert(value.length === 2);
        if (_.isFinite(value[0])) {
            if (!_.isFinite(value[1])) {
                throw new Error(` invalid range in ${value}`);
            }
            self._set_range_value(value[0], value[1]);
        }
    }

    function _construct_from_NumericRange(value) {
        self.value = _.clone(value);
        self.type = value.type;
    }

    assert(!value || !(value instanceof NumericRange), "use coerce to create a NumericRange");

    if (typeof value === "string") {
        _construct_from_string(value);
    } else if (_.isFinite(value) && !_.isUndefined(value)) {
        _construct_from_values(value, second_value);
    } else if (_.isArray(value)) {
        _construct_from_array(value);
    } else if (value instanceof NumericRange) {
        _construct_from_NumericRange(value);
    } else {
        this.value = "<invalid>";
        this.type = NumericRangeType.Empty;
    }

    assert((this.type !== NumericRangeType.ArrayRange) || _.isArray(this.value));
}

NumericRange.coerce = function(value) {
    if (value instanceof NumericRange) {
        return value;
    }
    if (value === null || value === undefined) {
        return new NumericRange();
    }
    if (value === NumericRangeEmpty_str) {
        return new NumericRange();
    }
    assert(typeof value === "string" || _.isArray(value));
    return new NumericRange(value);
};

NumericRange.prototype._set_single_value = function (value) {
    assert(_.isFinite(value));
    this.value = value;
    this.type = NumericRangeType.SingleValue;
    if (this.value < 0) {
        this.type = NumericRangeType.InvalidRange;
    }
};

NumericRange.prototype._set_range_value = function (low, high) {
    assert(_.isFinite(low));
    assert(_.isFinite(high));
    this.value = [low, high];
    this.type = NumericRangeType.ArrayRange;

    if (!this._check_range()) {
        this.type = NumericRangeType.InvalidRange;
    }
};

NumericRange.prototype.isValid = function () {
    return this.type !== NumericRange.NumericRangeType.InvalidRange;
};
NumericRange.prototype.isEmpty = function () {
    return this.type === NumericRange.NumericRangeType.Empty;
};


NumericRange.prototype._check_range = function () {
    if (this.type === NumericRangeType.MatrixRange) {
        return _valid_range(this.value[0][0], this.value[0][1]) &&
            _valid_range(this.value[1][0], this.value[1][1]);
    } else if (this.type === NumericRangeType.ArrayRange) {
        return _valid_range(this.value[0], this.value[1]);
    } else if (this.type === NumericRangeType.SingleValue) {
        return this.value >= 0;
    }
    return true;
};

NumericRange.NumericRangeType = NumericRangeType;

NumericRange.prototype.toEncodeableString = function () {
    switch (this.type) {
    case NumericRangeType.SingleValue:
    case NumericRangeType.ArrayRange:
    case NumericRangeType.MatrixRange:
        return this.toString();
    case NumericRangeType.InvalidRange:
        return this.value; // value contains the origianl strings which was detected invalid
    default:
        return null;
    }
};

NumericRange.prototype.toString = function () {
    function array_range_to_string(values) {
        assert(_.isArray(values));
        if (values.length === 2 && values[0] === values[1]) {
            return values[0].toString();
        }
        return values.map(value => value.toString(10)).join(":");
    }

    function matrix_range_to_string(values) {
        return values.map(value => (_.isArray(value)) ? array_range_to_string(value) : value.toString(10)).join(",");
    }

    switch (this.type) {
    case NumericRangeType.SingleValue:
        return this.value.toString(10);

    case NumericRangeType.ArrayRange:
        return array_range_to_string(this.value);

    case NumericRangeType.Empty:
        return NumericRangeEmpty_str;

    case NumericRangeType.MatrixRange:
        return matrix_range_to_string(this.value);

    default:
        assert(this.type === NumericRangeType.InvalidRange);
        return "NumericRange:<Invalid>";
    }
};

NumericRange.prototype.toJSON = function () {
    return this.toString();
};

NumericRange.prototype.isDefined = function () {
    return this.type !== NumericRangeType.Empty && this.type !== NumericRangeType.InvalidRange;
};


function slice(arr, start, end) {
    assert(arr, "expecting value to slice");
    let res;
    if (arr.buffer instanceof ArrayBuffer) {
        res = arr.subarray(start, end);
    } else {
        assert(_.isFunction(arr.slice));
        assert(arr instanceof Buffer || arr instanceof Array || typeof arr === "string");
        res = arr.slice(start, end);
    }
    if (res instanceof Uint8Array && arr instanceof Buffer) {
      // note in iojs 3.00 onward standard Buffer are implemented differently and
      // provides a buffer member and a subarray method, in fact in iojs 3.0
      // it seems that Buffer acts as a Uint8Array. in this very special case
      // we need to make sure that we end up with a Buffer object and not a Uint8Array.
        res  = Buffer.from(res);
    }
    return res;
}

function extract_empty(array) {
    return {
        array: slice(array, 0, array.length),
        statusCode: StatusCodes.Good
    };
}

function extract_single_value(array, index) {
    if (index >= array.length) {
        return { array: [], statusCode: StatusCodes.BadIndexRangeNoData };
    }
    return {
        array: slice(array, index, index + 1),
        statusCode: StatusCodes.Good
    };
}
function extract_array_range(array, low_index, high_index) {
    assert(low_index >= 0);
    assert(low_index <= high_index);
    if (low_index >= array.length) {
        return { array: [], statusCode: StatusCodes.BadIndexRangeNoData };
    }
    // clamp high index
    high_index = Math.min(high_index,array.length - 1);

    return {
        array: slice(array, low_index, high_index + 1),
        statusCode: StatusCodes.Good
    };
}
function isArrayLike(value) {
    return _.isNumber(value.length) ||  value.hasOwnProperty("length");
}

function extract_matrix_range(array, rowRange, colRange) {
    if (array.length === 0 || !isArrayLike(array[0])) {
        return {
            array: [],
            statusCode: StatusCodes.BadIndexRangeNoData
        };
    }
    const result = extract_array_range(array, rowRange[0], rowRange[1]);

    for (let i = 0; i < result.array.length; i++) {
        const e = result.array[i];
        result.array[i] = extract_array_range(e, colRange[0], colRange[1]).array;
    }
    return result;
}

NumericRange.prototype.extract_values = function (array) {
    if (!array) {
        return {
            array,
            statusCode: this.type === NumericRangeType.Empty ? StatusCodes.Good : StatusCodes.BadIndexRangeNoData
        };
    }
    switch (this.type) {
    case NumericRangeType.Empty:
        return extract_empty(array);

    case NumericRangeType.SingleValue:
        const index = this.value;
        return extract_single_value(array, index);

    case NumericRangeType.ArrayRange:
        const low_index = this.value[0];
        const high_index = this.value[1];
        return extract_array_range(array, low_index, high_index);

    case NumericRangeType.MatrixRange:
        const rowRange = this.value[0];
        const colRange = this.value[1];
        return extract_matrix_range(array, rowRange, colRange);

    default:
        return { array: [], statusCode: StatusCodes.BadIndexRangeInvalid };
    }
};

function assert_array_or_buffer(array) {
    assert(_.isArray(array) || (array.buffer instanceof ArrayBuffer) || array instanceof Buffer);
}

function insertInPlaceStandardArray(arrayToAlter, low, high, newValues) {
    const args = [low, high - low + 1].concat(newValues);
    arrayToAlter.splice(...args);
    return arrayToAlter;
}

function insertInPlaceTypedArray(arrayToAlter, low, high, newValues) {
    if (low === 0 && high === arrayToAlter.length - 1) {
        return new arrayToAlter.constructor(newValues);
    }
    assert(newValues.length === high - low + 1);
    arrayToAlter.subarray(low, high + 1).set(newValues);
    return arrayToAlter;
}

function insertInPlaceBuffer(bufferToAlter, low, high, newValues) {
    if (low === 0 && high === bufferToAlter.length - 1) {
        return Buffer.from(newValues);
    }
    assert(newValues.length === high - low + 1);
    for (let i = 0; i < newValues.length; i++) {
        bufferToAlter[i + low] = newValues[i];
    }
    return bufferToAlter;
}


NumericRange.prototype.set_values = function (arrayToAlter, newValues) {
    assert_array_or_buffer(arrayToAlter);
    assert_array_or_buffer(newValues);

    let low_index;
    let high_index;

    switch (this.type) {
    case NumericRangeType.Empty:
        low_index = 0;
        high_index = arrayToAlter.length - 1;
        break;
    case NumericRangeType.SingleValue:
        low_index = this.value;
        high_index = this.value;
        break;
    case NumericRangeType.ArrayRange:
        low_index = this.value[0];
        high_index = this.value[1];
        break;
    case NumericRangeType.MatrixRange:
            // for the time being MatrixRange is not supported
        return { array: arrayToAlter, statusCode: StatusCodes.BadIndexRangeNoData };
    default:
        return { array: [], statusCode: StatusCodes.BadIndexRangeInvalid };
    }

    if (high_index >= arrayToAlter.length || low_index >= arrayToAlter.length) {
        return { array: [], statusCode: StatusCodes.BadIndexRangeNoData };
    }
    if ((this.type !== NumericRangeType.Empty) && newValues.length !== (high_index - low_index + 1)) {
        return { array: [], statusCode: StatusCodes.BadIndexRangeInvalid };
    }


    const insertInPlace = (_.isArray(arrayToAlter) ? insertInPlaceStandardArray : (arrayToAlter instanceof Buffer ? insertInPlaceBuffer : insertInPlaceTypedArray));
    return {
        array: insertInPlace(arrayToAlter, low_index, high_index, newValues),
        statusCode: StatusCodes.Good
    };
};

function _overlap(l1, h1, l2, h2) {
    return Math.max(l1, l2) <= Math.min(h1, h2);
}

const empty = new NumericRange();
NumericRange.overlap = (nr1, nr2) => {
    nr1 = nr1 || empty;
    nr2 = nr2 || empty;
    assert(nr1 instanceof NumericRange);
    assert(nr2 instanceof NumericRange);

    if (NumericRangeType.Empty === nr1.type || NumericRangeType.Empty === nr2.type) {
        return true;
    }
    if (NumericRangeType.SingleValue === nr1.type && NumericRangeType.SingleValue === nr2.type) {
        return nr1.value === nr2.value;
    }
    if (NumericRangeType.ArrayRange === nr1.type && NumericRangeType.ArrayRange === nr2.type) {
        // +-----+        +------+     +---+       +------+
        //     +----+       +---+    +--------+  +---+
        const l1 = nr1.value[0];
        const h1 = nr1.value[1];
        const l2 = nr2.value[0];
        const h2 = nr2.value[1];
        return _overlap(l1, h1, l2, h2);
    }
    console.log(" NR1 = ", nr1.toEncodeableString());
    console.log(" NR2 = ", nr2.toEncodeableString());
    assert(false, "not implemented yet "); // TODO
};

export default NumericRange;
