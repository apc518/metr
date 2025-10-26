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

function getGlobalProgress(){
    if (isLooping()){
        return ((audioCtx?.currentTime ?? 0) - totalTimeSpentPausedUntilLastPlay) / getCycleDuration();
    }
    else{
        return (audioCtxTimeLastPaused - totalTimeSpentPausedUntilLastPlay) / getCycleDuration();
    }
}

function calculateAudioClipSpeed(leaf){
    const minDepth = globalTree.getMinDepth();
    let soundDepth = Math.min(globalTree.minDepthContainingNodeWhoseLeftMostLeafIsThis(leaf), minDepth);
    let totalDepth = minDepth;
    if (!currentPatch.accentDownbeat) {
        totalDepth -= 1;
        soundDepth = Math.max(0, soundDepth - 1);
    }
    return Math.pow(currentPatch.pitchSpread, currentPatch.pitchesHighToLow ? totalDepth - soundDepth : soundDepth);
}

function calculateAudioClipVolume(leaf){
    let soundDepth = Math.min(globalTree.minDepthContainingNodeWhoseLeftMostLeafIsThis(leaf), globalTree.getMinDepth());
    if (!currentPatch.accentDownbeat) soundDepth = Math.max(1, soundDepth) - 1;
    return Math.pow(currentPatch.volumeFalloff, soundDepth);
}


const soundTimeQueue = [];

function listContainsNumWithEpsilon(ls, num, epsilon){
    for (let n of ls){
        if (Math.abs(n - num) <= epsilon){
            return true;
        }
    }
    return false;
}

function playClip(playTime, speed, volume){
    if (!listContainsNumWithEpsilon(soundTimeQueue, playTime, 0.000001)){
        clipList[audioSampleDropdown.selectedIndex].play(playTime, speed, volume);
        soundTimeQueue.push(playTime);
        while(soundTimeQueue[0] < audioCtx.currentTime - AUDIO_LOOKAHEAD_WINDOW_SIZE){
            soundTimeQueue.shift();
        }
    }
}


function scheduleSounds(){
    for (let leaf = 0; leaf < totalLeaves; leaf++){
        const lookaheadWindowBeginning = audioCtx.currentTime + AUDIO_LOOKAHEAD_OFFSET;
        const lookaheadWindowEnd = lookaheadWindowBeginning + AUDIO_LOOKAHEAD_WINDOW_SIZE;
        
        const cycleDuration = getCycleDuration();
        const cycleNumber = Math.floor((lookaheadWindowBeginning - totalTimeSpentPausedUntilLastPlay) / cycleDuration); // 0-indexed
        
        for (let leafTime = leafProgressValues[leaf] * cycleDuration + (cycleNumber * cycleDuration) + totalTimeSpentPausedUntilLastPlay;
            leafTime < lookaheadWindowEnd;
            leafTime += cycleDuration){
            if (lookaheadWindowBeginning <= leafTime && leafTime < lookaheadWindowEnd){
                playClip(
                    leafTime,
                    calculateAudioClipSpeed(leaf),
                    calculateAudioClipVolume(leaf)
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

    play(time, speed, volume){
        let source = audioCtx.createBufferSource();
        let gainNode = audioCtx.createGain();
        gainNode.gain.value = globalVolume * volume;
        if(this.audioBuffer){
            source.buffer = this.audioBuffer;
            source.playbackRate.value = speed;

            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            source.start(time);
        }
    }
}