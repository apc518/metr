"use strict";

// graphics constants
const CANVAS_WIDTH_DEFAULT = 1920;
const CANVAS_HEIGHT_DEFAULT = 800;
let canvasWidth = CANVAS_WIDTH_DEFAULT;
let canvasHeight = CANVAS_HEIGHT_DEFAULT;

// physics constants
const FRAMERATE = 60;

// other constants
const SPACE_KEYCODE = 32;

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

    tree = createMetricTreeFromNestedLists(
        BINARY_TREE
    )

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

let leafCounter = 0;
let totalLeaves = 0;

const VERTICAL_OFFSET = 50;
const VERTICAL_SPACING = 160;
const HORIZONTAL_OFFSET = 50;
const HORIZONTAL_SPACING = 50;
const TEXT_SIZE = 50;
const ON_COLOR = [255, 0, 255];
const OFF_COLOR = 100;
const LINE_THICKNESS = 4;

const NODE_MODE_TOTAL = true;

function drawMetricTree(tree, depth){
    let childCount = 0;
    
    for (let i = 0; i < tree.children.length; i++){
        childCount += drawMetricTree(tree.children[i], depth + 1, 20 * i + 20 * depth * i)
    }

    tree.pos = {x: null, y: VERTICAL_OFFSET + TEXT_SIZE + depth * VERTICAL_SPACING}

    let leaf = tree.children.length < 1;

    if (leaf){ 
        tree.pos.x = HORIZONTAL_OFFSET + HORIZONTAL_SPACING * leafCounter;
        tree.index = leafCounter;
        tree.on = leafCounter <= (globalProgress % 1) * totalLeaves && (globalProgress % 1) * totalLeaves < leafCounter + 1;

        let progressPerHit = 1 / totalLeaves;
        let floorMod = mod(globalProgress, progressPerHit);
        let ceilMod = progressPerHit - mod(globalProgress, progressPerHit);
        let distanceToIdeal = Math.min(floorMod, ceilMod);

        let distanceToIdealIsFromBelow = floorMod > ceilMod;

        let ideal = distanceToIdealIsFromBelow ? globalProgress + distanceToIdeal : globalProgress - distanceToIdeal;

        let lowerBound = ideal - progressIncrement / 2;
        let upperBound = ideal + progressIncrement / 2;

        if (lowerBound < globalProgress && globalProgress <= upperBound){
            console.log("hit!");
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

    noStroke();
    fill(tree.on ? ON_COLOR : OFF_COLOR);
    textSize(TEXT_SIZE);
    textAlign(CENTER);
    text(`${NODE_MODE_TOTAL ? (leaf ? 1 : childCount) : (tree.children.length > 0 ? tree.children.length : 1)}`, tree.pos.x, tree.pos.y);
    // ellipse(tree.pos.x, tree.pos.y, 20, 20);

    if (!leaf){
        noFill();
        strokeWeight(LINE_THICKNESS);
        tree.children.forEach(t => {
            stroke(t.on ? ON_COLOR : OFF_COLOR);
            line(tree.pos.x, tree.pos.y + TEXT_SIZE / 5, t.pos.x, t.pos.y - TEXT_SIZE);
        })
    }

    if (leaf){
        leafCounter += 1;
    }

    return leaf ? 1 : childCount;
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
    
    progressIncrement = smallestDivisionBPM / (FRAMERATE * totalLeaves * 60);
    
    globalProgress += progressIncrement;
}

function keyPressed(e){
    if (keyCode === SPACE_KEYCODE){
        playPause();
    }
}