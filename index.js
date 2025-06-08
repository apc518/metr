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

// patch value constants
const NODE_NUMBER_MODES = {
    leaves: "leaves",
    children: "children"
}

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
    return totalLeaves * 60 / currentPatch.leafTempo;
}

function framesPerCycle(){
    return FRAMERATE * cycleDuration();
}


// NOTE: if we add functionality to jump around while playing, we should re-call play_() when we do the jumps
function play_(){
    // calculate and set time offset based on globalProgress
    audioCtxTimeOffset = audioCtx.currentTime - globalProgress * cycleDuration();

    if (!isLooping()){
        scheduleInitialSounds();
    }
    
    loop();
    playPauseBtn.textContent = "Pause";
}


function pause_(){
    noLoop();
    playPauseBtn.textContent = "Play";
}


function fullRefresh(){
    setPatchUIElementsFromCurrentPatch();
    refreshCanvas();
    tree = new MetricTree(parseMts(currentPatch.tree));
    totalLeaves = tree.getLeafNodeCount();
    progressIncrement = currentPatch.leafTempo / (FRAMERATE * totalLeaves * 60);
    writePatchToUrl();
    if (isLooping()) play_();
    paint();
}

function refreshCanvas(){
    p5canvas = createCanvas(canvasWidth, canvasHeight);
    p5canvas.parent(document.getElementById("p5canvas"));
}

function setup(){
    noLoop();
    frameRate(FRAMERATE);
    fullRefresh();

    Swal.fire({ title: "Welcome to MeTr!", icon: 'info', text: "Click OK to enable audio" })
    .then(() => {
        createSounds();
        globalVolumeSlider.oninput();
    });

    
    if (isDevelopmentEnvironment()){
        runTests();
        setMtsErrorMessage("");
    }
}

// real mod, not javascripts default "remainder" operator %
const mod = (n, m) => (n % m + m) % m;


function _drawMetricTreeRecursive(tree, depth) {
    let leafCount = 0;
    
    for (let i = 0; i < tree.children.length; i++){
        leafCount += _drawMetricTreeRecursive(tree.children[i], depth + 1, 20 * i + 20 * depth * i)
    }

    tree.pos = {x: null, y: VERTICAL_PADDING + textSizeValue + depth * verticalSpacing}

    let leaf = tree.isLeaf();

    if (leaf){ 
        tree.pos.x = HORIZONTAL_PADDING + horizontalSpacing * leafCounter;
        tree.index = leafCounter;
        tree.on = leafCounter <= (globalProgress % 1) * totalLeaves && (globalProgress % 1) * totalLeaves < leafCounter + 1;
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

    noStroke();
    fill(tree.on ? getPatchHighlightColor(1, 0.5) : OFF_COLOR);
    textSize(textSizeValue);
    textAlign(CENTER);
    text(`${currentPatch.nodeNumberMode === NODE_NUMBER_MODES.leaves ? (leaf ? 1 : leafCount) : (tree.children.length > 0 ? tree.children.length : 1)}`, tree.pos.x, tree.pos.y);
    // ellipse(tree.pos.x, tree.pos.y, 20, 20);

    if (!leaf){
        noFill();
        strokeWeight(lineThickness);
        tree.children.forEach(t => {
            stroke(t.on ? getPatchHighlightColor(1, 0.5) : OFF_COLOR);
            line(tree.pos.x, tree.pos.y + textSizeValue / 5, t.pos.x, t.pos.y - textSizeValue);
        })
    }

    if (leaf){
        leafCounter += 1;
    }

    return leaf ? 1 : leafCount;
}

function getPatchHighlightColor(saturation, lightness){
    return `hsl(${currentPatch.hue}, ${saturation * 100}%, ${lightness * 100}%)`;
}

let leafCounter = 0;
let totalLeaves = 0;

const OFF_COLOR = "hsl(0, 0%, 30%)"
const VERTICAL_PADDING = 25;
const HORIZONTAL_PADDING = 50;
let verticalSpacing = 160;
let horizontalSpacing = 50;
let textSizeValue = 50;
let lineThickness = 4;


function drawMetricTree(tree, depth){
    let totalDepth = max(1, tree.getDepth());
    let leafCount = tree.getLeafNodeCount();

    let layerHeight = (canvasHeight - 2 * VERTICAL_PADDING) / totalDepth;
    textSizeValue = min(layerHeight * 1 / 4, 1.3 * canvasWidth / leafCount);
    verticalSpacing = (layerHeight * 3 / 4) - (textSizeValue / totalDepth);
    horizontalSpacing = (canvasWidth - 2 * HORIZONTAL_PADDING) / leafCount;
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

function keyPressed(e){
    if (keyCode === SPACE_KEYCODE){
        playPause();
    }
}

function windowResized(){
    canvasWidth = windowWidth - document.getElementById("patchSettings").clientWidth;
    p5canvas.resize(canvasWidth, canvasHeight);
    paint();
}
