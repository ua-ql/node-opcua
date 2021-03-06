import assert from "better-assert";
import { BrowsePath } from "lib/services/translate_browse_paths_to_node_ids_service";
import { resolveNodeId } from "lib/datamodel/NodeId";
import makeRelativePath from "lib/address_space/makeRelativePath";

function makeBrowsePath(rootNode,relativePathBNF) {
    function _get_nodeId(node) {
        if (node.nodeId) {
            return node.nodeId;
        }
        return resolveNodeId(node);
    }
    return new BrowsePath({
        startingNode: _get_nodeId(rootNode),
        relativePath: makeRelativePath(relativePathBNF)
    });
}

export default makeBrowsePath;
