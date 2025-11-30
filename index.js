"use strict";

// graphics constants
function computeCanvasWidth(){
    return document.body.clientWidth - document.getElementById("patchSettings").clientWidth;
}

function computeCanvasHeight(){
    return 0.9 * (document.body.clientHeight - document.getElementById("topBar").clientHeight - document.getElementById("bottomControlBar").clientHeight);
}

let canvasWidth;
let canvasHeight;

// physics constants
const FRAMERATE = 60;

// other constants
const SPACE_KEYCODE = 32;
const D_KEYCODE = 68;
const F_KEYCODE = 70;
const Z_KEYCODE = 90;
const CTRL_KEYCODE = 17;

let p5canvas = null;
let upperTree = null;
let lowerTree = null;
let treeDrawer = null;
let __debug = false;

function playPause(){
    if (isLooping()) pause_();
    else play_();
}

function epsilonFloor(num){
    return Math.floor(num + 0.0000001);
}

function getCycleDuration(tree){
    // depends on `upperTree.totalWidth` being accurate, which has to be set any time the tree changes (it is so in fullRefresh)
    return tree.totalWidth * 60 / currentPatch.leafTempo;

    // less stateful but takes around twice as long
    // return tree.getTrueWidth() * 60 / currentPatch.leafTempo;
}

function scheduleAllSounds(){
    const audioFilenames = Array.from(audioSampleOptions, a => a.filename);
    scheduleSounds(upperTree, audioFilenames.indexOf(currentPatch.audioSample.filename), currentPatch.upperTreePanning);
    if (lowerTree){
        scheduleSounds(lowerTree, audioFilenames.indexOf(currentPatch.lowerTreeAudioSample.filename), -1 * currentPatch.upperTreePanning);
    }
}

function play_(){
    if (isLooping()){
        console.error("play_() called while already playing");
        return;
    }
    console.log("playing")
    createSounds().then(() => {
        totalTimeSpentPausedUntilLastPlay += audioCtx.currentTime - audioCtxTimeLastPaused;
        
        scheduleAllSounds();
        loop();

        playPauseBtnIcon.src = "assets/images/pause.png";
    });
}

function pause_(){
    if (audioCtx){
        audioCtxTimeLastPaused = audioCtx.currentTime;
    }
    
    noLoop();
    playPauseBtnIcon.src = "assets/images/play.png";
}

function fullRefresh(){
    refreshCanvas();
    upperTree = createTreeFromMts(currentPatch.mtsUpper);
    lowerTree = currentPatch.mtsLower ? createTreeFromMts(currentPatch.mtsLower) : null;
    treeDrawer = new MetricTreeDrawer({
        upperTree: upperTree,
        lowerTree: currentPatch.lowerTreeActive ? lowerTree : null,
        depth: 0,
        drawLeafNodes: true,
        horizontalScale: currentPatch.horizontalScale ?? 1,
        showLeafBoxes: false,
        continuousScrolling: currentPatch.continuousScrolling ?? false
    });

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

let writePatchToUrlInterval;

function setup(){
    setPatchUIElementsFromCurrentPatch();
    noLoop();
    frameRate(FRAMERATE);
    setMtsInputFromCurrentPatch();
    setCanvasDimensions();
    fullRefresh();

    globalVolumeSlider.oninput();

    writePatchToUrlInterval = setInterval(writePatchToUrl, 100);

    window.addEventListener("popstate", () => {
        setPatchFromURL();
        setPatchUIElementsFromCurrentPatch();
        fullRefresh();
    });
    
    if (isDevelopmentEnvironment()){
        runTests();
        clearMtsErrorMessages();
    }
}

// real mod, not javascripts default "remainder" operator %
const mod = (n, m) => (n % m + m) % m;


function paint(){
    background(0);

    treeDrawer.draw();

    document.getElementById("upperTimeSigDisplay").innerText = upperTree ? upperTree.getTimeSignature() : "";
    document.getElementById("lowerTimeSigDisplay").innerText = lowerTree ? lowerTree.getTimeSignature() : "?";
}

function doFrame(){
    if (!p5canvas) return;
    if (!isLooping()) return;
    
    paint();
    scheduleAllSounds();
    
    document.getElementById("frameRateMonitor").innerText = `${Math.round(frameRate())}fps`;
}

// function `draw` is expected by p5js and called for each frame, but there's more to do on a frame than draw so I point it to `doFrame`
function draw() {
    doFrame();
}

function keyPressed(){
    if (document.activeElement.tagName !== "INPUT"){
        if (keyCode === SPACE_KEYCODE){
            playPause();
        }
        if (keyCode === F_KEYCODE){
            toggleFullscreen();
        }
        if (keyCode === D_KEYCODE){
            __debug = !__debug;
            paint();
        }
    }
}

function setCanvasDimensions(){
    canvasWidth = computeCanvasWidth();
    canvasHeight = computeCanvasHeight();
}

function windowResized(){
    setCanvasDimensions();
    p5canvas.resize(canvasWidth, canvasHeight);
    fullRefresh();
}
