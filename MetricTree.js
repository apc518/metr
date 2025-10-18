class MetricTree {
    /**
     * Creates a metric tree node, optionally with a ratio passed in for tuplets
     */
    constructor(ratio=1){
        this.children = [];
        this.ratio = ratio;
    }

    equals(otherTree){
        if (this.ratio != otherTree.ratio){
            return false;
        }

        if (this.isLeaf() != (otherTree.children.length == 0)){
            return false;
        }

        if (this.isLeaf() && (otherTree.children.length == 0)){
            return true;
        }

        if (otherTree.children.length !== this.children.length){
            return false;
        }

        for (let [i, child] of this.children.entries()){
            if (!child.equals(otherTree.children[i])){
                return false;
            }
        }

        return true;
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

    getMaxDepth(){
        if (this.isLeaf()){
            return 0;
        }
        
        return 1 + max(Array.from(this.children, t => t.getMaxDepth()));
    }

    getMinDepth(){
        if (this.isLeaf()){
            return 0;
        }

        return 1 + min(Array.from(this.children, t => t.getMinDepth()));
    }

    /**
     * Returns the true width of the tree, taking into account tuplets
     * This is not necessarily the number of leaf nodes, but it will be
     * the same as the number of leaf nodes if there are no tuplets in the tree.
     * 
     * For instance, for tree `1*3`, getTrueWidth() returns 3.
     * For tree `[2+3]*3` getTrueWidth() returns 15.
     * For tree `3:4*2` getTrueWidth() returns 8, despite `3:4*2` only having 6 leaf nodes
     */
    getTrueWidth(){
        if (this.isLeaf()) {
            return 1;
        }

        let sum = 0;
        for (let child of this.children){
            sum += child.getTrueWidth() / this.ratio;
        }

        return Math.round(sum);
    }

    /**
     * Only different from getTrueWidth() if this node has a ratio != 1
     */
    childrensTrueWidthSum(){
        let total = 0;
        for (let child of this.children){
            total += child.getTrueWidth();
        }
        return Math.round(total);
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
            childRelativeSizes.push(child.getTrueWidth() / this.childrensTrueWidthSum());
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

    getChildrensTrueWidths(){
        return Array.from(this.children, t => t.getTrueWidth());
    }

    getLeafParentCounts(){
        if (this.isLeaf()){
            return [];
        }
        if (this.getMaxDepth() === 1){
            return [this.children.length];
        }

        return Array.from(this.children, c => c.getLeafParentCounts()).flat(1);
    }

    getLeafParentWidths(){
        if (this.isLeaf()){
            return [];
        }
        if (this.getMaxDepth() === 1){
            return [this.getTrueWidth()];
        }

        return Array.from(this.children, c => c.getLeafParentWidths()).flat(1);
    }

    getTrueWidthsAtDepth(targetDepth){
        return this.getTrueWidthsAtDepthRecursive(0, targetDepth);
    }

    getTrueWidthsAtDepthRecursive(depth, targetDepth){
        if (depth + 1 >= targetDepth){
            return Array.from(this.children, t => t.getTrueWidth());
        }

        return Array.from(this.children, t => t.getTrueWidthsAtDepthRecursive(depth + 1, targetDepth)).flat(1);
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
        return `${this.getTrueWidth() / Math.pow(2, ignorePowersOf2MakeupExponent)}/${Math.pow(2, layer - ignorePowersOf2MakeupExponent + 2)}`
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
        let thisDepth = this.getMaxDepth();

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
        let leafParentWidths = this.getLeafParentWidths();
        let leafParentCounts = this.getLeafParentCounts();
        let leafParentsAreAllOnes = true;
        for (let count of leafParentCounts){
            if (count !== 1){
                leafParentsAreAllOnes = false;
            }
        }
        for (let width of leafParentWidths){
            if (width !== 1){
                leafParentsAreAllOnes = false;
            }
        }

        if (leafParentsAreAllOnes){
            this.removeLeaves();
        }
    }

    /** Remove all the leaves from the tree, leaving the parents of the old leaves as the new leaves. */
    removeLeaves(){
        if (this.getMaxDepth() === 1){
            this.children = [];
            return;
        }
        else{
            this.children.forEach(c => c.removeLeaves());
        }
    }
}