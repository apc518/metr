class MetricTree {
    /**
     * Takes a nested list (a list of lists of lists of lists... etc.) and creates a MetricTree with the same topology
     */
    constructor(ls){
        this.children = []
        ls.forEach(sublist => {
            this.children.push(new MetricTree(sublist));
        })
    }

    getDepth(){
        if (this.children.length < 1){
            return 0;
        }
        
        return 1 + max(Array.from(this.children, t => t.getDepth()));
    }

    /**
     * Get the total number of leaf nodes that are descendents of this node
     */
    getLeafNodeCount(){
        if (this.children.length < 1){
            return 1;
        }

        let sum = 0;
        this.children.forEach(t => sum += t.getLeafNodeCount());

        return sum;
    }

    /**
     * get the subdivision groupings below this node; aka if this was the root of a 7/8, you might get [2,2,3], [2,3,2], or [3,2,2]
     */
    getChildrensLeafNodeCounts(){
        return Array.from(this.children, t => t.getLeafNodeCount());
    }

    getChildrensChildCounts(){
        return Array.from(this.children, t => t.children.length);
    }

    /**
     * Returns the exponent for the power of 2 that all children have as their number of descendants
     * if all children have the same power of 2 for their number of children.
     * Otherwise returns 0
     */
    unanimousPowerOf2Exponent(ls){
        if (ls.every(n => n === ls[0])){
            let num = ls[0];
            if (Math.pow(2, floor(Math.log2(num))) === num){
                return Math.log2(num);
            }
        }

        return 0;
    }

    getPowerOf2LayerCount(){
        if (this.children.length === 0) return 0;

        return this.unanimousChildrensPowerOf2Exponent() + min(Array.from(this.children, t => t.getPowerOf2LayerCount()));
    }

    getLeafNodeCountsAtDepth(depth, targetDepth){
        if (depth + 1 >= targetDepth){
            return Array.from(this.children, t => t.getLeafNodeCount());
        }

        return Array.from(this.children, t => t.getLeafNodeCountsAtDepth(depth + 1, targetDepth)).flat(1);
    }

    getChildCountsAtDepth(depth, targetDepth){
        if (depth + 1 >= targetDepth){
            return Array.from(this.children, t => t.children.length);
        }

        return Array.from(this.children, t => t.getChildCountsAtDepth(depth + 1, targetDepth)).flat(1);
    }

    /**
     * Compute the likely bottom number of the time signature, assuming this node represents a single measure
     */
    getTimeSignature(){
        let subDivGroups = this.getChildrensLeafNodeCounts();
        let layer = floor(Math.log2(max(subDivGroups)));
        let treeDepth = this.getDepth();
        let ignorePowersOf2MakeupExponent = 0;
        for (let i = 1; i < treeDepth; i++){
            ignorePowersOf2MakeupExponent += this.unanimousPowerOf2Exponent(this.getChildCountsAtDepth(0, i));
        }
        return `${this.getLeafNodeCount() / Math.pow(2, ignorePowersOf2MakeupExponent)}/${Math.pow(2, layer - ignorePowersOf2MakeupExponent + 2)}`
    }
}