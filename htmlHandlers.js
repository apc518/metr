const textFieldErrorColor = "#f88";
const textFieldOkayColor = "#fff";



//////////////////
//  MTS INPUT   //
//////////////////

const mtsInput = document.getElementById("mtsInput");
const mtsErrorMessage = document.getElementById("mtsError");

mtsInput.oninput = e => {
    // remove invalid characters immediately
    if (e.data){
        let initialCursorPosition = mtsInput.selectionStart;
        for (let i = 0; i < e.data.length; i++){
            if (!(validMtsCharacters.includes(e.data[i]))){
                mtsInput.value = mtsInputPreviousContent;
                if (e.data !== " ")
                    setMtsErrorMessage(`Input \"${e.data}\" contains invalid characters. Valid characters: \"${validMtsCharacters}\"`);
                mtsInput.selectionStart = initialCursorPosition - e.data.length;
                mtsInput.selectionEnd = initialCursorPosition - e.data.length;
                return;
            }
        }
    }
    
    mtsInputPreviousContent = mtsInput.value.slice();
    
    mtsInput.inputIsValid = mtsStringIsValid(mtsInput.value);
    
    mtsInput.style.backgroundColor = mtsInput.inputIsValid ? textFieldOkayColor : textFieldErrorColor;
    
    if (!mtsInput.inputIsValid) return;
    
    setMtsErrorMessage("");
    
    setPatchParam("mts", mtsInput.value);
    setLeafTempoBasedOnDisplayTempo();
    if (p5canvas){
        fullRefresh();
    }
}

let mtsInputPreviousContent = currentPatch.mts;

function setMtsInputFromCurrentPatch(){
    mtsInput.value = currentPatch.mts;
}

function setMtsErrorMessage(s){
    mtsErrorMessage.textContent = s;
}



///////////////////////
//  Preset Selection //
///////////////////////

const presetSelectDropdown = document.getElementById("presetSelectDropdown");

presetSelectDropdown.oninput = () => {
    for (let i = 0; i < presets.length; i++){
        if (presets[i].name === presetSelectDropdown.children[presetSelectDropdown.selectedIndex].value){
            currentPatch = deepCopy(presets[i]);
            mtsInputPreviousContent = currentPatch.mts;
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
    setPatchParam("leafTempo", calculateLeafTempo(tempoInput.valueAsNumber));
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
    setPatchParam("leafTempo", calculateLeafTempo(tempoInput.valueAsNumber));
}

displayTempoDropdown.oninput = () => {
    setPatchParam("displayTempoMode", displayTempoOptions[displayTempoDropdown.selectedIndex]);
    fullRefresh();
}

function calculateLeafTempo(displayTempoValue){
    const tree = new MetricTree(parseMts(currentPatch.mts));
    const leafCounts = tree.getChildrensLeafNodeCounts();
    if (currentPatch.displayTempoMode === "Largest Beat"){
        let maxBeatSize = 0;
        for (let count of leafCounts){
            maxBeatSize = Math.max(maxBeatSize, count);
        }
        return displayTempoValue * maxBeatSize;
    }
    else if (currentPatch.displayTempoMode === "Smallest Beat"){
        let minBeatSize = Infinity;
        for (let count of leafCounts){
            minBeatSize = Math.min(minBeatSize, count);
        }
        return displayTempoValue * minBeatSize;
    }
    else{
        return displayTempoValue;
    }
}

function calculateDisplayTempo(){
    const tree = new MetricTree(parseMts(currentPatch.mts));
    const leafCounts = tree.getChildrensLeafNodeCounts();
    if (currentPatch.displayTempoMode === "Largest Beat"){
        let maxBeatSize = 0;
        for (let count of leafCounts){
            maxBeatSize = Math.max(maxBeatSize, count);
        }
        return (currentPatch.leafTempo / maxBeatSize);
    }
    else if (currentPatch.displayTempoMode === "Smallest Beat"){
        let minBeatSize = Infinity;
        for (let count of leafCounts){
            minBeatSize = Math.min(minBeatSize, count);
        }
        return currentPatch.leafTempo / minBeatSize;
    }
    else{
        return currentPatch.leafTempo;
    }
}

function setTempoInputFromCurrentPatch(){
    console.log("hello there", calculateDisplayTempo());
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
    setPatchParam("pitchSpread", pitchSpreadInput.valueAsNumber);
}
volumeFalloffInput.oninput = () => {
    setPatchParam("volumeFalloff", volumeFalloffInput.valueAsNumber);
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
    if (numLayersMutedInput.value > tree.getDepth()){
        numLayersMutedInput.value = tree.getDepth();
    }
    setPatchParam("numLayersMuted", numLayersMutedInput.valueAsNumber);
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



/////////////////////////
//  PLAYBACK CONTROLS  //
/////////////////////////

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
    globalProgress = 0;
    fullRefresh();
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

setPatchUIElementsFromCurrentPatch();