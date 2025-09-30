function getPatchHighlightColor(){
    return `hsl(${currentPatch.hue}, 100%, 50%)`;
}

let leafCounter = 0;
let totalLeaves = 0;

const OFF_COLOR = "hsl(0, 0%, 30%)"
const VERTICAL_PADDING = 25;
const HORIZONTAL_PADDING = 30;
let verticalSpacing = 160;
let horizontalSpacing = 50;
let textSizeValue = 50;
let lineThickness = 4;
let totalDepth = 1;
let leafProgressValues = [];


function drawMetricTree(tree, depth){
    totalDepth = max(1, tree.getMaxDepth());
    leafProgressValues = tree.getLeafNodeCyclePortionValues();

    let leafCountForDisplay = tree.getLeafNodeCount() + 1;
    let layerHeight = (canvasHeight - 2 * VERTICAL_PADDING) / totalDepth;

    textSizeValue = min(layerHeight * 1 / 4, 1.3 * canvasWidth / leafCountForDisplay);
    verticalSpacing = (layerHeight * 3 / 4) - (textSizeValue / totalDepth);
    horizontalSpacing = (canvasWidth - 2) / leafCountForDisplay;
    lineThickness = max(1, textSizeValue / 15);

    
    _drawMetricTreeRecursive(tree, depth);
}


function _drawMetricTreeRecursive(tree, depth) {
    let leafCount = 0;

    for (let i = 0; i < tree.children.length; i++){
        leafCount += _drawMetricTreeRecursive(tree.children[i], depth + 1, totalDepth);
    }

    tree.pos = {x: null, y: VERTICAL_PADDING + textSizeValue + depth * verticalSpacing}

    let leaf = tree.isLeaf();

    if (leaf){ 
        tree.pos.x = HORIZONTAL_PADDING / 2 + (canvasWidth - HORIZONTAL_PADDING) * (leafProgressValues[leafCounter] + (leafProgressValues[leafCounter + 1] ?? 1)) / 2;
        tree.on = leafProgressValues[leafCounter] <= globalProgress % 1 && globalProgress % 1 < (leafProgressValues[leafCounter + 1] ?? 1);
        tree.index = leafCounter;
    }
    else{
        let sumOfChildXPositions = 0;
        tree.on = false;
        tree.children.forEach(t => {
            sumOfChildXPositions += t.pos.x;
            tree.on |= t.on;
        });
        tree.pos.x = sumOfChildXPositions / tree.children.length;
    }

    if (depth <= totalDepth - currentPatch.numLayersMuted){
        push();
        noStroke();
        fill(tree.on ? getPatchHighlightColor() : OFF_COLOR);
        textSize(textSizeValue);
        textAlign("center");
        let textValue = `${currentPatch.nodeNumberMode === "Leaves" ? `${(leaf ? 1 : tree.childrensTrueWidthSum())}${tree.ratio === 1 ? '' : `:${tree.trueWidth()}`}` : (tree.children.length > 0 ? tree.children.length : 1)}`
        text(textValue, tree.pos.x, tree.pos.y);
        // ellipse(tree.pos.x, tree.pos.y, 3, 3); // show anchor point of text
        pop();
    }
    if (depth < totalDepth - currentPatch.numLayersMuted){
        if (!leaf){
            push();
            noFill();
            strokeWeight(lineThickness);
            let lineThatIsOnIdx = -1;
            for (let i = 0; i < tree.children.length; i++){
                let t = tree.children[i];
                if (t.on){ 
                    lineThatIsOnIdx = i;
                    continue;
                }
                stroke(OFF_COLOR);
                line(tree.pos.x, tree.pos.y + textSizeValue / 5, t.pos.x, t.pos.y - textSizeValue);
            }
            if (lineThatIsOnIdx >= 0){
                stroke(getPatchHighlightColor());
                line(tree.pos.x, tree.pos.y + textSizeValue / 5, tree.children[lineThatIsOnIdx].pos.x, tree.children[lineThatIsOnIdx].pos.y - textSizeValue);
                pop();
            }
        }
    }

    if (leaf){
        leafCounter += 1;
    }

    return leaf ? 1 : leafCount;
}