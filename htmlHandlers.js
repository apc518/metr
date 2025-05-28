const textFieldErrorColor = "#f88";
const textFieldOkayColor = "#fff";

const mtsInput = document.getElementById("mtsInput");
const mtsErrorMessage = document.getElementById("mtsError");

mtsInput.style.backgroundColor = mtsStringIsValid(mtsInput.value) ? textFieldOkayColor : textFieldErrorColor;
let mtsInputPreviousContent = mtsInput.value;

mtsInput.oninput = e => {
    // remove invalid characters immediately
    if (e.data){
        let initialCursorPosition = mtsInput.selectionStart;
        for (let i = 0; i < e.data.length; i++){
            if (!(validMtsCharacters.includes(e.data[i]))){
                mtsInput.value = mtsInputPreviousContent;
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

    currentPatch.tree = mtsInput.value;
    fullRefresh();
}

function setMtsInputFromCurrentPatch(){
    mtsInput.value = currentPatch.tree;
}

setMtsInputFromCurrentPatch();


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
    currentPatch.leafTempo = tempoInput.value;
    fullRefresh();
}

function setTempoInputFromCurrentPatch(){
    tempoInput.value = currentPatch.leafTempo;
}

setTempoInputFromCurrentPatch();


/////////////////////////////////
//  NODE NUMBER MODE SETTING   //
/////////////////////////////////

const nodeNumberModeDropdown = document.getElementById("nodeNumberModeDropdown");
let leavesOption = document.createElement('option');
leavesOption.value = NODE_NUMBER_MODES.leaves;
leavesOption.innerText = "Leaves";
nodeNumberModeDropdown.appendChild(leavesOption);
let childrenOption = document.createElement('option');
childrenOption.value = NODE_NUMBER_MODES.children;
childrenOption.innerText = "Children";
nodeNumberModeDropdown.appendChild(childrenOption);
nodeNumberModeDropdown.oninput = () => {
    currentPatch.nodeNumberMode = nodeNumberModeDropdown.children[nodeNumberModeDropdown.selectedIndex].value;
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

setNumberModeInputFromCurrentPatch();


/////////////////////////////
//  CLICK SOUND SETTINGS   //
/////////////////////////////

const accentDownbeatCheckbox = document.getElementById("accentDownbeatCheckbox");
const pitchesHighToLowCheckbox = document.getElementById("pitchesHighToLowCheckbox");
accentDownbeatCheckbox.oninput = () => {
    currentPatch.accentDownbeat = accentDownbeatCheckbox.checked;
}
pitchesHighToLowCheckbox.oninput = () => {
    currentPatch.pitchesHighToLow = pitchesHighToLowCheckbox.checked;
}

const pitchSpreadInput = document.getElementById("pitchSpreadInput");
const volumeFalloffInput = document.getElementById("volumeFalloffInput");
pitchSpreadInput.oninput = () => {
    currentPatch.pitchSpread = pitchSpreadInput.value;
}
volumeFalloffInput.oninput = () => {
    currentPatch.volumeFalloff = volumeFalloffInput.value;
}

const audioSampleDropdown = document.getElementById("audioSampleDropdown");
for (let option of audioSampleOptions){
    let elem = document.createElement('option');
    elem.value = option.filepath;
    elem.innerText = option.displayName;
    audioSampleDropdown.appendChild(elem);
}

function setClickSoundSettingsFromCurrentPatch(){
    accentDownbeatCheckbox.checked = currentPatch.accentDownbeat;
    pitchesHighToLowCheckbox.checked = currentPatch.pitchesHighToLow;
    pitchSpreadInput.value = currentPatch.pitchSpread;
    volumeFalloffInput.value = currentPatch.volumeFalloff;

    for (let i = 0; i < audioSampleDropdown.children.length; i++){
        if (audioSampleDropdown.children[i].value === currentPatch.audioSample){
            audioSampleDropdown.selectedIndex = i;
            break;
        }
    }
}

setClickSoundSettingsFromCurrentPatch();



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

const onColorInput = document.getElementById("onColorInput");
const offColorInput = document.getElementById("offColorInput");

function setColorInputsFromCurrentPatch(){
    onColorInput.value = rgbArrayToHex(currentPatch.onColor);
    offColorInput.value = rgbArrayToHex(currentPatch.offColor);
}

setColorInputsFromCurrentPatch();

onColorInput.oninput = () => {
    currentPatch.onColor = hexToRgbArray(onColorInput.value);
    if (!isLooping()) {
        paint();
    }
}
offColorInput.oninput = () => {
    currentPatch.offColor = hexToRgbArray(offColorInput.value);
    if (!isLooping()) {
        paint();
    }
}