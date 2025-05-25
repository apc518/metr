class MetricTree {
    /**
     * Takes a nested list (a list of lists of lists of lists... etc.) and creates a MetricTree with the same topology
     */
    constructor(ls){
        if (typeof ls === "object"){
            this.children = []
            ls.forEach(sublist => {
                this.children.push(new MetricTree(sublist));
            })
        }
        else{
            console.error(`Argument to MetricTree constructor was an unsupported type \"${typeof ls}\" Argument in question: `, ls);
        }
    }

    getDepth(){
        if (this.isLeaf()){
            return 0;
        }
        
        return 1 + max(Array.from(this.children, t => t.getDepth()));
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

    getChildCountsAtDepth(depth, targetDepth){
        if (depth + 1 >= targetDepth){
            return Array.from(this.children, t => t.children.length);
        }

        return Array.from(this.children, t => t.getChildCountsAtDepth(depth + 1, targetDepth)).flat(1);
    }

    largestPowerOf2ThatEvenlyDividesEverything(ls){
        let power = 0;
        let iterations = 0;
        const ITERATION_LIMIT = 100;
        while (typeof ls.length === "number" && ls.length > 0 && iterations < ITERATION_LIMIT){
            if (Array.from(ls, n => n / Math.pow(2, power + 1)).every(item => Math.floor(item) === item)){
                power += 1;
            }
            else{
                break;
            }

            iterations += 1;
        }
        if (iterations >= ITERATION_LIMIT){
            throw new Error("Too many loops");
        }

        return power;
    }

    /**
     * Compute the likely bottom number of the time signature, assuming this node represents a single measure
     */
    getTimeSignature(){
        if (this.isLeaf()){
            return "?";
        }
        
        let beatSizes = this.getChildrensLeafNodeCounts();
        let layer = floor(Math.log2(max(beatSizes)));
        let ignorePowersOf2MakeupExponent = this.largestPowerOf2ThatEvenlyDividesEverything(beatSizes);
        return `${this.getLeafNodeCount() / Math.pow(2, ignorePowersOf2MakeupExponent)}/${Math.pow(2, layer - ignorePowersOf2MakeupExponent + 2)}`
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
}