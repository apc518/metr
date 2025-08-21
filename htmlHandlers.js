const textFieldErrorColor = "#f88";
const textFieldOkayColor = "#fff";

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
    
    setPatchParam("tree", mtsInput.value);
    if (p5canvas){
        fullRefresh();
    }
}

let mtsInputPreviousContent = currentPatch.tree;

function setMtsInputFromCurrentPatch(){
    mtsInput.value = currentPatch.tree;
}


function setMtsErrorMessage(s){
    mtsErrorMessage.textContent = s;
}

const globalVolumeSlider = document.getElementById("globalVolumeSlider");
globalVolumeSlider.oninput = () => {
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
    const val = convertSliderValueToAmplitude(globalVolumeSlider.value);
    globalVolume = val;
}


const playPauseBtn = document.getElementById("playPauseBtn");
const resetBtn = document.getElementById("resetBtn");

playPauseBtn.onclick = () => {
    playPause();
}

resetBtn.onclick = () => {
    pause_();
    globalProgress = 0;
    fullRefresh();
}



//////////////////////
//  TEMPO SETTING   //
//////////////////////

const tempoInput = document.getElementById("tempoInput");
tempoInput.oninput = () => {
    setPatchParam("leafTempo", tempoInput.valueAsNumber);
    fullRefresh();
}

function setTempoInputFromCurrentPatch(){
    tempoInput.value = currentPatch.leafTempo;
}


/////////////////////////////////
//  NODE NUMBER MODE SETTING   //
/////////////////////////////////

const nodeNumberModeDropdown = document.getElementById("nodeNumberModeDropdown");
for (let item of nodeNumberModeOptions){
    let leavesOption = document.createElement('option');
    leavesOption.value = item;
    leavesOption.innerText = item;
    nodeNumberModeDropdown.appendChild(leavesOption);
}
nodeNumberModeDropdown.oninput = () => {
    setPatchParam("nodeNumberMode", nodeNumberModeDropdown.children[nodeNumberModeDropdown.selectedIndex].value);
    paint();
}

function setNumberModeInputFromCurrentPatch(){
    for (let i = 0; i < nodeNumberModeDropdown.children.length; i++){
        if (nodeNumberModeDropdown.children[i].value === currentPatch.nodeNumberMode){
            nodeNumberModeDropdown.selectedIndex = i;
            break;
        }
    }
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



//////////////
//  COLOR   //
//////////////

function rgbArrayToHex(rgbArray){
    let hex = "#";

    for (let value of rgbArray){
        hex += Number(value).toString(16).padStart(2, "0");
    }

    return hex;
}

function hexToRgbArray(hex){
    if (hex.length !== 7) throw new Error("hex string must be exactly 7 characters");
    if (!hex.startsWith("#")) throw new Error("hex string must start with '#'");
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return [r,g,b];
}

const hueInput = document.getElementById("hueInput");

function setColorInputsFromCurrentPatch(){
    hueInput.value = currentPatch.hue;
}

hueInput.oninput = () => {
    setPatchParam("hue", hueInput.value);
    if (!isLooping()) {
        paint();
    }
}




///////////////////////
//  Preset Selection //
///////////////////////

const presetSelectDropdown = document.getElementById("presetSelectDropdown");

presetSelectDropdown.oninput = () => {
    for (let i = 0; i < presets.length; i++){
        if (presets[i].name === presetSelectDropdown.children[presetSelectDropdown.selectedIndex].value){
            currentPatch = deepCopy(presets[i]);
            mtsInputPreviousContent = currentPatch.tree;
            fullRefresh();
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

function setPatchUIElementsFromCurrentPatch(){
    setClickSoundSettingsFromCurrentPatch();
    setColorInputsFromCurrentPatch();
    setMtsInputFromCurrentPatch();
    setNumberModeInputFromCurrentPatch();
    setTempoInputFromCurrentPatch();
    setPresetDisplayNames();
    trySelectPreset();
}

setPatchUIElementsFromCurrentPatch();