const textFieldErrorColorLight = "#f88";
const textFieldOkayColorLight = "#fff";
const textFieldErrorColorDark = "#811";
const textFieldOkayColorDark = "#111";


const mainDiv = document.getElementById("main");

let displaySettingsApplyToUpperTree = true;

function displaySettingsUpper(){
    return displaySettingsApplyToUpperTree || (!currentPatch.lowerTreeActive);
}


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
lowerTreeToggle.checked = !!currentPatch.lowerTreeActive;
lowerTreeToggle.oninput = () => {
    lowerTreeTopBar.style.display = lowerTreeToggle.checked ? "flex" : "none";
    currentPatch.lowerTreeActive = !!lowerTreeToggle.checked;
    setClickSoundSettingsFromCurrentPatch();
    windowResized();
}

const lowerTreeTopBar = document.getElementById("lowerTreeTopBar");
lowerTreeTopBar.style.display = currentPatch.lowerTreeActive ? "flex" : "none";


function handleMtsInput(inputElem, isLower, errorMessageElem){
    const paramName = "mts" + (isLower ? "Lower" : "Upper")
    try{
        const newTree = createTreeFromMts(inputElem.value);
        upperTree = newTree;
        setMtsErrorMessage(inputElem, errorMessageElem, "");
        setPatchParam(paramName, inputElem.value);
        setLeafTempoBasedOnDisplayTempo();
        if (p5canvas){
            fullRefresh();
        }
    }
    catch (e){
        setMtsErrorMessage(inputElem, errorMessageElem, e.message);
        if (e.message.slice(0, SYNTAX_ERROR_MESSAGE_PREFIX.length) !== SYNTAX_ERROR_MESSAGE_PREFIX){
            console.error(e);
        }
    }
}


upperMtsInput.oninput = () => {
    handleMtsInput(upperMtsInput, false, upperMtsErrorMessage);
}

lowerMtsInput.oninput = () => {
    handleMtsInput(lowerMtsInput, true, lowerMtsErrorMessage);
}

function setMtsInputFromCurrentPatch(){
    upperMtsInput.value = currentPatch.mtsUpper;
    lowerMtsInput.value = currentPatch.mtsLower;
    lowerTreeTopBar.style.display = !!currentPatch.lowerTreeActive ? "flex" : "none";
    lowerTreeToggle.checked = !!currentPatch.lowerTreeActive;

    upperLowerDisplaySettingsToggleContainer.style.display = !!currentPatch.lowerTreeActive ? "block" : "none";
}

function setMtsErrorMessage(inputElem, errorElem, s){
    if (s.slice(0, SYNTAX_ERROR_MESSAGE_PREFIX.length) === SYNTAX_ERROR_MESSAGE_PREFIX){
        errorElem.textContent = s.slice(SYNTAX_ERROR_MESSAGE_PREFIX.length);
    }
    else {
        errorElem.textContent = s;
        
        if (s.length > 0){
            Swal.fire({
                icon: "info",
                text: "This error is unexpected; please copy the text you have entered to cause this and send it to Andy!"
            });
        }
    }
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


////////////////////////////////////////////
// UPPER VS LOWER DISPLAY SETTINGS TOGGLE //
////////////////////////////////////////////

const upperLowerDisplaySettingsToggleContainer = document.getElementById("upperLowerDisplaySettingsToggleContainer");
const displaySettingsUpperToggle = document.getElementById("displaySettingsUpperToggle");
const displaySettingsLowerToggle = document.getElementById("displaySettingsLowerToggle");

displaySettingsUpperToggle.onclick = () => {
    displaySettingsUpperToggle.className = "nodeNumberModeOption nodeNumberModeOptionSelected";
    displaySettingsLowerToggle.className = "nodeNumberModeOption";
    displaySettingsApplyToUpperTree = true;
    setClickSoundSettingsFromCurrentPatch();
    if(p5canvas)
        paint();
}

displaySettingsLowerToggle.onclick = () => {
    displaySettingsLowerToggle.className = "nodeNumberModeOption nodeNumberModeOptionSelected";
    displaySettingsUpperToggle.className = "nodeNumberModeOption";
    displaySettingsApplyToUpperTree = false;
    setClickSoundSettingsFromCurrentPatch();
    if (p5canvas)
        paint();
}

function setUpperLowerDisplaySettingsToggleInputFromCurrentPatch(){
    displaySettingsUpperToggle.onclick();
}


/////////////////////////////
//  CLICK SOUND SETTINGS   //
/////////////////////////////

const accentDownbeatCheckbox = document.getElementById("accentDownbeatCheckbox");
const pitchesHighToLowCheckbox = document.getElementById("pitchesHighToLowCheckbox");
accentDownbeatCheckbox.oninput = () => {
    setPatchParam(displaySettingsUpper() ? "accentDownbeat" : "lowerTreeAccentDownbeat", accentDownbeatCheckbox.checked);
}
pitchesHighToLowCheckbox.oninput = () => {
    setPatchParam(displaySettingsUpper() ? "pitchesHighToLow" : "lowerTreePitchesHighToLow", pitchesHighToLowCheckbox.checked);
}

const pitchSpreadInput = document.getElementById("pitchSpreadInput");
const volumeFalloffInput = document.getElementById("volumeFalloffInput");
pitchSpreadInput.oninput = () => {
    setPatchParamFromNumberInput(displaySettingsUpper() ? "pitchSpread" : "lowerTreePitchSpread", pitchSpreadInput);
}
volumeFalloffInput.oninput = () => {
    setPatchParamFromNumberInput(displaySettingsUpper() ? "volumeFalloff" : "lowerTreeVolumeFalloff", volumeFalloffInput);
}

const audioSampleDropdown = document.getElementById("audioSampleDropdown");
for (let option of audioSampleOptions){
    let elem = document.createElement('option');
    elem.value = option.filename;
    elem.innerText = option.displayName;
    audioSampleDropdown.appendChild(elem);
}
audioSampleDropdown.oninput = () => {
    setPatchParam(displaySettingsUpper() ? "audioSample" : "lowerTreeAudioSample", audioSampleOptions[audioSampleDropdown.selectedIndex]);
}

// const lowerTreeAudioSampleDropdown = document.getElementById("lowerTreeAudioSampleDropdown");
// for (let option of audioSampleOptions){
//     let elem = document.createElement('option');
//     elem.value = option.filename;
//     elem.innerText = option.displayName;
//     lowerTreeAudioSampleDropdown.appendChild(elem);
// }
// lowerTreeAudioSampleDropdown.oninput = () => {
//     setPatchParam(displaySettingsUpper() ? "lowerTreeAudioSample" : "", audioSampleOptions[lowerTreeAudioSampleDropdown.selectedIndex]);
// }

// const lowerTreeAudioSampleDropdownContainer = document.getElementById("lowerTreeAudioSampleDropdownContainer");

const numLayersMutedInput = document.getElementById("numLayersMutedInput");
numLayersMutedInput.oninput = () => {
    if (numLayersMutedInput.value > upperTree.getMaxDepth()){
        numLayersMutedInput.value = upperTree.getMaxDepth();
    }
    setPatchParamFromNumberInput(displaySettingsUpper() ? "numLayersMuted" : "lowerTreeNumLayersMuted", numLayersMutedInput);
    paint();
}

function setClickSoundSettingsFromCurrentPatch(){
    if (!currentPatch.lowerTreeAudioSample)
        currentPatch.lowerTreeAudioSample = JSON.parse(JSON.stringify(currentPatch.audioSample));
    if (typeof currentPatch.lowerTreeAccentDownbeat !== "boolean")
        currentPatch.lowerTreeAccentDownbeat = currentPatch.accentDownbeat;
    if (typeof currentPatch.lowerTreePitchesHighToLow !== "boolean")
        currentPatch.lowerTreePitchesHighToLow = currentPatch.pitchesHighToLow;
    if (typeof currentPatch.lowerTreePitchSpread !== "number")
        currentPatch.lowerTreePitchSpread = currentPatch.pitchSpread;
    if (typeof currentPatch.lowerTreeVolumeFalloff !== "number")
        currentPatch.lowerTreeVolumeFalloff = currentPatch.volumeFalloff;
    if (typeof currentPatch.lowerTreeNodeNumberMode !== "string")
        currentPatch.lowerTreeNodeNumberMode = currentPatch.nodeNumberMode;

    accentDownbeatCheckbox.checked = displaySettingsUpper() ? currentPatch.accentDownbeat : currentPatch.lowerTreeAccentDownbeat;
    pitchesHighToLowCheckbox.checked = displaySettingsUpper() ? currentPatch.pitchesHighToLow : currentPatch.lowerTreePitchesHighToLow;
    pitchSpreadInput.value = displaySettingsUpper() ? currentPatch.pitchSpread : currentPatch.lowerTreePitchSpread;
    volumeFalloffInput.value = displaySettingsUpper() ? currentPatch.volumeFalloff : currentPatch.lowerTreeVolumeFalloff;
    numLayersMutedInput.value = currentPatch.numLayersMuted;

    for (let i = 0; i < audioSampleDropdown.children.length; i++){
        if (audioSampleDropdown.children[i].value === (displaySettingsUpper() ? currentPatch.audioSample : currentPatch.lowerTreeAudioSample).filename){
            audioSampleDropdown.selectedIndex = i;
            break;
        }
    }

    setMtsInputFromCurrentPatch();
    setNumberModeInputFromCurrentPatch();
}



/////////////////////////////////
//  NODE NUMBER MODE SETTING   //
/////////////////////////////////

const nodeNumberModeLeaves = document.getElementById("nodeNumberModeLeaves");
const nodeNumberModeChildren = document.getElementById("nodeNumberModeChildren");

nodeNumberModeLeaves.onclick = () => {
    nodeNumberModeLeaves.className = "nodeNumberModeOption nodeNumberModeOptionSelected";
    nodeNumberModeChildren.className = "nodeNumberModeOption";
    setPatchParam(displaySettingsUpper() ? "nodeNumberMode" : "lowerTreeNodeNumberMode", "Leaves");
    if(p5canvas)
        paint();
}

nodeNumberModeChildren.onclick = () => {
    nodeNumberModeChildren.className = "nodeNumberModeOption nodeNumberModeOptionSelected";
    nodeNumberModeLeaves.className = "nodeNumberModeOption";
    setPatchParam(displaySettingsUpper() ? "nodeNumberMode" : "lowerTreeNodeNumberMode", "Children");
    if (p5canvas)
        paint();
}

function setNumberModeInputFromCurrentPatch(){
    if ((displaySettingsUpper() ? currentPatch.nodeNumberMode : currentPatch.lowerTreeNodeNumberMode) === "Leaves"){
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
    currentPatch.continuousScrolling = continuousScrollingCheckbox.checked;
    fullRefresh();
}

function setContinuousScrollingInputFromCurrentPatch(){
    continuousScrollingCheckbox.checked = currentPatch.continuousScrolling;
}


//////////////////////
// HORIZONTAL SCALE //
//////////////////////

const horizontalScaleSliderMultiplier = 20 / 3;
const horizontalScaleSliderExponent = 3;
const horizontalScaleSliderOffset = 1 / 6;

function convertHorizontalScaleValueToSliderPortion(s){
    return Math.pow((s - horizontalScaleSliderOffset) / horizontalScaleSliderMultiplier, 1/horizontalScaleSliderExponent);
}

function convertSliderPortionToHorizontalScaleValue(s){
    return horizontalScaleSliderMultiplier * Math.pow(s, horizontalScaleSliderExponent) + horizontalScaleSliderOffset;
}

const horizontalScaleSlider = document.getElementById("horizontalScaleSlider");
horizontalScaleSlider.oninput = () => {
    const portion = horizontalScaleSlider.valueAsNumber / int(horizontalScaleSlider.max);
    currentPatch.horizontalScale = convertSliderPortionToHorizontalScaleValue(portion);

    fullRefresh();
}

horizontalScaleSlider.ondblclick = () => {
    currentPatch.horizontalScale = 1;
    setHorizontalScaleInputFromCurrentPatch();
    fullRefresh();
}

function setHorizontalScaleInputFromCurrentPatch(){
    horizontalScaleSlider.value = convertHorizontalScaleValueToSliderPortion(currentPatch.horizontalScale) * int(horizontalScaleSlider.max);
}


function setDisplaySettingsFromPatch(){
    setColorInputsFromCurrentPatch();
    setContinuousScrollingInputFromCurrentPatch();
    setHorizontalScaleInputFromCurrentPatch();
    setUpperLowerDisplaySettingsToggleInputFromCurrentPatch();
    setPanningInputFromCurrentPatch();
}

/////////////
// PANNING //
/////////////

const upperTreePanningSlider = document.getElementById("upperTreePanningSlider");
upperTreePanningSlider.oninput = () => {
    const d = int(upperTreePanningSlider.max) / 2;
    currentPatch.upperTreePanning = (upperTreePanningSlider.valueAsNumber - d) / d;

    fullRefresh();
}

upperTreePanningSlider.ondblclick = () => {
    currentPatch.upperTreePanning = 0;
    setPanningInputFromCurrentPatch();
    fullRefresh();
}

function setPanningInputFromCurrentPatch(){
    upperTreePanningSlider.value = ((currentPatch.upperTreePanning + 1) / 2) * int(upperTreePanningSlider.max);
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

globalVolumeSlider.ondblclick = () => {
    globalVolumeSlider.value = int(globalVolumeSlider.max) / 2;
    globalVolumeSlider.oninput();
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
        mainDiv.style.display = "flex";
        windowResized();
        refreshCanvas();
        paint();
        document.body.style.setProperty("overflow", "visible");
    }
    else {
        mainDiv.hidden = true;
        mainDiv.style.display = "none";
        document.body.style.setProperty("overflow", "hidden");
        canvasWidth = document.body.clientWidth;
        canvasHeight = document.body.clientHeight;
        fullRefresh();
    }
}



/////////////////////////
//  SET EVERYTHING UP  //
/////////////////////////

function setPatchUIElementsFromCurrentPatch(){
    setClickSoundSettingsFromCurrentPatch();
    setDisplaySettingsFromPatch();
    setTempoInputFromCurrentPatch();
    setTempoDisplayModeFromCurrentPatch();
    setPresetDisplayNames();
    trySelectPreset();
}
