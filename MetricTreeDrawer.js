function getPatchHighlightColor(){
    return `hsl(${currentPatch.hue}, 100%, 50%)`;
}

const TEXT_COLOR_OFF = "hsl(0, 0%, 20%)"
const BOX_COLOR_OFF = "hsl(0, 0%, 30%)"
const BOX_COLOR_ON = "hsl(0, 0%, 50%)"
const VERTICAL_PADDING = 25;
const HORIZONTAL_PADDING = 30;


function listDiffsIsSubsequenceOfOther(ls1, ls2, ls1Scale){
    for (let i = 0; i < ls1.length; i++){
        if (!(Math.abs(((ls2[i+1] ?? 1) - ls2[i]) - (ls1Scale * ((ls1[i+1] ?? 1) - ls1[i]))) < 0.000001)){
            return false;
        }
    }

    return true;
}

class MetricTreeDrawer{
    constructor({upperTree, lowerTree, depth, drawLeafNodes, horizontalScale, showLeafBoxes, continuousScrolling }){
        this.upperTree = upperTree;
        this.lowerTree = lowerTree;
        this.displayDepth = depth;
        this.drawLeafNodes = drawLeafNodes;
        this.horizontalScale = horizontalScale;
        this.showLeafBoxes = showLeafBoxes;
        this.continuousScrolling = continuousScrolling;

        this.showBothLeafRows = true;
        this.totalMaxDepth = max(upperTree ? max(1, upperTree.getMaxDepth()) : 0, lowerTree ? max(1, lowerTree.getMaxDepth()) : 0);
        this.upperLeafProgressValues = [];
        this.lowerLeafProgressValues = [];
        
        if (upperTree && lowerTree){
            const upperTreeWidth = upperTree.getTrueWidth();
            const lowerTreeWidth = lowerTree.getTrueWidth();
    
            if (upperTreeWidth >= lowerTreeWidth){
                this.upperTreeWidthRatio = 1;
                this.lowerTreeWidthRatio = lowerTreeWidth / upperTreeWidth;
            }
            else{
                this.upperTreeWidthRatio = upperTreeWidth / lowerTreeWidth;
                this.lowerTreeWidthRatio = 1;
            }
        }
        else{
            this.upperTreeWidthRatio = 1;
            this.lowerTreeWidthRatio = 1;
        }

        if (upperTree){
            this.upperLeafProgressValues = upperTree.getLeafNodeCyclePortionValues();
        }

        if (lowerTree){
            this.lowerLeafProgressValues = lowerTree.getLeafNodeCyclePortionValues();
        }

        if (upperTree && lowerTree){
            const lowerTreeProgressValuesIsSubset = listDiffsIsSubsequenceOfOther(this.lowerLeafProgressValues, this.upperLeafProgressValues, this.lowerTreeWidthRatio);
            const upperTreeProgressValuesIsSubset = listDiffsIsSubsequenceOfOther(this.upperLeafProgressValues, this.lowerLeafProgressValues, this.upperTreeWidthRatio);

            this.showBothLeafRows = !(lowerTreeProgressValuesIsSubset || upperTreeProgressValuesIsSubset);
            this.showLeafBoxes = this.showLeafBoxes || !(lowerTreeProgressValuesIsSubset || upperTreeProgressValuesIsSubset);
        }

        this.lineThickness = 4;

        let leafCountForDisplay = max(upperTree ? upperTree.getLeafNodeCount() + 1 : 0, lowerTree ? lowerTree.getLeafNodeCount() + 1 : 0);

        this.leafNodeHeight = min(canvasHeight / ((lowerTree ? 8 : 4) * this.totalMaxDepth), (canvasWidth * this.horizontalScale) / leafCountForDisplay);
        this.innerNodeHeight = this.leafNodeHeight + 10;

        this.leafNodeTextSize = this.leafNodeHeight * 1.0;
        this.innerNodeTextSize = this.innerNodeHeight * 1.1;

        this.lineThickness = max(1, this.innerNodeHeight / 15);
        
        if (lowerTree){
            this.layerHeight = ((canvasHeight - VERTICAL_PADDING) / 2 - this.leafNodeHeight) / this.totalMaxDepth;
            if (!this.showBothLeafRows){
                if (this.upperTree.getMaxDepth() > this.lowerTree.getMaxDepth()){
                    this.layerHeight += this.leafNodeHeight / (2 * this.upperTree.getMaxDepth());
                }
                else{
                    this.layerHeight += this.leafNodeHeight / (2 * this.lowerTree.getMaxDepth());
                }
            }
        }
        else{
            this.layerHeight = (canvasHeight - VERTICAL_PADDING - this.leafNodeHeight) / this.totalMaxDepth;
        }
    }

    draw(){
        let globalProgress = getGlobalProgress(this.upperTreeWidthRatio === 1 && this.upperTree ? this.upperTree : this.lowerTree);

        const globalHorizontalOffset = ((canvasWidth - HORIZONTAL_PADDING) / 2) - (canvasWidth - HORIZONTAL_PADDING) * this.horizontalScale * globalProgress;

        const upperTreePixelWidth = (canvasWidth - HORIZONTAL_PADDING) * this.upperTreeWidthRatio * this.horizontalScale;
        const upperTreeCopies = Math.ceil(1 + 1 / (this.horizontalScale * this.upperTreeWidthRatio));

        const upperTreePostRecursionTasks = [];
        const lowerTreePostRecursionTasks = [];

        if(this.upperTree){
            const indexOffset = Math.floor(- globalHorizontalOffset / upperTreePixelWidth);
            for (let i = indexOffset; i < indexOffset + upperTreeCopies; i++){
                if (i < 0) continue;
                this.leafCounter = 0;
                this._draw(
                    this.upperTree,
                    this.displayDepth,
                    globalProgress / this.upperTreeWidthRatio,
                    false,
                    this.upperLeafProgressValues,
                    this.horizontalScale * this.upperTreeWidthRatio,
                    this.continuousScrolling ? i * upperTreePixelWidth + globalHorizontalOffset : 0,
                    this.continuousScrolling ? i : 0,
                    upperTreePostRecursionTasks
                );
            }
        }

        const lowerTreePixelWidth = (canvasWidth - HORIZONTAL_PADDING) * this.lowerTreeWidthRatio * this.horizontalScale;
        const lowerTreeCopies = Math.ceil(1 + 1 / (this.horizontalScale * this.lowerTreeWidthRatio))

        if (this.lowerTree){
            const indexOffset = Math.floor(- globalHorizontalOffset / lowerTreePixelWidth);
            for (let i = indexOffset; i < indexOffset + lowerTreeCopies; i++){
                if (i < 0) continue;
                this.leafCounter = 0;
                this._draw(
                    this.lowerTree,
                    this.displayDepth,
                    globalProgress / this.lowerTreeWidthRatio,
                    true,
                    this.lowerLeafProgressValues,
                    this.horizontalScale * this.lowerTreeWidthRatio,
                    this.continuousScrolling ? i * lowerTreePixelWidth + globalHorizontalOffset : 0,
                    this.continuousScrolling ? i : 0,
                    lowerTreePostRecursionTasks
                );
            }
        }
        
        for (let func of upperTreePostRecursionTasks){
            func();
        }
        
        for (let func of lowerTreePostRecursionTasks){
            func();
        }

        if (__debug){
            // draw center line through canvas
            stroke(255, 0, 0);
            strokeWeight(2);
            line(0, canvasHeight / 2, canvasWidth, canvasHeight / 2);

            // draw vertical and horizontal padding borders
            line(HORIZONTAL_PADDING / 2, 0, HORIZONTAL_PADDING / 2, canvasHeight);
            line(canvasWidth - HORIZONTAL_PADDING / 2, 0, canvasWidth - HORIZONTAL_PADDING / 2, canvasHeight);
            line(0, VERTICAL_PADDING / 2, canvasWidth, VERTICAL_PADDING / 2);
            line(0, canvasHeight - VERTICAL_PADDING / 2, canvasWidth, canvasHeight - VERTICAL_PADDING / 2);
        }
    }

    _draw(tree, depth, progress, isLowerTree, leafProgressValues, horizontalScale, horizontalOffset, index, postRecusionTasks){
        for (let i = 0; i < tree.children.length; i++){
            this._draw(tree.children[i], depth + 1, progress, isLowerTree, leafProgressValues, horizontalScale, horizontalOffset, index, postRecusionTasks);
        }

        tree.pos = {x: null, y: (VERTICAL_PADDING / 2 + (this.innerNodeHeight / 2) + depth * this.layerHeight)}
        if (isLowerTree){
            tree.pos.y = canvasHeight - tree.pos.y;
        }

        const leaf = tree.isLeaf();

        const leafDisplayWidth = (canvasWidth - HORIZONTAL_PADDING) * ((leafProgressValues[this.leafCounter + 1] ?? 1) - leafProgressValues[this.leafCounter]) * horizontalScale;

        if (leaf){
            tree.pos.x = HORIZONTAL_PADDING / 2 + (canvasWidth - HORIZONTAL_PADDING) * (leafProgressValues[this.leafCounter] + (leafProgressValues[this.leafCounter + 1] ?? 1)) * horizontalScale / 2;
            tree.pos.y = VERTICAL_PADDING / 2 + (this.leafNodeHeight / 2) + this.totalMaxDepth * this.layerHeight;
            if (isLowerTree){
                tree.pos.y = canvasHeight - tree.pos.y;
            }
            let upperBound = (index + leafProgressValues[this.leafCounter + 1]);
            if (isNaN(upperBound)) {
                upperBound = index + 1;
            }
            if (this.continuousScrolling){
                tree.on = index + leafProgressValues[this.leafCounter] <= progress && progress < upperBound;
            }
            else{
                tree.on = leafProgressValues[this.leafCounter] <= progress % 1 && progress % 1 < (leafProgressValues[this.leafCounter + 1] ?? upperBound)
            }
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
            
            push();
            stroke(BOX_COLOR_ON);
            strokeWeight(1);
            if (leaf && (this.showLeafBoxes || __debug)){
                fill(tree.on ? BOX_COLOR_ON : BOX_COLOR_OFF);
                rect(horizontalOffset + tree.pos.x - (leafDisplayWidth / 2), tree.pos.y - this.leafNodeHeight / 2, leafDisplayWidth, this.leafNodeHeight);
            }
            else if (__debug) {
                fill(tree.on ? BOX_COLOR_ON : BOX_COLOR_OFF);
                rect(horizontalOffset + tree.pos.x - (this.innerNodeHeight / 2), tree.pos.y - this.innerNodeHeight / 2, this.innerNodeHeight, this.innerNodeHeight);
            }

            pop();

            let textValue = `${currentPatch.nodeNumberMode === "Leaves" ? `${(leaf ? 1 : tree.childrensTrueWidthSum())}${tree.ratio === 1 ? '' : `:${tree.getTrueWidth()}`}` : (tree.children.length > 0 ? tree.children.length : 1)}`
            const textPos = { x: horizontalOffset + tree.pos.x, y: tree.pos.y + (leaf ? this.leafNodeTextSize : this.innerNodeTextSize) * 0.05 }
            if (textPos.x < canvasWidth + this.innerNodeTextSize * textValue.length * 2
                && textPos.x > 0 - this.innerNodeTextSize * textValue.length * 2
                && (!leaf || this.showBothLeafRows || (this.lowerTreeWidthRatio < this.upperTreeWidthRatio ? !isLowerTree : isLowerTree) || tree.on))
            {
                fill(tree.on ? getPatchHighlightColor() : TEXT_COLOR_OFF);
                textSize(leaf ? this.leafNodeTextSize : this.innerNodeTextSize);
                textAlign(CENTER, CENTER);
                if (tree.on && leaf && !this.continuousScrolling){
                    postRecusionTasks.push(() => {
                        push();
                        noStroke();
                        fill(tree.on ? getPatchHighlightColor() : TEXT_COLOR_OFF);
                        textSize(leaf ? this.leafNodeTextSize : this.innerNodeTextSize);
                        textAlign(CENTER, CENTER);
                        
                        text(textValue, textPos.x, textPos.y);
                        pop();
                    });
                }
                else{
                    text(textValue, textPos.x, textPos.y);
                }
            }
            
            if (__debug){
                // show position of nodes
                fill(255, 0, 0);
                ellipse(horizontalOffset + tree.pos.x, tree.pos.y, 2, 2);
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

                    const linePos1 = createVector(horizontalOffset + tree.pos.x, yValues[0]);
                    const linePos2 = createVector(horizontalOffset + t.pos.x, yValues[1])

                    if ((linePos1.x < canvasWidth + this.lineThickness * 2
                        && linePos1.x > 0 - this.lineThickness * 2)
                        || (linePos2.x < canvasWidth + this.lineThickness * 2
                        && linePos2.x > 0 - this.lineThickness * 2))
                    {
                        line(linePos1.x, linePos1.y, linePos2.x, linePos2.y);
                    }
                }

                // draw highlighted line now (after all the others) so it's always on top
                if (highlightedLineIdx >= 0){
                    stroke(getPatchHighlightColor());
                    const yValues = this._calculateYCoordinatesForEdge(tree, tree.children[highlightedLineIdx], isLowerTree);

                    line(horizontalOffset + tree.pos.x, yValues[0], horizontalOffset + tree.children[highlightedLineIdx].pos.x, yValues[1]);
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
        const mult = isLowerTree ? -1 : 1;

        return [
            mult * this.innerNodeHeight / 2 + tree1.pos.y,
            - mult * (tree2.isLeaf() ? this.leafNodeHeight  : this.innerNodeHeight) / 2 + tree2.pos.y
        ];
    }
}