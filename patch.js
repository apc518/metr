const presets = [
    {
        name: "Orange Festival (Fizz Inc.)",
        nodeNumberMode: NODE_NUMBER_MODES.leaves,
        hue: 300,
        leafTempo: 320,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0],
        numLayersMuted: 0,
        tree: "[3,2*4]"
    },
    {
        name: "Threshold (sungazer)",
        nodeNumberMode: NODE_NUMBER_MODES.children,
        hue: 300,
        leafTempo: 33*19,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0],
        numLayersMuted: 0,
        tree: "[[6,6,7]*4]"
    },
    {
        name: "Does She Know (Andy Chamberlain)",
        nodeNumberMode: NODE_NUMBER_MODES.children,
        hue: 300,
        leafTempo: 165*3,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0],
        numLayersMuted: 0,
        tree: "[3*7]"
    },
    {
        name: "Natalie Has Never Tasted Anything Other Than Mustard (Andy Chamberlain)",
        nodeNumberMode: NODE_NUMBER_MODES.leaves,
        hue: 300,
        leafTempo: 128*4,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0],
        numLayersMuted: 0,
        tree: "[7,4,7,4]"
    }
];

const patches = Array.from(presets, item => deepCopy(item));

let currentPatch = patches[0];

function convertListToPatch(ls){
    let patch = {};
    patch.name = ls[0];
    patch.nodeNumberMode = ls[1];
    patch.hue = ls[2];
    patch.leafTempo = ls[3];
    patch.accentDownbeat = !!ls[4];
    patch.pitchesHighToLow = !!ls[5];
    patch.pitchSpread = ls[6];
    patch.volumeFalloff = ls[7];
    patch.audioSample = audioSampleOptions[ls[8]];
    patch.numLayersMuted = ls[9];
    patch.tree = ls[10];

    return patch;
}

function convertPatchToList(patch){
    return [
        patch.name,
        patch.nodeNumberMode,
        patch.hue,
        patch.leafTempo,
        patch.accentDownbeat ? 1 : 0,
        patch.pitchesHighToLow ? 1 : 0,
        patch.pitchSpread,
        patch.volumeFalloff,
        Array.from(audioSampleOptions, o => o.filename).indexOf(patch.audioSample.filename),
        patch.numLayersMuted,
        patch.tree
    ];
}

function getPatchFromURL(){
    let urlParts = window.location.toString().split("?p=");
    if (urlParts.length > 1){
        return convertListToPatch(JSON.parse(window.atob(urlParts[1])));
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
    let refresh = window.location.protocol + "//" + window.location.host + window.location.pathname
                    + `?p=${patchBase64(currentPatch)}`;
    window.history.pushState({ path: refresh }, '', refresh);
}

function setPatchParam(param, value){
    currentPatch[param] = value;
    writePatchToUrl();
}