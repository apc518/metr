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
let globalTree = null;

function playPause(){
    if (isLooping()) pause_();
    else play_();
}

function epsilonFloor(num){
    return Math.floor(num + 0.0000001);
}

function cycleDuration(){
    return globalTree.trueWidth() * 60 / currentPatch.leafTempo;
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
    globalTree = createTreeFromMts(currentPatch.mts);
    globalTree.pruneLeaves();
    totalLeaves = globalTree.getLeafNodeCount();
    progressIncrement = currentPatch.leafTempo / (FRAMERATE * globalTree.trueWidth() * 60);
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

let writePatchToUrlInterval;

function setup(){
    noLoop();
    frameRate(FRAMERATE);
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
        setMtsErrorMessage("");
    }
}

// real mod, not javascripts default "remainder" operator %
const mod = (n, m) => (n % m + m) % m;


function paint(){
    background(0);

    leafCounter = 0;
    drawMetricTree(globalTree, 0);

    document.getElementById("timeSigDisplay").innerText = globalTree.getTimeSignature();
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
    if (document.activeElement.tagName !== "INPUT"){
        if (keyCode === SPACE_KEYCODE){
            playPause();
        }
        if (keyCode === F_KEYCODE){
            toggleFullscreen();
        }
    }
}

function windowResized(){
    canvasWidth = windowWidth - document.getElementById("patchSettings").clientWidth;
    p5canvas.resize(canvasWidth, canvasHeight);
    fullRefresh();
}
