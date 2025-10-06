function getPatchHighlightColor(){
    return `hsl(${currentPatch.hue}, 100%, 50%)`;
}

let leafCounter = 0;
let totalLeaves = 0;
let totalWidth = 0;

let displayTreeUpsideDown = false;

const OFF_COLOR = "hsl(0, 0%, 30%)"
const VERTICAL_PADDING = 25;
const HORIZONTAL_PADDING = 30;
let verticalSpacing;
let horizontalSpacing;
let textSizeValue;
let lineThickness = 4;
let totalMaxDepth = 1;
let leafProgressValues = [];


function drawMetricTree(tree, depth){
    totalMaxDepth = max(1, tree.getMaxDepth());
    leafProgressValues = tree.getLeafNodeCyclePortionValues();

    let leafCountForDisplay = tree.getLeafNodeCount() + 1;
    let layerHeight = (canvasHeight - 2 * VERTICAL_PADDING) / totalMaxDepth;

    textSizeValue = min(layerHeight * 1 / 4, 1.3 * canvasWidth / leafCountForDisplay) + 10;
    verticalSpacing = (layerHeight * 3 / 4) - (textSizeValue / totalMaxDepth);
    horizontalSpacing = (canvasWidth - 2) / leafCountForDisplay;
    lineThickness = max(1, textSizeValue / 15);

    _drawMetricTreeRecursive(tree, depth, getGlobalProgress());
}


function _drawMetricTreeRecursive(tree, depth, globalProgress) {
    let leafCount = 0;

    for (let i = 0; i < tree.children.length; i++){
        leafCount += _drawMetricTreeRecursive(tree.children[i], depth + 1, globalProgress);
    }

    if (displayTreeUpsideDown){
        tree.pos = {x: null, y: canvasHeight - (VERTICAL_PADDING + textSizeValue + depth * verticalSpacing)}
    }
    else{
        tree.pos = {x: null, y: (VERTICAL_PADDING + textSizeValue + depth * verticalSpacing)}
    }

    const leaf = tree.isLeaf();

    if (leaf){
        tree.pos.x = HORIZONTAL_PADDING / 2 + (canvasWidth - HORIZONTAL_PADDING) * (leafProgressValues[leafCounter] + (leafProgressValues[leafCounter + 1] ?? 1)) / 2;
        if (displayTreeUpsideDown){
            tree.pos.y = canvasHeight - (VERTICAL_PADDING + textSizeValue + totalMaxDepth * verticalSpacing);
        }
        else{
            tree.pos.y = (VERTICAL_PADDING + textSizeValue + totalMaxDepth * verticalSpacing);
        }
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

    if (depth <= totalMaxDepth - currentPatch.numLayersMuted){
        push();
        noStroke();
        fill(tree.on ? getPatchHighlightColor() : OFF_COLOR);
        textSize(textSizeValue - (leaf ? 10 : 0));
        textAlign("center");
        let textValue = `${currentPatch.nodeNumberMode === "Leaves" ? `${(leaf ? 1 : tree.childrensTrueWidthSum())}${tree.ratio === 1 ? '' : `:${tree.getTrueWidth()}`}` : (tree.children.length > 0 ? tree.children.length : 1)}`
        text(textValue, tree.pos.x, tree.pos.y);
        // ellipse(tree.pos.x, tree.pos.y, 3, 3); // show anchor point of text
        pop();
    }
    if (depth < totalMaxDepth - currentPatch.numLayersMuted){
        if (!leaf){
            push();
            noFill();
            strokeWeight(lineThickness);
            let highlightedLineIdx = -1;
            for (let i = 0; i < tree.children.length; i++){
                let t = tree.children[i];
                if (t.on){ 
                    highlightedLineIdx = i;
                    continue;
                }
                stroke(OFF_COLOR);
                if (displayTreeUpsideDown){
                    line(tree.pos.x, tree.pos.y - (textSizeValue - (tree.getMaxDepth() === 1 ? 10 : 0)), t.pos.x, t.pos.y + textSizeValue / 5);
                }
                else{
                    line(tree.pos.x, tree.pos.y + textSizeValue / 5, t.pos.x, t.pos.y - (textSizeValue - (tree.getMaxDepth() === 1 ? 10 : 0)));
                }
            }

            // draw highlighted line now (after all the others) so it's always on top
            if (highlightedLineIdx >= 0){
                stroke(getPatchHighlightColor());
                if (displayTreeUpsideDown){
                    line(tree.pos.x, tree.pos.y - (textSizeValue - (tree.getMaxDepth() === 1 ? 10 : 0)), tree.children[highlightedLineIdx].pos.x, tree.children[highlightedLineIdx].pos.y + textSizeValue / 5);
                }
                else{
                    line(tree.pos.x, tree.pos.y + textSizeValue / 5, tree.children[highlightedLineIdx].pos.x, tree.children[highlightedLineIdx].pos.y - (textSizeValue - (tree.getMaxDepth() === 1 ? 10 : 0)));
                }
                pop();
            }
        }
    }

    if (leaf){
        leafCounter += 1;
    }

    return leaf ? 1 : leafCount;
}