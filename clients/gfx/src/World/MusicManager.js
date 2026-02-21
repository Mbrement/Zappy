const EventEmitter = require('node:events')
const {soundtracks} = require("./sources")

class MusicManager extends EventEmitter {
    constructor() {
        super()

        this.sources = soundtracks
        this.soundtracks = {}

        this.loadSoundTracks()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Loads the soudtracks and emits the loaded event when finished
     */
    loadSoundTracks () {
        const loadPromises = this.sources.map((soundtrack) => {
            return new Promise((resolve, reject) => {
                const audio = new Audio(soundtrack.path)
                audio.volume = soundtrack.volume
                audio.loop = true

                audio.addEventListener('canplaythrough', () => {
                    resolve()
                }, { once: true })

                audio.addEventListener('error', (e) => {
                    console.error(`Failed to load soundtrack: ${soundtrack.name}`, e)
                    reject(e)
                }, { once: true })

                this.soundtracks[soundtrack.name] = audio
            })
        })

        Promise.all(loadPromises).then(() => {
            this.emit('loaded')
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Turns off all soundtracks and resets them
     */
    turnOffSoundtrack() {
        Object.keys(this.soundtracks).forEach((key) => {
            this.soundtracks[key].pause()
            this.soundtracks[key].currentTime = 0
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Changes the soundtrack to a new one
     * @param newTrack - The name of the new soundtrack
     */
    switchSoundtrack(newTrack) {
        this.turnOffSoundtrack()
        this.soundtracks[newTrack].play()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Plays the default soundtrack
     */
    playDefault() {
        this.turnOffSoundtrack()
        this.soundtracks['Ghost_n’_Goblins_(CPC_6128)_OST'].play()
    }
}

module.exports = MusicManager