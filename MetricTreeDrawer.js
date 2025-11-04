function getPatchHighlightColor(){
    return `hsl(${currentPatch.hue}, 100%, 50%)`;
}

const TEXT_COLOR_OFF = "hsl(0, 0%, 20%)"
const BOX_COLOR_OFF = "hsl(0, 0%, 30%)"
const BOX_COLOR_ON = "hsl(0, 0%, 50%)"
const VERTICAL_PADDING = 25;
const HORIZONTAL_PADDING = 30;


class MetricTreeDrawer{
    constructor({upperTree, lowerTree, depth, drawLeafNodes, leafNodeYPos, horizontalScale, showLeafBoxes, showLeafPositions }){
        this.upperTree = upperTree;
        this.lowerTree = lowerTree;
        this.displayDepth = depth;
        this.drawLeafNodes = drawLeafNodes;
        this.leafNodeYPos = leafNodeYPos;
        this.horizontalScale = horizontalScale;
        this.showLeafBoxes = showLeafBoxes;
        
        this.totalMaxDepth = max(1, upperTree.getMaxDepth());
        this.leafProgressValues = Array.from(upperTree.getLeafNodeCyclePortionValues(), v => v * this.horizontalScale);

        this.lineThickness = 4;

        let leafCountForDisplay = upperTree.getLeafNodeCount() + 1;

        this.leafNodeHeight = min(canvasHeight / (8 * this.totalMaxDepth), canvasWidth / leafCountForDisplay);
        this.innerNodeHeight = this.leafNodeHeight + 10;

        this.leafNodeTextSize = this.leafNodeHeight * 1.0;
        this.innerNodeTextSize = this.innerNodeHeight * 1.1;

        this.layerHeight = ((canvasHeight - VERTICAL_PADDING) / 2 - this.leafNodeHeight) / this.totalMaxDepth + 0;
        this.lineThickness = max(1, this.innerNodeHeight / 15);
    }

    draw(){
        let globalProgress = getGlobalProgress();
        
        this.leafCounter = 0;
        this._draw(this.upperTree, this.displayDepth, globalProgress, false);
        
        this.leafCounter = 0;
        this._draw(this.lowerTree, this.displayDepth, globalProgress, true);

        if (__debug){
            // draw center line through canvas
            stroke(255, 0, 0);
            strokeWeight(2);
            line(0, canvasHeight / 2, canvasWidth, canvasHeight / 2);
        }
    }

    _draw(tree, depth, globalProgress, isLowerTree){
        for (let i = 0; i < tree.children.length; i++){
            this._draw(tree.children[i], depth + 1, globalProgress, isLowerTree);
        }

        tree.pos = {x: null, y: (VERTICAL_PADDING / 2 + (this.innerNodeHeight / 2) + depth * this.layerHeight)}
        if (isLowerTree){
            tree.pos.y = canvasHeight - tree.pos.y;
        }

        const leaf = tree.isLeaf();

        const leafDisplayWidth = (canvasWidth - HORIZONTAL_PADDING) * ((this.leafProgressValues[this.leafCounter + 1] ?? this.horizontalScale) - this.leafProgressValues[this.leafCounter]);

        if (leaf){
            tree.pos.x = HORIZONTAL_PADDING / 2 + (canvasWidth - HORIZONTAL_PADDING) * (this.leafProgressValues[this.leafCounter] + (this.leafProgressValues[this.leafCounter + 1] ?? this.horizontalScale)) / 2;
            tree.pos.y = VERTICAL_PADDING / 2 + (this.leafNodeHeight / 2) + this.totalMaxDepth * this.layerHeight;
            if (isLowerTree){
                tree.pos.y = canvasHeight - tree.pos.y;
            }
            tree.on = this.leafProgressValues[this.leafCounter] <= globalProgress % 1 && globalProgress % 1 < (this.leafProgressValues[this.leafCounter + 1] ?? this.horizontalScale);
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

        // draw nodes
        if (depth <= this.totalMaxDepth - currentPatch.numLayersMuted && (!leaf || this.drawLeafNodes)){
            push();
            noStroke();
            
            if (leaf && (this.showLeafBoxes || __debug)){
                fill(tree.on ? BOX_COLOR_ON : BOX_COLOR_OFF);
                rect(tree.pos.x - (leafDisplayWidth / 2), tree.pos.y - this.leafNodeHeight / 2, leafDisplayWidth, this.leafNodeHeight);
            }
            else if (__debug) {
                fill(tree.on ? BOX_COLOR_ON : BOX_COLOR_OFF);
                rect(tree.pos.x - (this.innerNodeHeight / 2), tree.pos.y - this.innerNodeHeight / 2, this.innerNodeHeight, this.innerNodeHeight);
            }

            fill(tree.on ? getPatchHighlightColor() : TEXT_COLOR_OFF);
            textSize(leaf ? this.leafNodeTextSize : this.innerNodeTextSize);
            textAlign(CENTER, CENTER);
            let textValue = `${currentPatch.nodeNumberMode === "Leaves" ? `${(leaf ? 1 : tree.childrensTrueWidthSum())}${tree.ratio === 1 ? '' : `:${tree.getTrueWidth()}`}` : (tree.children.length > 0 ? tree.children.length : 1)}`
            text(textValue, tree.pos.x, tree.pos.y + (leaf ? this.leafNodeTextSize : this.innerNodeTextSize) * 0.05);
            
            if (__debug){
                // show position of nodes
                fill(255, 0, 0);
                ellipse(tree.pos.x, tree.pos.y, 2, 2);
            }

            pop();
        }

        // draw edges
        if (depth < this.totalMaxDepth - currentPatch.numLayersMuted){
            if (!leaf){
                push();
                noFill();
                strokeWeight(this.lineThickness);
                let highlightedLineIdx = -1;
                for (let i = 0; i < tree.children.length; i++){
                    let t = tree.children[i];
                    if (t.on){ 
                        highlightedLineIdx = i;
                        continue;
                    }
                    stroke(TEXT_COLOR_OFF);

                    const yValues = this._calculateYCoordinatesForEdge(tree, t, isLowerTree);

                    line(tree.pos.x, yValues[0], t.pos.x, yValues[1]);
                }

                // draw highlighted line now (after all the others) so it's always on top
                if (highlightedLineIdx >= 0){
                    stroke(getPatchHighlightColor());
                    const yValues = this._calculateYCoordinatesForEdge(tree, tree.children[highlightedLineIdx], isLowerTree);

                    line(tree.pos.x, yValues[0], tree.children[highlightedLineIdx].pos.x, yValues[1]);
                    pop();
                }
            }
        }

        if (leaf){
            this.leafCounter += 1;
        }

        return;
    }

    _calculateYCoordinatesForEdge(tree1, tree2, isLowerTree){
        const yValues = [
            tree1.pos.y + this.innerNodeHeight / 2,
            tree2.pos.y - (tree2.isLeaf() ? this.leafNodeHeight  : this.innerNodeHeight) / 2
        ];
        
        if (isLowerTree){
            yValues[0] = tree1.pos.y - this.innerNodeHeight / 2;
            yValues[1] = tree2.pos.y + (tree2.isLeaf() ? this.leafNodeHeight  : this.innerNodeHeight) / 2;
        }

        return yValues;
    }
}