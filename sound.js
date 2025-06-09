const audioSampleOptions = [
    {
        filename: "Volt SatRim 04.wav",
        displayName: "Pitched Blip"
    },
    {
        filename: "Fracture Rim 03.wav",
        displayName: "Short Click"
    },
    {
        filename: "HouseGen Rim 07.wav",
        displayName: "Hybrid Click-Blip"
    },
    {
        filename: "Fracture Rim 01.wav",
        displayName: "Loud Rim"
    }
];

const clipList = [];
let currentSoundIndex = 0;
let audioCtx = null;

async function createSounds(){
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
            console.error(e);
        }
    }
}


let audioCtxTimeOffset = 0;  // globalProgress * cycle time + audioCtxTimeOffset should equal approximately audioCtx.currentTime when we are playing
const AUDIO_LOOKAHEAD_FRAMES = 3;

function leafHitsNext(leaf, progress, latencyFrames){
    let leafProgress = leaf / totalLeaves;
    let targetFrameProgress = (progress + latencyFrames * progressIncrement) % 1;
    if (1 - targetFrameProgress < progressIncrement){
        targetFrameProgress = 0;
    }
    return targetFrameProgress <= leafProgress && leafProgress < targetFrameProgress + progressIncrement;
}

function calculateAudioClipSpeed(leaf){
    let soundDepth = tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(leaf);
    let totalDepth = tree.getDepth();
    if (!currentPatch.accentDownbeat) {
        totalDepth -= 1;
        soundDepth = Math.max(0, soundDepth - 1);
    }
    return Math.pow(currentPatch.pitchSpread, currentPatch.pitchesHighToLow ? totalDepth - soundDepth : soundDepth);
}

function calculateAudioClipVolume(leaf){
    let soundDepth = tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(leaf);
    if (!currentPatch.accentDownbeat) soundDepth = Math.max(1, soundDepth);
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
        while(soundTimeQueue.length > 16){
            soundTimeQueue.shift();
        }
    }
}


function scheduleInitialSounds(){
    // for the first AUDIO_LOOKAHEAD_FRAMES frames, find every leaf node that should sound and schedule it
    for (let i = 0; i < AUDIO_LOOKAHEAD_FRAMES; i++){
        for (let leaf = 0; leaf < totalLeaves; leaf++){
            if (leafHitsNext(leaf, globalProgress, i)){
                let playTime = audioCtxTimeOffset
                    + epsilonFloor(globalProgress + progressIncrement * i) * cycleDuration()
                    + leaf * 60 / currentPatch.leafTempo;

                // console.log(JSON.stringify({playTime, frameCount, globalProgress, leaf}));

                playClip(
                    playTime,
                    calculateAudioClipSpeed(leaf),
                    calculateAudioClipVolume(leaf)
                );
            }
        }
    }
}

function scheduleSounds(){
    // calculate if a sound should play during the frame that is AUDIO_LOOKAHEAD_FRAMES frames in the future
    // if so, set that sound to play at precisely the correct time
    for (let leaf = 0; leaf < totalLeaves; leaf++){
        if (leafHitsNext(leaf, globalProgress, AUDIO_LOOKAHEAD_FRAMES)){
            let targetFrameProgress = globalProgress + progressIncrement * AUDIO_LOOKAHEAD_FRAMES;
            let cycle = Math.ceil(targetFrameProgress) - targetFrameProgress < progressIncrement 
                        ? Math.ceil(targetFrameProgress)
                        : Math.floor(targetFrameProgress);
            
            let playTime = audioCtxTimeOffset
                + cycle * cycleDuration()
                + leaf * 60 / currentPatch.leafTempo;
            
            if (tree.getDepth() - tree.minDepthContainingNodeWhoseLeftMostLeafIsThis(leaf) < currentPatch.numLayersMuted){
                continue;
            }

            playClip(
                playTime,
                calculateAudioClipSpeed(leaf),
                calculateAudioClipVolume(leaf)
            );
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