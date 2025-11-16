const textFieldErrorColorLight = "#f88";
const textFieldOkayColorLight = "#fff";
const textFieldErrorColorDark = "#811";
const textFieldOkayColorDark = "#111";


const mainDiv = document.getElementsByTagName("main");


function setPatchParamFromNumberInput(paramName, elem, func=(n => n)){
    if (typeof elem.valueAsNumber === "number" && !isNaN(elem.valueAsNumber)){
        setPatchParam(paramName, func(elem.valueAsNumber));
        elem.style.backgroundColor = textFieldOkayColorDark;
    }
    else{
        elem.style.backgroundColor = textFieldErrorColorDark;
    }
}


//////////////////
//  MTS INPUT   //
//////////////////

const upperMtsInput = document.getElementById("upperMtsInput");
const lowerMtsInput = document.getElementById("lowerMtsInput");
const upperMtsErrorMessage = document.getElementById("upperMtsError");
const lowerMtsErrorMessage = document.getElementById("lowerMtsError");

const lowerTreeToggle = document.getElementById("lowerTreeToggle");
lowerTreeToggle.checked = false;
lowerTreeToggle.oninput = () => {
    lowerTreeTopBar.style.display = lowerTreeToggle.checked ? "flex" : "none";
}

const lowerTreeTopBar = document.getElementById("lowerTreeTopBar");
lowerTreeTopBar.style.display = lowerTreeToggle.checked ? "flex" : "none";


upperMtsInput.oninput = () => {
    try{
        const newTree = createTreeFromMts(upperMtsInput.value);
        upperTree = newTree;
        setMtsErrorMessage(upperMtsInput, upperMtsErrorMessage, "");
        setPatchParam("mtsUpper", upperMtsInput.value);
        setLeafTempoBasedOnDisplayTempo();
        if (p5canvas){
            fullRefresh();
        }
    }
    catch (e){
        console.log("hello there");
        setMtsErrorMessage(upperMtsInput, upperMtsErrorMessage, e.message);
        if (e.message.slice(0, SYNTAX_ERROR_MESSAGE_PREFIX.length) !== SYNTAX_ERROR_MESSAGE_PREFIX){
            console.error(e);
        }
    }
}

lowerMtsInput.oninput = () => {
    try{
        const newTree = createTreeFromMts(lowerMtsInput.value);
        lowerTree = newTree;
        setMtsErrorMessage(lowerMtsInput, lowerMtsErrorMessage, "");
        setPatchParam("mtsLower", lowerMtsInput.value);
        setLeafTempoBasedOnDisplayTempo();
        if (p5canvas){
            fullRefresh();
        }
    }
    catch (e){
        setMtsErrorMessage(lowerMtsInput, lowerMtsErrorMessage, e.message);
        if (e.message.slice(0, SYNTAX_ERROR_MESSAGE_PREFIX.length) !== SYNTAX_ERROR_MESSAGE_PREFIX){
            console.error(e);
        }
    }
}

function setMtsInputFromCurrentPatch(){
    upperMtsInput.value = currentPatch.mtsUpper;
    lowerMtsInput.value = currentPatch.mtsLower;
    lowerTreeTopBar.style.display = currentPatch.mtsLower?.length > 0 ? "flex" : "none";
    lowerTreeToggle.checked = !!(currentPatch.mtsLower?.length > 0);
}

function setMtsErrorMessage(inputElem, errorElem, s){
    errorElem.textContent = s.slice(SYNTAX_ERROR_MESSAGE_PREFIX.length);
    inputElem.style.backgroundColor = s.length === 0 ? textFieldOkayColorLight : textFieldErrorColorLight;
}

function clearMtsErrorMessages(){
    setMtsErrorMessage(upperMtsInput, upperMtsErrorMessage, "");
    setMtsErrorMessage(lowerMtsInput, lowerMtsErrorMessage, "");
}



///////////////////////
//  Preset Selection //
///////////////////////

const presetSelectDropdown = document.getElementById("presetSelectDropdown");

presetSelectDropdown.oninput = () => {
    for (let i = 0; i < presets.length; i++){
        if (presets[i].name === presetSelectDropdown.children[presetSelectDropdown.selectedIndex].value){
            currentPatch = deepCopy(presets[i]);
            fullRefresh();
            setPatchUIElementsFromCurrentPatch();
            break;
        }
    }

    trySelectPreset();
}

function populatepresetSelectDropdown(){
    presetSelectDropdown.replaceChildren([]);
    for (let preset of presets){
        let elem = document.createElement("option");
        elem.value = preset.name;
        elem.text = preset.name;

        presetSelectDropdown.appendChild(elem);
    }
}

populatepresetSelectDropdown();

function setPresetDisplayNames(){
    for (let i = 0; i < presetSelectDropdown.children.length; i++){
        if (i === presetSelectDropdown.selectedIndex){
            presetSelectDropdown.children[i].text = "*" + presets[i].name;
        }
        else{
            presetSelectDropdown.children[i].text = presets[i].name;
        }
    }
}



//////////////////////
//  TEMPO SETTING   //
//////////////////////

const tempoInput = document.getElementById("tempoInput");
tempoInput.oninput = () => {
    setPatchParamFromNumberInput("leafTempo", tempoInput, calculateLeafTempo);
    fullRefresh();
}

const displayTempoDropdown = document.getElementById("displayTempoDropdown");
for (let option of displayTempoOptions){
    let elem = document.createElement('option');
    elem.value = option;
    elem.innerText = option;
    displayTempoDropdown.appendChild(elem);
}

function setLeafTempoBasedOnDisplayTempo(){
    setPatchParamFromNumberInput("leafTempo", tempoInput, calculateLeafTempo);
}

displayTempoDropdown.oninput = () => {
    setPatchParam("displayTempoMode", displayTempoOptions[displayTempoDropdown.selectedIndex]);
    setLeafTempoBasedOnDisplayTempo();
    fullRefresh();
}

function calculateLeafTempo(displayTempoValue){
    const tree = createTreeFromMts(currentPatch.mtsUpper);
    const trueWidths = tree.getChildrensTrueWidths();
    if (currentPatch.displayTempoMode === "Largest Beat"){
        let maxBeatSize = 0;
        for (let count of trueWidths){
            maxBeatSize = Math.max(maxBeatSize, count);
        }
        return displayTempoValue * maxBeatSize;
    }
    else if (currentPatch.displayTempoMode === "Smallest Beat"){
        let minBeatSize = Infinity;
        for (let count of trueWidths){
            minBeatSize = Math.min(minBeatSize, count);
        }
        return displayTempoValue * minBeatSize;
    }
    else{
        return displayTempoValue;
    }
}

function calculateDisplayTempo(){
    const tree = createTreeFromMts(currentPatch.mtsUpper ? currentPatch.mtsUpper : currentPatch.mtsLower);
    const trueWidths = tree.getChildrensTrueWidths();
    let returnValue = null;
    if (currentPatch.displayTempoMode === "Largest Beat"){
        let maxBeatSize = 0;
        for (let count of trueWidths){
            maxBeatSize = Math.max(maxBeatSize, count);
        }
        returnValue = (currentPatch.leafTempo / maxBeatSize);
    }
    else if (currentPatch.displayTempoMode === "Smallest Beat"){
        let minBeatSize = Infinity;
        for (let count of trueWidths){
            minBeatSize = Math.min(minBeatSize, count);
        }
        returnValue = currentPatch.leafTempo / minBeatSize;
    }
    else{
        returnValue = currentPatch.leafTempo;
    }

    if (Math.abs(returnValue - Math.round(returnValue)) < 0.000001){
        return Math.round(returnValue);
    }

    return returnValue;
}

function setTempoInputFromCurrentPatch(){
    tempoInput.value = calculateDisplayTempo();
}

function setTempoDisplayModeFromCurrentPatch(){
    displayTempoDropdown.selectedIndex = displayTempoOptions.indexOf(currentPatch.displayTempoMode);
}

/////////////////////////////
//  CLICK SOUND SETTINGS   //
/////////////////////////////

const accentDownbeatCheckbox = document.getElementById("accentDownbeatCheckbox");
const pitchesHighToLowCheckbox = document.getElementById("pitchesHighToLowCheckbox");
accentDownbeatCheckbox.oninput = () => {
    setPatchParam("accentDownbeat", accentDownbeatCheckbox.checked);
}
pitchesHighToLowCheckbox.oninput = () => {
    setPatchParam("pitchesHighToLow", pitchesHighToLowCheckbox.checked);
}

const pitchSpreadInput = document.getElementById("pitchSpreadInput");
const volumeFalloffInput = document.getElementById("volumeFalloffInput");
pitchSpreadInput.oninput = () => {
    setPatchParamFromNumberInput("pitchSpread", pitchSpreadInput);
}
volumeFalloffInput.oninput = () => {
    setPatchParamFromNumberInput("volumeFalloff", volumeFalloffInput);
}

const audioSampleDropdown = document.getElementById("audioSampleDropdown");
for (let option of audioSampleOptions){
    let elem = document.createElement('option');
    elem.value = option.filename;
    elem.innerText = option.displayName;
    audioSampleDropdown.appendChild(elem);
}
audioSampleDropdown.oninput = () => {
    setPatchParam("audioSample", audioSampleOptions[audioSampleDropdown.selectedIndex]);
}

const numLayersMutedInput = document.getElementById("numLayersMutedInput");
numLayersMutedInput.oninput = () => {
    if (numLayersMutedInput.value > upperTree.getMaxDepth()){
        numLayersMutedInput.value = upperTree.getMaxDepth();
    }
    setPatchParamFromNumberInput("numLayersMuted", numLayersMutedInput);
    paint();
}

function setClickSoundSettingsFromCurrentPatch(){
    accentDownbeatCheckbox.checked = currentPatch.accentDownbeat;
    pitchesHighToLowCheckbox.checked = currentPatch.pitchesHighToLow;
    pitchSpreadInput.value = currentPatch.pitchSpread;
    volumeFalloffInput.value = currentPatch.volumeFalloff;
    numLayersMutedInput.value = currentPatch.numLayersMuted;

    for (let i = 0; i < audioSampleDropdown.children.length; i++){
        if (audioSampleDropdown.children[i].value === currentPatch.audioSample.filename){
            audioSampleDropdown.selectedIndex = i;
            break;
        }
    }
}



/////////////////////////////////
//  NODE NUMBER MODE SETTING   //
/////////////////////////////////

const nodeNumberModeLeaves = document.getElementById("nodeNumberModeLeaves");
const nodeNumberModeChildren = document.getElementById("nodeNumberModeChildren");

nodeNumberModeLeaves.onclick = () => {
    nodeNumberModeLeaves.className = "nodeNumberModeOption nodeNumberModeOptionSelected";
    nodeNumberModeChildren.className = "nodeNumberModeOption";
    setPatchParam("nodeNumberMode", "Leaves");
    if(p5canvas)
        paint();
}

nodeNumberModeChildren.onclick = () => {
    nodeNumberModeChildren.className = "nodeNumberModeOption nodeNumberModeOptionSelected";
    nodeNumberModeLeaves.className = "nodeNumberModeOption";
    setPatchParam("nodeNumberMode", "Children");
    if (p5canvas)
        paint();
}

function setNumberModeInputFromCurrentPatch(){
    if (currentPatch.nodeNumberMode === "Leaves"){
        nodeNumberModeLeaves.onclick();
    }
    else{
        nodeNumberModeChildren.onclick();
    }
}



//////////////
//  COLOR   //
//////////////

const hueInput = document.getElementById("hueInput");
const hueInputCursor = document.getElementById("hueInputCursor");

function setColorInputsFromCurrentPatch(){
    const hueInputWidth = hueInput.getBoundingClientRect().width;
    hueInputCursor.style.marginLeft = `${Math.round(hueInputWidth * currentPatch.hue / 360)}px`;
}

let changingHue = false;

hueInput.onmousedown = e => {
    changingHue = true;
}

window.onmouseup = () => {
    changingHue = false;
}

hueInput.onmousemove = e => {
    if (changingHue){
        changeHue(e);
    }
}


hueInput.onclick = e => {
    changeHue(e);
}

function changeHue(e){
    const hueInputX = hueInput.getBoundingClientRect().x;
    const hueInputWidth = hueInput.getBoundingClientRect().width;
    hueInputCursor.style.marginLeft = `${Math.min(hueInputWidth, e.clientX - hueInputX)}px`;
    setPatchParam("hue", Math.round(360 * (e.clientX - hueInputX) / hueInputWidth));
    if (!isLooping()) {
        paint();
    }
}


//////////////////////////
// CONTINUOUS SCROLLING //
//////////////////////////

const continuousScrollingCheckbox = document.getElementById("continuousScrollingCheckbox");

continuousScrollingCheckbox.oninput = () => {
    treeDrawer.continuousScrolling = continuousScrollingCheckbox.checked;
    paint();
}



/////////////////////////
//  PLAYBACK CONTROLS  //
/////////////////////////

const playPauseBtn = document.getElementById("playPauseBtn");
const playPauseBtnIcon = document.getElementById("playPauseBtnIcon");
const resetBtn = document.getElementById("resetBtn");

playPauseBtn.onclick = () => {
    playPauseBtn.blur();
    playPause();
}

resetBtn.onclick = () => {
    resetBtn.blur();
    pause_();
    resetAudio();
    totalTimeSpentPausedUntilLastPlay = 0;
    fullRefresh();
}

const volumeIcon = document.getElementById("volumeIcon");
const globalVolumeSlider = document.getElementById("globalVolumeSlider");
globalVolumeSlider.oninput = () => {
    if (globalVolumeSlider.valueAsNumber > 50){
        volumeIcon.src = "assets/images/volume_high_white.png";
    }
    else if (globalVolumeSlider.valueAsNumber > 0){
        volumeIcon.src = "assets/images/volume_low_white.png";
    }
    else{
        volumeIcon.src = "assets/images/volume_off_white.png";
    }
    doVolumeInput();
}

const logb = (base, x) => {
    return Math.log(x) / Math.log(base);
}

function convertSliderValueToAmplitude(sliderVal) {
    // use exponential scale to go from 0 to 1 so the volume slider feels more natural
    const tension = 10; // how extreme the curve is (higher = more extreme, slower start faster end)
    const n = 1 / (1 - logb(1 / tension, 1 + (1 / tension)));         
    const val = Math.pow(1 / tension, 1 - ((sliderVal * 1.25) / 100) / n) - 1 / tension;
    return val;
}

function doVolumeInput() {
    const val = convertSliderValueToAmplitude(globalVolumeSlider.valueAsNumber);
    globalVolume = val;
}

function toggleFullscreen(){
    if (mainDiv.hidden){
        mainDiv.hidden = false;
        canvasHeight = CANVAS_HEIGHT_DEFAULT;
        windowResized();
        refreshCanvas();
        paint();
    }
    else {
        mainDiv.hidden = true;
        canvasWidth = document.body.getBoundingClientRect().width;
        canvasHeight = window.innerHeight;
        refreshCanvas();
        paint();
    }
}



/////////////////////////
//  SET EVERYTHING UP  //
/////////////////////////

function setPatchUIElementsFromCurrentPatch(){
    setClickSoundSettingsFromCurrentPatch();
    setColorInputsFromCurrentPatch();
    setMtsInputFromCurrentPatch();
    setNumberModeInputFromCurrentPatch();
    setTempoInputFromCurrentPatch();
    setTempoDisplayModeFromCurrentPatch();
    setPresetDisplayNames();
    trySelectPreset();
}
