function deepCopy(obj){
    return JSON.parse(JSON.stringify(obj));
}

function makeTree(){
    let tree_ = new MetricTree();

    tree_.addChild(new MetricTree());
    for (let k = 0; k < 3; k++){
        const child = new MetricTree();
        for (let w = 0; w < 2; w++){
            child.addChild(new MetricTree());
        }
        tree_.children[0].addChild(child);
    }

    const lastBeat = new MetricTree(6/5);
    const lastBeatSubDiv1 = new MetricTree(2/3);
    const lastBeatSubDiv2 = new MetricTree();
    for (let i = 0; i < 2; i++){
        lastBeatSubDiv1.addChild(new MetricTree());
        lastBeatSubDiv2.addChild(new MetricTree());
    }
    lastBeatSubDiv2.addChild(new MetricTree());
    lastBeat.addChild(lastBeatSubDiv1);
    lastBeat.addChild(lastBeatSubDiv2);

    tree_.addChild(lastBeat);

    return tree_;
}