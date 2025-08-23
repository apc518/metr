const presets = [
    {
        name: "Default",
        nodeNumberMode: "Leaves",
        hue: 300,
        leafTempo: 120,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[4],
        numLayersMuted: 0,
        tree: "1*4"
    },
    {
        name: "Orange Festival (Fizz Inc.)",
        nodeNumberMode: "Leaves",
        hue: 30,
        leafTempo: 320,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0],
        numLayersMuted: 0,
        tree: "3+2*4"
    },
    {
        name: "Threshold (sungazer)",
        nodeNumberMode: "Children",
        hue: 150,
        leafTempo: 33*19,
        accentDownbeat: false,
        pitchesHighToLow: false,
        pitchSpread: 1.3,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[3],
        numLayersMuted: 0,
        tree: "[6+6+7]*4"
    },
    {
        name: "Does She Know (Andy Chamberlain)",
        nodeNumberMode: "Children",
        hue: 300,
        leafTempo: 165*3,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[1],
        numLayersMuted: 0,
        tree: "3*7"
    },
    {
        name: "Natalie Has Never Tasted Anything Other Than Mustard (Andy Chamberlain)",
        nodeNumberMode: "Leaves",
        hue: 60,
        leafTempo: 128*4,
        accentDownbeat: true,
        pitchesHighToLow: false,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[2],
        numLayersMuted: 0,
        tree: "7+4"
    }
];

const nodeNumberModeOptions = [
    "Leaves",
    "Children"
]

const musicSensitiveParams = ["leafTempo", "tree", "numLayersMuted"];

let currentPatch = deepCopy(presets[0]);

const patchParams = [
    {
        name: "nodeNumberMode",
        compress: (x) => nodeNumberModeOptions.indexOf(x),
        decompress: (x) => nodeNumberModeOptions[x]
    },
    {
        name: "hue",
        compress: (x) => x,
        decompress: (x) => x
    },
    {
        name: "leafTempo",
        compress: (x) => x,
        decompress: (x) => x,
        musical: true
    },
    {
        name: "accentDownbeat",
        compress: (x) => x ? 1 : 0,
        decompress: (x) => !!x
    },
    {
        name: "pitchesHighToLow",
        compress: (x) => x ? 1 : 0,
        decompress: (x) => !!x
    },
    {
        name: "pitchSpread",
        compress: (x) => x,
        decompress: (x) => x
    },
    {
        name: "volumeFalloff",
        compress: (x) => x,
        decompress: (x) => x
    },
    {
        name: "audioSample",
        compress: (x) => Array.from(audioSampleOptions, o => o.filename).indexOf(x.filename),
        decompress: (x) => audioSampleOptions[x]
    },
    {
        name: "numLayersMuted",
        compress: (x) => x,
        decompress: (x) => x,
        musical: true
    },
    {
        name: "tree",
        compress: (x) => x,
        decompress: (x) => x,
        musical: true
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
    let base64String = getPatchBase64FromURL();
    if (base64String.length > 1){
        return convertListToPatch(JSON.parse(window.atob(base64String)));
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
    const newBase64 = patchBase64(currentPatch);
    if (newBase64 !== getPatchBase64FromURL()){
        let refresh = window.location.protocol + "//" + window.location.host + window.location.pathname
                        + `?p=${patchBase64(currentPatch)}`;
        window.history.pushState({ path: refresh }, '', refresh);
    }
}

function patchEquals(p1, p2){
    for (let param of patchParams){
        if (JSON.stringify(p1[param.name]) !== JSON.stringify(p2[param.name])){
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
        if (currentPatch.tree === presets[i].tree && currentPatch.leafTempo === presets[i].leafTempo){
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