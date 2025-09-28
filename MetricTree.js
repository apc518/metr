class MetricTree {
    /**
     * Creates a metric tree node, optionally with a ratio passed in for tuplets
     */
    constructor(ratio=1){
        this.children = [];
        this.ratio = ratio;
    }

    copy(){
        if (this.isLeaf()){
            return new MetricTree();
        }

        const newTree = new MetricTree(this.ratio);
        this.children.forEach(c => newTree.children.push(c.copy()));

        return newTree;
    }

    addChild(metricTree){
        this.children.push(metricTree);
    }

    getDepth(){
        if (this.isLeaf()){
            return 0;
        }
        
        return 1 + max(Array.from(this.children, t => t.getDepth()));
    }

    /**
     * Returns the true width of the tree, taking into account tuplets
     * This is not necessarily the number of leaf nodes, but it will be
     * the same as the number of leaf nodes if there are no tuplets in the tree.
     * 
     * For instance, for tree `1*3`, trueWidth() returns 3.
     * For tree `[2+3]*3` trueWidth() returns 15.
     * For tree `3:4*2` trueWidth() returns 8, despite `3:4*2` only having 6 leaf nodes
     */
    trueWidth(){
        if (this.isLeaf()) {
            return 1;
        }

        let sum = 0;
        for (let child of this.children){
            sum += child.trueWidth() / this.ratio;
        }

        return sum;
    }

    /**
     * Only different from trueWidth() if this node has a ratio != 1
     */
    childrensTrueWidthSum(){
        let total = 0;
        for (let child of this.children){
            total += child.trueWidth();
        }
        return total;
    }

    /**
     * returns a list with the same number of elements as the number of leaf nodes on this tree
     * where each value represents the portion of the cycle at which that leaf node resides.
     * 
     * e.g. for a simple tree with a root node and four children, it would return [0, 0.25, 0.5, 0.75]
     */
    getLeafNodeCyclePortionValues(){
        if (this.isLeaf()){
            return [0];
        }
        
        let childRelativeSizes = [];
        
        for (let child of this.children){
            childRelativeSizes.push(child.trueWidth() / this.childrensTrueWidthSum());
        }
        
        const portionValues = [];
        
        let offset = 0;
        
        for (let [i, child] of this.children.entries()){
            for (let val of child.getLeafNodeCyclePortionValues()){
                portionValues.push(val * childRelativeSizes[i] + offset)
            }
            
            offset += childRelativeSizes[i];
        }
        
        return portionValues;
    }

    /**
     * Get the total number of leaf nodes that are descendents of this node
     */
    getLeafNodeCount(){
        if (this.isLeaf()){
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

    getChildrensTrueWidths(){
        return Array.from(this.children, t => t.trueWidth());
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

    getLeafNodeCountsAtDepth(depth, targetDepth){
        if (depth + 1 >= targetDepth){
            return Array.from(this.children, t => t.getLeafNodeCount());
        }

        return Array.from(this.children, t => t.getLeafNodeCountsAtDepth(depth + 1, targetDepth)).flat(1);
    }

    getChildCountsAtDepth(targetDepth){
        return this.getChildCountsAtDepthRecursive(0, targetDepth);
    }

    getChildCountsAtDepthRecursive(depth, targetDepth){
        if (depth + 1 >= targetDepth){
            return Array.from(this.children, t => t.children.length);
        }

        return Array.from(this.children, t => t.getChildCountsAtDepthRecursive(depth + 1, targetDepth)).flat(1);
    }

    getTrueWidthsAtDepth(targetDepth){
        return this.getTrueWidthsAtDepthRecursive(0, targetDepth);
    }

    getTrueWidthsAtDepthRecursive(depth, targetDepth){
        if (depth + 1 >= targetDepth){
            return Array.from(this.children, t => t.trueWidth());
        }

        return Array.from(this.children, t => t.getChildCountsAtDepthRecursive(depth + 1, targetDepth)).flat(1);
    }

    /**
     * Compute the likely bottom number of the time signature, assuming this node represents a single measure
     */
    getTimeSignature(){
        if (this.isLeaf()){
            return "?";
        }
        
        let beatSizes = this.getChildrensTrueWidths();
        let layer = floor(Math.log2(max(beatSizes)));
        let ignorePowersOf2MakeupExponent = largestPowerOf2ThatEvenlyDividesEverything(beatSizes);
        return `${this.trueWidth() / Math.pow(2, ignorePowersOf2MakeupExponent)}/${Math.pow(2, layer - ignorePowersOf2MakeupExponent + 2)}`
    }

    isLeaf(){
        return this.children.length < 1;
    }

    leafIsLeftmost(leaf){
        if (this.isLeaf()){
            return this.index === leaf;
        }

        if (this.children[0].leafIsLeftmost(leaf)){
            return true;
        }

        return false;
    }

    leafIsLeftmostAtDepth(leaf, targetDepth, depth){
        if (depth === targetDepth){
            return this.leafIsLeftmost(leaf);
        }

        return Array.from(this.children, c => c.leafIsLeftmostAtDepth(leaf, targetDepth, depth + 1)).some(x => x);
    }

    minDepthContainingNodeWhoseLeftMostLeafIsThis(leaf){
        let thisDepth = this.getDepth();

        for (let depth = 0; depth < thisDepth; depth++){
            // console.log(`this.leafIsLeftmostAtDepth(${leaf}, ${depth}, ${0}) -> ${this.leafIsLeftmostAtDepth(leaf, depth, 0)}`);
            if (this.leafIsLeftmostAtDepth(leaf, depth, 0)){
                return depth;
            }
        }

        return thisDepth;
    }

    /** prune leaves iff all parents of leaf nodes have only one child. 
     * This does not really affect the defined meter, but helps visually
     * for trees representing very simple meters like 4/4 */
    pruneLeaves(){
        let leafParentCounts = this.getTrueWidthsAtDepth(this.getDepth() - 1);
        let leafParentsAreAllOnes = true;
        for (let lpc of leafParentCounts){
            if (lpc !== 1){
                leafParentsAreAllOnes = false;
            }
        }

        if (leafParentsAreAllOnes){
            this.removeLeaves();
        }
    }

    /** Remove all the leaves from the tree, leaving the parents of the old leaves as the new leaves. */
    removeLeaves(){
        if (this.getDepth() === 1){
            this.children = [];
            return;
        }
        else{
            this.children.forEach(c => c.removeLeaves());
        }
    }
}