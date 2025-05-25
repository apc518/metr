const audioSampleOptions = [
    {
        filepath: "assets/sounds/Fracture Rim 03.wav",
        displayName: "Short Blip"
    },
    {
        filepath: "assets/sounds/HouseGen Rim 07.wav",
        displayName: "Part-Pitched Blip"
    },
    {
        filepath: "assets/sounds/Fracture Rim 01.wav",
        displayName: "Loud Rim"
    },
    {
        filepath: "assets/sounds/Volt SatRim 04.wav",
        displayName: "Fully Pitched Blip"
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
            let decodedData = await fetch(opt.filepath)
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

class Clip {
    constructor(audioBuffer, name){
        // input
        this.name = name;
        this.audioBuffer = audioBuffer;
    }

    play(time, speed){
        let source = audioCtx.createBufferSource();
        let gainNode = audioCtx.createGain();
        gainNode.gain.value = globalVolume;
        if(this.audioBuffer){
            source.buffer = this.audioBuffer;
            source.playbackRate.value = speed;

            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            source.start(time);
        }
    }
}