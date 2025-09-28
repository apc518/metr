"use strict";

// graphics constants
const CANVAS_WIDTH_DEFAULT = document.body.clientWidth - document.getElementById("patchSettings").clientWidth;
const CANVAS_HEIGHT_DEFAULT = 700;
let canvasWidth = CANVAS_WIDTH_DEFAULT;
let canvasHeight = CANVAS_HEIGHT_DEFAULT;

// physics constants
const FRAMERATE = 60;

// other constants
const SPACE_KEYCODE = 32;
const F_KEYCODE = 70;
const Z_KEYCODE = 90;
const CTRL_KEYCODE = 17;

let p5canvas = null;
let tree = null;

function playPause(){
    if (isLooping()) pause_();
    else play_();
}

function epsilonFloor(num){
    return Math.floor(num + 0.0000001);
}

function cycleDuration(){
    return tree.trueWidth() * 60 / currentPatch.leafTempo;
}

function framesPerCycle(){
    return FRAMERATE * cycleDuration();
}


// NOTE: if we add functionality to jump around while playing, we should re-call play_() when we do the jumps
function play_(){
    createSounds().then(() => {
        // calculate and set time offset based on globalProgress
        audioCtxTimeOffset = audioCtx.currentTime - globalProgress * cycleDuration();
    
        if (!isLooping()){
            scheduleInitialSounds();
        }
        
        loop();
        playPauseBtnIcon.src = "assets/images/pause.png";
    });
}


function pause_(){
    noLoop();
    playPauseBtnIcon.src = "assets/images/play.png";
}


function fullRefresh(){
    setMtsErrorMessage("");
    refreshCanvas();
    // tree = new MetricTree(parseMts(currentPatch.mts));
    tree = makeTree();
    tree.pruneLeaves();
    totalLeaves = tree.getLeafNodeCount();
    progressIncrement = currentPatch.leafTempo / (FRAMERATE * tree.trueWidth() * 60);
    if (isLooping()) play_();
    paint();
}

function refreshCanvas(){
    p5canvas = createCanvas(canvasWidth, canvasHeight);
    if (mainDiv.hidden){
        p5canvas.parent(document.body);
    }
    else{
        p5canvas.parent(document.getElementById("p5canvas"));
    }
}

function setup(){
    noLoop();
    frameRate(FRAMERATE);
    fullRefresh();

    globalVolumeSlider.oninput();

    setInterval(writePatchToUrl, 100);

    window.addEventListener("popstate", () => {
        setPatchFromURL();
        setPatchUIElementsFromCurrentPatch();
        fullRefresh();
    });
    
    if (isDevelopmentEnvironment()){
        // console.log(makeTree());
        // runTests();
        setMtsErrorMessage("");
    }
}

// real mod, not javascripts default "remainder" operator %
const mod = (n, m) => (n % m + m) % m;


function _drawMetricTreeRecursive(tree, depth) {
    let leafCount = 0;

    for (let i = 0; i < tree.children.length; i++){
        leafCount += _drawMetricTreeRecursive(tree.children[i], depth + 1, totalDepth);
    }

    tree.pos = {x: null, y: VERTICAL_PADDING + textSizeValue + depth * verticalSpacing}

    let leaf = tree.isLeaf();

    if (leaf){ 
        tree.pos.x = canvasWidth * (leafProgressValues[leafCounter] + (leafProgressValues[leafCounter + 1] ?? 1)) / 2;
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
        let textValue = `${currentPatch.nodeNumberMode === "Leaves" ? `${(leaf ? 1 : tree.childrensTrueWidthSum())}${tree.ratio === 1 ? '' : `:${tree.childrensTrueWidthSum() / tree.ratio}`}` : (tree.children.length > 0 ? tree.children.length : 1)}`
        text(textValue, tree.pos.x, tree.pos.y);
        ellipse(tree.pos.x, tree.pos.y, 3, 3);
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

function getPatchHighlightColor(){
    return `hsl(${currentPatch.hue}, 100%, 50%)`;
}

let leafCounter = 0;
let totalLeaves = 0;

const OFF_COLOR = "hsl(0, 0%, 30%)"
const VERTICAL_PADDING = 25;
let verticalSpacing = 160;
let horizontalSpacing = 50;
let textSizeValue = 50;
let lineThickness = 4;
let totalDepth = 1;
let leafProgressValues = [];


function drawMetricTree(tree, depth){
    totalDepth = max(1, tree.getDepth());
    leafProgressValues = tree.getLeafNodeCyclePortionValues();

    let leafCountForDisplay = tree.getLeafNodeCount() + 1;
    let layerHeight = (canvasHeight - 2 * VERTICAL_PADDING) / totalDepth;

    textSizeValue = min(layerHeight * 1 / 4, 1.3 * canvasWidth / leafCountForDisplay);
    verticalSpacing = (layerHeight * 3 / 4) - (textSizeValue / totalDepth);
    horizontalSpacing = (canvasWidth - 2) / leafCountForDisplay;
    lineThickness = max(1, textSizeValue / 15);

    
    _drawMetricTreeRecursive(tree, depth);
}


function paint(){
    background(0);

    leafCounter = 0;
    drawMetricTree(tree, 0);

    document.getElementById("timeSigDisplay").innerText = tree.getTimeSignature();
}

let globalProgress = 0; // 0 -> beginning, 1 -> one full cycle has passed, 2 -> two full cycles have passed, etc
let progressIncrement = 0;

function draw() {
    if (!p5canvas) return;
    if (!isLooping()) return;

    paint();

    scheduleSounds();

    globalProgress += progressIncrement;
}

function keyPressed(){
    if (keyCode === SPACE_KEYCODE){
        playPause();
    }
    if (keyCode === F_KEYCODE){
        toggleFullscreen();
    }
}

function windowResized(){
    canvasWidth = windowWidth - document.getElementById("patchSettings").clientWidth;
    p5canvas.resize(canvasWidth, canvasHeight);
    fullRefresh();
}
