/**
 * @module opcua.server
 */
import crypto from "crypto";
import assert from "better-assert";
import { StatusCodes } from "lib/datamodel/opcua_status_code";

let counter = 0;
function make_key() {
    // return crypto.randomBytes(32);
    counter += 1;
    return new Buffer(counter.toString(), "ascii");
}

class ContinuationPointManager {
    constructor() {
        this._map = {};
    }

    register(maxElements, values) {
        maxElements = maxElements || values.length;
        if (maxElements >= values.length) {
            return {
                statusCode: StatusCodes.Good,
                continuationPoint: null,
                references: values
            };
        }

        const key = make_key();
        const keyHash = key.toString("ascii");

      // split the array in two ( values)
        const current_block = values.splice(0, maxElements);

        const result = {
            statusCode: StatusCodes.Good,
            continuationPoint: key,
            references: current_block
        };

      // create
        const data = {
            maxElements,
            remainingElements: values
        };
        this._map[keyHash] = data;

        return result;
    }

    getNext(continuationPoint) {
        if (!continuationPoint) {
            return { statusCode: StatusCodes.BadContinuationPointInvalid };
        }
        const keyHash = continuationPoint.toString("ascii");

        const data = this._map[keyHash];
        if (!data) {
            return { statusCode: StatusCodes.BadContinuationPointInvalid };
        }
        assert(data.maxElements > 0);
      // split the array in two ( values)
        const current_block = data.remainingElements.splice(0, data.maxElements);

        const result = {
            statusCode: StatusCodes.Good,
            continuationPoint: data.remainingElements.length ? continuationPoint : null,
            references: current_block
        };
        if (data.remainingElements.length === 0) {
          // we are done
            delete this._map[keyHash];
        }
        return result;
    }

    cancel(continuationPoint) {
        if (!continuationPoint) {
            return { statusCode: StatusCodes.BadContinuationPointInvalid };
        }

        const keyHash = continuationPoint.toString("ascii");

        const data = this._map[keyHash];
        if (!data) {
            return {
                statusCode: StatusCodes.BadContinuationPointInvalid,
                continuationPoint: null,// nullBuffer,
                references: []
            };
        }
        delete this._map[keyHash];
        return {
            statusCode: StatusCodes.Good
        };
    }
}

const nullBuffer = new Buffer(0);


export default ContinuationPointManager ;
