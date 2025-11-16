const audioSampleOptions = [
    {
        filename: "Volt SatRim 04.wav",
        displayName: "Pitched Blip"
    },
    {
        filename: "minimal click.wav",
        displayName: "Minimal Click"
    },
    {
        filename: "Fracture Rim 01.wav",
        displayName: "Loud Rim"
    },
    {
        filename: "Grv CH 05.wav",
        displayName: "Hi-Hat"
    },
    {
        filename: "custom-cowbell.wav",
        displayName: "Cowbell"
    }
];


const clipList = [];
const AUDIO_LOOKAHEAD_OFFSET = -0.01; // seconds
const AUDIO_LOOKAHEAD_WINDOW_SIZE = 0.2; // seconds

let audioCtx = null;
let audioCtxTimeLastPaused = 0;
let totalTimeSpentPausedUntilLastPlay = 0;


async function createSounds(){
    if (audioCtx) return;

    audioCtx = new AudioContext();

    // clear clip list
    while(clipList.length > 0){
        clipList.pop();
    }

    for(let opt of audioSampleOptions){
        try{
            let decodedData = await fetch("assets/sounds/" + opt.filename)
                .then(async f => {
                    const res = await f.arrayBuffer();
                    return audioCtx.decodeAudioData(res);
                });
    
            // console.log(decodedData);
            
            clipList.push(new Clip(decodedData, opt.displayName));
        }
        catch(e){
            console.log("error:", opt);
            console.error(e);
        }
    }
}

function resetAudio(){
    audioCtx = null;
    audioCtxTimeLastPaused = 0;
    totalTimeSpentPausedUntilLastPlay = 0;
}

function getGlobalProgress(tree){
    if (isLooping()){
        return ((audioCtx?.currentTime ?? 0) - totalTimeSpentPausedUntilLastPlay) / getCycleDuration(tree);
    }
    else{
        return (audioCtxTimeLastPaused - totalTimeSpentPausedUntilLastPlay) / getCycleDuration(tree);
    }
}

function calculateAudioClipSpeed(tree, leaf){
    const minDepth = tree.getMinDepth();
    let soundDepth = Math.min(tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(leaf), minDepth);
    let totalDepth = minDepth;
    if (!currentPatch.accentDownbeat) {
        totalDepth -= 1;
        soundDepth = Math.max(0, soundDepth - 1);
    }
    return Math.pow(currentPatch.pitchSpread, currentPatch.pitchesHighToLow ? totalDepth - soundDepth : soundDepth);
}

function calculateAudioClipVolume(tree, leaf){
    let soundDepth = Math.min(tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(leaf), tree.getMinDepth());
    if (!currentPatch.accentDownbeat) soundDepth = Math.max(1, soundDepth) - 1;
    return Math.pow(currentPatch.volumeFalloff, soundDepth);
}


const soundTimeQueue = [];

function playEventListContainsWithTimeEpsilon(ls, { playTime, speed, volume, audioSampleIdx }, epsilon){
    for (let playEvent of ls){
        if (Math.abs(playEvent.playTime - playTime) <= epsilon
            && playEvent.speed === speed
            && playEvent.volume === volume
            && playEvent.audioSampleIdx === audioSampleIdx){
            return true;
        }
    }
    return false;
}

function playClip(playTime, speed, volume, audioSampleIdx, panning){
    const playEvent = { playTime, speed, volume, audioSampleIdx }
    if (!playEventListContainsWithTimeEpsilon(soundTimeQueue, playEvent, 0.000001)){
        clipList[audioSampleIdx].play(playTime, speed, volume, panning);
        soundTimeQueue.push(playEvent);
        while(soundTimeQueue[0].playTime < audioCtx.currentTime - AUDIO_LOOKAHEAD_WINDOW_SIZE){
            soundTimeQueue.shift();
        }
    }
}


function scheduleSounds(tree, audioSampleIdx, panning){
    const leafProgressValues = tree.getLeafNodeCyclePortionValues();
    for (let leaf = 0; leaf < tree.totalLeaves; leaf++){
        const lookaheadWindowBeginning = audioCtx.currentTime + AUDIO_LOOKAHEAD_OFFSET;
        const lookaheadWindowEnd = lookaheadWindowBeginning + AUDIO_LOOKAHEAD_WINDOW_SIZE;
        
        const cycleDuration = getCycleDuration(tree);
        const cycleNumber = Math.floor((lookaheadWindowBeginning - totalTimeSpentPausedUntilLastPlay) / cycleDuration); // 0-indexed
        
        for (let leafTime = leafProgressValues[leaf] * cycleDuration + (cycleNumber * cycleDuration) + totalTimeSpentPausedUntilLastPlay;
            leafTime < lookaheadWindowEnd;
            leafTime += cycleDuration){
            if (lookaheadWindowBeginning <= leafTime && leafTime < lookaheadWindowEnd){
                playClip(
                    leafTime,
                    calculateAudioClipSpeed(tree, leaf),
                    calculateAudioClipVolume(tree, leaf),
                    audioSampleIdx,
                    panning
                )
            }
        }
    }
}

class Clip {
    constructor(audioBuffer, name){
        // input
        this.name = name;
        this.audioBuffer = audioBuffer;
    }

    play(time, speed, volume, panning){
        let source = audioCtx.createBufferSource();
        let gainNode = audioCtx.createGain();
        let panningNode = audioCtx.createStereoPanner();
        panningNode.pan.value = panning;
        gainNode.gain.value = globalVolume * volume;
        if(this.audioBuffer){
            source.buffer = this.audioBuffer;
            source.playbackRate.value = speed;

            source.connect(gainNode);
            gainNode.connect(panningNode);
            panningNode.connect(audioCtx.destination);
            
            source.start(time);
        }
    }
}