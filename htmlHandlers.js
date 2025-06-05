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
    currentPatch.leafTempo = tempoInput.value;
    fullRefresh();
}

function setTempoInputFromCurrentPatch(){
    tempoInput.value = currentPatch.leafTempo;
}


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
    elem.value = option.filename;
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
    currentPatch.hue = hueInput.value;
    if (!isLooping()) {
        paint();
    }
}


function setPatchUIElementsFromCurrentPatch(){
    setClickSoundSettingsFromCurrentPatch();
    setColorInputsFromCurrentPatch();
    setMtsInputFromCurrentPatch();
    setNumberModeInputFromCurrentPatch();
    setTempoInputFromCurrentPatch();
}

setPatchUIElementsFromCurrentPatch();


//////////////////////
//  Patch Selection //
//////////////////////

const patchSelectDropdown = document.getElementById("patchSelectDropdown");

patchSelectDropdown.oninput = () => {
    for (let i = 0; i < patches.length; i++){
        if (patches[i].name === patchSelectDropdown.children[patchSelectDropdown.selectedIndex].value){
            currentPatch = patches[i];
            fullRefresh();
            break;
        }
    }
}

function populatePatchSelectDropdown(){
    patchSelectDropdown.replaceChildren([]);
    for (let preset of patches){
        let elem = document.createElement("option");
        elem.value = preset.name;
        elem.text = preset.name;

        patchSelectDropdown.appendChild(elem);
    }
}

populatePatchSelectDropdown();

const LOCAL_STORAGE_PATCHES_KEY = 'metrPatches';
const patchSaveButton = document.getElementById("patchSaveButton");
patchSaveButton.onclick = e => {
    Swal.fire({
        title: "Name:",
        input: "text",
        showCancelButton: true
    }).then(res => {
        if(res.isConfirmed){
            let name = res.value;

            let patch = deepCopy(currentPatch);
            patch.name = name;
            
            let patchJson = JSON.stringify(patch);
            let currentLocalStoragePatches = JSON.parse(localStorage[LOCAL_STORAGE_PATCHES_KEY]);
            currentLocalStoragePatches.push(patchJson);
            localStorage[LOCAL_STORAGE_PATCHES_KEY] = JSON.stringify(currentLocalStoragePatches);

            patches.push(patch);
            populatePatchSelectDropdown();
            patchSelectDropdown.selectedIndex = patchSelectDropdown.children.length - 1;
        
            if(name === ""){
                name = "New.metr"
            }
            else if (!name.endsWith(".metr")){
                name = name + ".metr";
            }

            Swal.fire({
                icon: "success",
                text: "Success",
                timer: 1000,
                showConfirmButton: false
            });
        }
    });
}

if (!localStorage[LOCAL_STORAGE_PATCHES_KEY]){
    localStorage[LOCAL_STORAGE_PATCHES_KEY] = '[]';
}


///// still todo: asterisk on current name on change, 
// ctrl+s and localstorage
// put the user patch first in the list instead of last
// preset vs patch distinction... hm...
// probably distinguish "Save" vs "Save As" (former with localstorage, latter as a file)