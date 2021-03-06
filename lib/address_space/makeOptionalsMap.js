import assert from "better-assert";


/**
 *
 * transform  optional into a map
 */

function makeOptionalsMap(optionals) {
    const map = {};
    if (!optionals) {
        return map;
    }
    assert(optionals instanceof Array);

    function insertInMap(map,s) {
        const key = s[0];

        if (!map[key]) {
            map[key] = {};
        }
        if (s.length > 1) {
            insertInMap(map[key],s.splice(1));
        }
    }
    for (let i = 0; i <  optionals.length; i++) {
        const opt = optionals[i];

        const s = opt.split(".");

        insertInMap(map,s);
    }
    return map;
}

export default makeOptionalsMap;
