"use strict";

// graphics constants
const CANVAS_WIDTH_DEFAULT = 1200;
const CANVAS_HEIGHT_DEFAULT = 800;
let canvasWidth = CANVAS_WIDTH_DEFAULT;
let canvasHeight = CANVAS_HEIGHT_DEFAULT;

// physics constants
const FRAMERATE = 60;

// other constants
const SPACE_KEYCODE = 32;

// patch value constants
const NODE_NUMBER_MODE_LEAVES = "node_number_mode_leaves";
const NODE_NUMBER_MODE_CHILDREN = "node_number_mode_children";

let p5canvas = null;
let tree = null;

function playPause(){
    if (isLooping()) pause_();
    else play_();
}


class MetricTree {
    constructor(){
        this.children = []
    }
}

function play_(){
    try{
        rootPr.playIfOnBounds();
    }catch(e){}
    
    loop();
}


function pause_(){
    noLoop();
}

function setup(){
    noLoop();
    p5canvas = createCanvas(canvasWidth, canvasHeight);
    p5canvas.parent(document.getElementById("p5canvas"));

    tree = createMetricTreeFromNestedLists(currentPatch.tree);

    paint();
}

// real mod, not javascripts default "remainder" operator %
const mod = (n, m) => (n % m + m) % m;

function createMetricTreeFromNestedLists(ls){
    let t = new MetricTree();
    ls.forEach(item => {
        t.children.push(createMetricTreeFromNestedLists(item));
    })

    return t;
}

function _getMetricTreeDepth(tree){
    if (tree.children.length < 1){
        return 0;
    }
    
    return 1 + max(Array.from(tree.children, t => _getMetricTreeDepth(t)));
}

function _getMetricTreeLeafNodeCount(tree){
    if (tree.children.length < 1){
        return 1;
    }

    let sum = 0;
    tree.children.forEach(t => sum += _getMetricTreeLeafNodeCount(t));

    return sum;
}

function _drawMetricTreeRecursive(tree, depth) {
    let leafCount = 0;
    
    for (let i = 0; i < tree.children.length; i++){
        leafCount += _drawMetricTreeRecursive(tree.children[i], depth + 1, 20 * i + 20 * depth * i)
    }

    tree.pos = {x: null, y: VERTICAL_PADDING + textSizeValue + depth * verticalSpacing}

    let leaf = tree.children.length < 1;

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
    fill(tree.on ? currentPatch.onColor : currentPatch.offColor);
    textSize(textSizeValue);
    textAlign(CENTER);
    text(`${currentPatch.nodeNumberMode === NODE_NUMBER_MODE_LEAVES ? (leaf ? 1 : leafCount) : (tree.children.length > 0 ? tree.children.length : 1)}`, tree.pos.x, tree.pos.y);
    // ellipse(tree.pos.x, tree.pos.y, 20, 20);

    if (!leaf){
        noFill();
        strokeWeight(lineThickness);
        tree.children.forEach(t => {
            stroke(t.on ? currentPatch.onColor : currentPatch.offColor);
            line(tree.pos.x, tree.pos.y + textSizeValue / 5, t.pos.x, t.pos.y - textSizeValue);
        })
    }

    if (leaf){
        leafCounter += 1;
    }

    return leaf ? 1 : leafCount;
}

let leafCounter = 0;
let totalLeaves = 0;

const VERTICAL_PADDING = 25;
const HORIZONTAL_PADDING = 50;
let verticalSpacing = 160;
let horizontalSpacing = 50;
let textSizeValue = 50;
let lineThickness = 4;

let currentPatch = {
    name: "LLS 11/16",
    nodeNumberMode: NODE_NUMBER_MODE_LEAVES,
    onColor: [255, 0, 255],
    offColor: [100, 100, 100],
    leafTempo: 500,
    tree: lls_11_16
}

function drawMetricTree(tree, depth){
    let totalDepth = _getMetricTreeDepth(tree);
    let leafCount = _getMetricTreeLeafNodeCount(tree);

    let layerHeight = (canvasHeight - 2 * VERTICAL_PADDING) / totalDepth
    verticalSpacing = layerHeight * 3 / 4;
    textSizeValue = min(layerHeight * 1 / 4, 1.3 * canvasWidth / leafCount);
    horizontalSpacing = (canvasWidth - 2 * HORIZONTAL_PADDING) / leafCount;
    lineThickness = max(1, textSizeValue / 15);
    
    _drawMetricTreeRecursive(tree, depth);
}


function paint(){
    background(0);

    leafCounter = 0;
    drawMetricTree(tree, 0);
    totalLeaves = leafCounter;
}

let globalProgress = 0; // 0 -> beginning, 1 -> one full cycle has passed, 2 -> two full cycles have passed, etc
let smallestDivisionBPM = 120;
let progressIncrement = 0;

function draw() {
    if (!p5canvas) return;
    if (!isLooping()) return;

    paint();
    
    progressIncrement = currentPatch.leafTempo / (FRAMERATE * totalLeaves * 60);
    
    globalProgress += progressIncrement;
}

function keyPressed(e){
    if (keyCode === SPACE_KEYCODE){
        playPause();
    }
}