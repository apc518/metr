const presets = [
    {
        name: "Orange Festival",
        nodeNumberMode: NODE_NUMBER_MODES.leaves,
        hue: 300,
        leafTempo: 320,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0].filename,
        tree: "[3,2*4]"
    },
    {
        name: "Threshold",
        nodeNumberMode: NODE_NUMBER_MODES.children,
        hue: 300,
        leafTempo: 33*19,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0].filename,
        tree: "[[6,6,7]*4]"
    },
    {
        name: "Does She Know",
        nodeNumberMode: NODE_NUMBER_MODES.children,
        hue: 300,
        leafTempo: 165*3,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0].filename,
        tree: "[3*7]"
    },
    {
        name: "Natalie Has Never Tasted Anything Other Than Mustard",
        nodeNumberMode: NODE_NUMBER_MODES.leaves,
        hue: 300,
        leafTempo: 128*4,
        accentDownbeat: true,
        pitchesHighToLow: true,
        pitchSpread: 1.5,
        volumeFalloff: 0.5,
        audioSample: audioSampleOptions[0].filename,
        tree: "[7,4,7,4]"
    }
];

const patches = Array.from(presets, item => deepCopy(item));

let currentPatch = patches[0];