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

    getLeafNodeCount(){
        if (this.children.length < 1){
            return 1;
        }

        let sum = 0;
        this.children.forEach(t => sum += t.getLeafNodeCount());

        return sum;
    }
}