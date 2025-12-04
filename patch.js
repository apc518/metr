const nodeNumberModeOptions = [
    "Leaves",
    "Children"
];

const displayTempoOptions = [
    "Leaves",
    "Smallest Beat",
    "Largest Beat"
];

const presets = [
    {
        name: "Orange Festival (Israel Strom, phonon, Noah Denton)",
        nodeNumberMode: nodeNumberModeOptions[0],
        hue: 30,
        leafTempo: 160*2,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0],
        numLayersMuted: 0,
        mtsUpper: "3+2*4",
        mtsLower: null,
        displayTempoMode: displayTempoOptions[1],
        lowerTreeAudioSample: audioSampleOptions[0],
        lowerTreeActive: false
    },
    {
        name: "Threshold (sungazer)",
        nodeNumberMode: nodeNumberModeOptions[1],
        hue: 150,
        leafTempo: 33*19,
        accentDownbeat: false,
        pitchesHighToLow: false,
        pitchSpread: 1.3,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[3],
        numLayersMuted: 0,
        mtsUpper: "[6+6+7]*4",
        mtsLower: null,
        displayTempoMode: displayTempoOptions[1],
        lowerTreeAudioSample: audioSampleOptions[0],
        lowerTreeActive: false
    },
    {
        name: "Monomyth (Animals As Leaders)",
        nodeNumberMode: nodeNumberModeOptions[0],
        hue: 120,
        leafTempo: 150*3,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 0.9,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[4],
        numLayersMuted: 0,
        mtsUpper: "[2+3] + [2+2+3]*2 + [2+3]*2 + [2+2+3]",
        mtsLower: "[3*3]*4",
        displayTempoMode: displayTempoOptions[0],
        lowerTreeAudioSample: audioSampleOptions[3],
        lowerTreeActive: true
    },
    {
        name: "Natalie Has Never Tasted Anything Other Than Mustard (Andy Chamberlain)",
        nodeNumberMode: nodeNumberModeOptions[0],
        hue: 60,
        leafTempo: 128*4,
        accentDownbeat: true,
        pitchesHighToLow: false,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[2],
        numLayersMuted: 0,
        mtsUpper: "7+4",
        mtsLower: null,
        displayTempoMode: displayTempoOptions[0],
        lowerTreeAudioSample: audioSampleOptions[0],
        lowerTreeActive: false
    },
    {
        name: "Chronostasis (Victoria)",
        nodeNumberMode: nodeNumberModeOptions[0],
        hue: 30,
        leafTempo: 140,
        accentDownbeat: true,
        pitchesHighToLow: false,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[2],
        numLayersMuted: 0,
        mtsUpper: "4:3 + 6:4 + 4:3",
        mtsLower: "5+5",
        displayTempoMode: displayTempoOptions[0],
        lowerTreeAudioSample: audioSampleOptions[0],
        lowerTreeActive: true
    },
    {
        name: "polyriddim (phonon)",
        nodeNumberMode: nodeNumberModeOptions[0],
        hue: 180,
        leafTempo: 122.5,
        accentDownbeat: true,
        pitchesHighToLow: false,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[2],
        numLayersMuted: 0,
        mtsUpper: "[7:6 + 11:8]:7 + [[4:3 + 1 + 3:2] + [4:3 + 4:3 + 5]:8]:7 + [[2 + 4:3 + 4:2]:6 + [3:2 + 4:2 + 5:2 + 5:2]]:7 + [[3:2*3] + [5 + 11:6]:8]:7",
        mtsLower: "[3+4]*4",
        displayTempoMode: displayTempoOptions[0],
        lowerTreeAudioSample: audioSampleOptions[0],
        lowerTreeActive: true
    }
];

const musicSensitiveParams = ["leafTempo", "tree", "numLayersMuted"];

let currentPatch = deepCopy(presets[0]);

const patchParams = [
    {
        name: "nodeNumberMode",
        compress: x => nodeNumberModeOptions.indexOf(x),
        decompress: x => nodeNumberModeOptions[x]
    },
    {
        name: "hue",
        compress: x => x,
        decompress: x => x
    },
    {
        name: "leafTempo",
        compress: x => x,
        decompress: x => x,
        musical: true
    },
    {
        name: "accentDownbeat",
        compress: x => x ? 1 : 0,
        decompress: x => !!x
    },
    {
        name: "pitchesHighToLow",
        compress: x => x ? 1 : 0,
        decompress: x => !!x
    },
    {
        name: "pitchSpread",
        compress: x => x,
        decompress: x => x
    },
    {
        name: "volumeFalloff",
        compress: x => x,
        decompress: x => x
    },
    {
        name: "audioSample",
        compress: x => Array.from(audioSampleOptions, o => o.filename).indexOf(x.filename),
        decompress: x => audioSampleOptions[x]
    },
    {
        name: "numLayersMuted",
        compress: x => x,
        decompress: x => x,
        musical: true
    },
    {
        name: "mtsUpper",
        compress: x => x,
        decompress: x => x,
        musical: true
    },
    {
        name: "mtsLower",
        compress: x => x,
        decompress: x => x,
        musical: true
    },
    {
        name: "displayTempoMode",
        compress: x => displayTempoOptions.indexOf(x),
        decompress: x => displayTempoOptions[x]
    },
    {
        name: "lowerTreeAudioSample",
        compress: x => Array.from(audioSampleOptions, o => o.filename).indexOf(x.filename),
        decompress: x => audioSampleOptions[x]
    },
    {
        name: "lowerTreeActive",
        compress: x => x ? 1 : 0,
        decompress: x => !!x,
        musical: true
    },
    {
        name: "lowerTreeAccentDownbeat",
        compress: x => x ? 1 : 0,
        decompress: x => !!x
    },
    {
        name: "lowerTreePitchesHighToLow",
        compress: x => x ? 1 : 0,
        decompress: x => !!x
    },
    {
        name: "lowerTreePitchSpread",
        compress: x => x,
        decompress: x => x
    },
    {
        name: "lowerTreeVolumeFalloff",
        compress: x => x,
        decompress: x => x
    },
    {
        name: "lowerTreeNodeNumberMode",
        compress: x => nodeNumberModeOptions.indexOf(x),
        decompress: x => nodeNumberModeOptions[x]
    },
    {
        name: "horizontalScale",
        compress: x => x,
        decompress: x => x
    },
    {
        name: "continuousScrolling",
        compress: x => x ? 1 : 0,
        decompress: x => !!x
    },
    {
        name: "upperTreePanning",
        compress: x => x ?? 0,
        decompress: x => x ?? 0
    }
]

function convertListToPatch(ls){
    let patch = {};
    for (let [i, patchParam] of patchParams.entries()){
        patch[patchParam.name] = patchParam.decompress(ls[i]);
    }

    return patch;
}

function convertPatchToList(patch){
    return Array.from(patchParams, param => param.compress(patch[param.name]));
}

function getPatchBase64FromURL(){
    let urlParts = window.location.toString().split("?p=");
    if (urlParts.length > 1){
        return urlParts[1];
    }

    return "";
}

function getPatchFromURL(){
    try{
        let base64String = getPatchBase64FromURL();
        if (base64String.length > 1){
            return convertListToPatch(JSON.parse(window.atob(base64String)));
        }
    }
    catch(e){
        let refresh = window.location.protocol + "//" + window.location.host + window.location.pathname;
        console.error(e);
        alert("Corrupt patch while getting patch from URL; press okay to refresh the page");
        window.history.pushState({ path: refresh }, '', refresh);
        location.reload();
    }

    return null;
}

function setPatchFromURL(){
    let patch = getPatchFromURL();
    if (patch){
        currentPatch = patch;
    }
}

setPatchFromURL();

function patchBase64(patch){
    return window.btoa(JSON.stringify(convertPatchToList(patch)));
}

function writePatchToUrl(){
    try{
        const newBase64 = patchBase64(currentPatch);
        if (newBase64 !== getPatchBase64FromURL()){
            let refresh = window.location.protocol + "//" + window.location.host + window.location.pathname
                            + `?p=${patchBase64(currentPatch)}`;
            window.history.pushState({ path: refresh }, '', refresh);
        }
    }
    catch(e){
        clearInterval(writePatchToUrlInterval);
        let refresh = window.location.protocol + "//" + window.location.host + window.location.pathname;
        console.error(e);
        alert("Corrupt patch while writing; press okay to refresh the page");
        window.history.pushState({ path: refresh }, '', refresh);
        location.reload();
    }
}

function patchEquals(p1, p2){
    for (let param of patchParams){
        if (JSON.stringify(p1[param.name] ?? p2[param.name]) !== JSON.stringify(p2[param.name])){
            return false;
        }
    }

    return true;
}

function patchEqualsMusical(p1, p2){
    for (let param of patchParams){
        if (param.musical && JSON.stringify(p1[param.name]) !== JSON.stringify(p2[param.name])){
            return false;
        }
    }

    return true;
}




/**
 * selects the preset from the preset dropdown that matches the current patch, if one exists
 */
function trySelectPreset(){
    for (let i = 0; i < presetSelectDropdown.children.length; i++){
        if (patchEquals(presets[i], currentPatch)){
            presetSelectDropdown.selectedIndex = i;
            presetSelectDropdown.children[i].text = presets[i].name;
            return;
        }
    }

    for (let i = 0; i < presets.length; i++){
        if (currentPatch.mtsUpper === presets[i].mtsUpper && currentPatch.leafTempo === presets[i].leafTempo){
            presetSelectDropdown.children[i].text = "*" + presets[i].name;
            presetSelectDropdown.selectedIndex = i;
            return;
        }
    }
    
    presetSelectDropdown.children[presetSelectDropdown.selectedIndex].text = "*" + presets[presetSelectDropdown.selectedIndex].name;
}

function setPatchParam(param, value){
    currentPatch[param] = value;
    trySelectPreset();
}