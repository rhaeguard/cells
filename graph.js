
function constructGraph(dataTable) {
    const idToNode = new Map()

    for (let col in dataTable) {
        for (let cell of dataTable[col]) {
            let isRelevantNode = cell.dependencies.length > 0
            isRelevantNode = isRelevantNode || hasValue(cell.data)
            if (isRelevantNode) {
                idToNode.set(cell.id, {
                    id: cell.id,
                    edges: [...cell.dependencies]
                })
            }
        }
    }

    // normally, the graphs in the sheet are going to be multiple disjoint graphs (islands).
    // while we could find and check cycles in each island separately, there's no need.
    // what we do here is to connect a root/sentinel node to all the non-leaf nodes.
    // since this approach does not result in additonal cycles (because it's directed edges),
    // this allows us to start from a single root node to detect cycles. 
    const sentinel = {
        id: "sentinel",
        edges: []
    }

    for (let [id, node] of idToNode.entries()) {
        node.edges = node.edges.map(nid => idToNode.get(nid)).filter(anode => anode != undefined)
        if (node.edges.length > 0) {
            sentinel.edges.push(node)
        }
    }

    return sentinel
}

function containsCycle(root) {
    /*
    basic idea is to use DFS and explore different paths.

    we keep track of already seen nodes so that we do not visit them again.
    we also keep track of the recursion stack to know if we have seen the currently explored node.
    the main observation is that if there's a cycle, a node would already be in the recursion stack.
    */
    function isCyclic(node, seen, stack) {
        const id = node.id;

        if (stack.has(id)) {
            return true;
        }

        if (seen.has(id)) {
            return false;
        }

        seen.add(id)
        stack.add(id)

        for (let child of node.edges) {
            if (isCyclic(child, seen, stack)) {
                return true;
            }
        }

        stack.delete(id)

        return false;
    }

    const seen = new Set()
    const recursiveStack = new Set()

    for (let child of root.edges) {
        if (isCyclic(child, seen, recursiveStack)) {
            return true;
        }
    }
    return false;
}