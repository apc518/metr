function getPatchHighlightColor(){
    return `hsl(${currentPatch.hue}, 100%, 50%)`;
}

const TEXT_COLOR_OFF = "hsl(0, 0%, 20%)"
const BOX_COLOR_OFF = "hsl(0, 0%, 30%)"
const BOX_COLOR_ON = "hsl(0, 0%, 50%)"
const VERTICAL_PADDING = 25;
const HORIZONTAL_PADDING = 30;


class MetricTreeDrawer{
    constructor({tree, depth, drawLeafNodes, leafNodeYPos, horizontalScale, displayUpsideDown, showLeafBoxes}){
        this.tree = tree;
        this.displayDepth = depth;
        this.drawLeafNodes = drawLeafNodes;
        this.leafNodeYPos = leafNodeYPos;
        this.horizontalScale = horizontalScale;
        this.displayUpsideDown = displayUpsideDown;
        this.showLeafBoxes = showLeafBoxes;
        
        this.totalMaxDepth = max(1, tree.getMaxDepth());
        this.leafProgressValues = Array.from(tree.getLeafNodeCyclePortionValues(), v => v * this.horizontalScale);

        this.lineThickness = 4;

        let leafCountForDisplay = tree.getLeafNodeCount() + 1;
        let layerHeight = (canvasHeight - 2 * VERTICAL_PADDING) / this.totalMaxDepth;

        this.textSizeValue = min(layerHeight * 1 / 4, 1.3 * canvasWidth / leafCountForDisplay) + 10;
        this.verticalSpacing = (layerHeight * 3 / 4) - (this.textSizeValue / this.totalMaxDepth);
        this.lineThickness = max(1, this.textSizeValue / 15);
    }

    draw(){
        this.leafCounter = 0;

        this._draw(this.tree, this.displayDepth, getGlobalProgress());
    }

    _draw(tree, depth, globalProgress){
        for (let i = 0; i < tree.children.length; i++){
            this._draw(tree.children[i], depth + 1, globalProgress);
        }

        if (this.displayTreeUpsideDown){
            tree.pos = {x: null, y: canvasHeight - (VERTICAL_PADDING + this.textSizeValue + depth * this.verticalSpacing)}
        }
        else{
            tree.pos = {x: null, y: (VERTICAL_PADDING + (this.textSizeValue / 2) + depth * this.verticalSpacing)}
        }

        const leaf = tree.isLeaf();

        const leafDisplayWidth = (canvasWidth - HORIZONTAL_PADDING) * ((this.leafProgressValues[this.leafCounter + 1] ?? this.horizontalScale) - this.leafProgressValues[this.leafCounter]);

        if (leaf){
            tree.pos.x = HORIZONTAL_PADDING / 2 + (canvasWidth - HORIZONTAL_PADDING) * (this.leafProgressValues[this.leafCounter] + (this.leafProgressValues[this.leafCounter + 1] ?? this.horizontalScale)) / 2;
            if (this.displayTreeUpsideDown){
                tree.pos.y = canvasHeight - (VERTICAL_PADDING + this.textSizeValue + this.totalMaxDepth * this.verticalSpacing);
            }
            else{
                tree.pos.y = (VERTICAL_PADDING + (this.textSizeValue / 2) + this.totalMaxDepth * this.verticalSpacing);
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

        if (depth <= this.totalMaxDepth - currentPatch.numLayersMuted){
            push();
            noStroke();

            if (leaf && this.showLeafBoxes){
                fill(tree.on ? BOX_COLOR_ON : BOX_COLOR_OFF);
                rect(tree.pos.x - (leafDisplayWidth / 2), tree.pos.y - this.textSizeValue + 20, leafDisplayWidth, this.textSizeValue);
            }

            fill(tree.on ? getPatchHighlightColor() : TEXT_COLOR_OFF);
            textSize(this.textSizeValue - (leaf ? 10 : 0));
            textAlign(CENTER, CENTER);
            let textValue = `${currentPatch.nodeNumberMode === "Leaves" ? `${(leaf ? 1 : tree.childrensTrueWidthSum())}${tree.ratio === 1 ? '' : `:${tree.getTrueWidth()}`}` : (tree.children.length > 0 ? tree.children.length : 1)}`
            text(textValue, tree.pos.x, tree.pos.y);
            // ellipse(tree.pos.x, tree.pos.y, 3, 3); // show anchor point of text
            pop();
        }
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
                    if (this.displayTreeUpsideDown){
                        line(tree.pos.x, tree.pos.y - (this.textSizeValue - (tree.getMaxDepth() === 1 ? 10 : 0)), t.pos.x, t.pos.y + this.textSizeValue / 5);
                    }
                    else{
                        line(tree.pos.x, tree.pos.y + (this.textSizeValue / 2), t.pos.x, t.pos.y - ((this.textSizeValue * 3 / 4) - (tree.getMaxDepth() === 1 ? 10 : 0)));
                    }
                }

                // draw highlighted line now (after all the others) so it's always on top
                if (highlightedLineIdx >= 0){
                    stroke(getPatchHighlightColor());
                    if (this.displayTreeUpsideDown){
                        line(tree.pos.x, tree.pos.y - (this.textSizeValue - (tree.getMaxDepth() === 1 ? 10 : 0)), tree.children[highlightedLineIdx].pos.x, tree.children[highlightedLineIdx].pos.y + this.textSizeValue / 5);
                    }
                    else{
                        line(tree.pos.x, tree.pos.y + this.textSizeValue / 2, tree.children[highlightedLineIdx].pos.x, tree.children[highlightedLineIdx].pos.y - ((this.textSizeValue * 3 / 4) - (tree.getMaxDepth() === 1 ? 10 : 0)));
                    }
                    pop();
                }
            }
        }

        if (leaf){
            this.leafCounter += 1;
        }

        return;
    }
}