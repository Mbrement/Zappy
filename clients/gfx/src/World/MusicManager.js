const EventEmitter = require('node:events')
const {soundtracks} = require("./sources")

class MusicManager extends EventEmitter {
    constructor() {
        super()

        this.selectedSoundTrack = 'Dwarf_fortress_OST'
        this.soundPromise = null
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
                audio.loop = soundtrack.loop

                audio.addEventListener('canplaythrough', () => {
                    resolve()
                }, { once: true })

                audio.addEventListener('error', (e) => {
                    if (audio.error.code === 3) {
                        return reject(e)
                    }
                    console.error(`Unable to play soundtrack: ${soundtrack.name}`, audio.error)
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
        if (!this.soundPromise || this.selectedSoundTrack === "The_sound_of_space") {
            return
        }

        this.soundtracks[this.selectedSoundTrack].pause()
        this.soundtracks[this.selectedSoundTrack].currentTime = 0
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Changes the soundtrack to a new one
     * @param newTrack - The name of the new soundtrack
     */
    switchSoundtrack(newTrack) {
        this.turnOffSoundtrack()
        this.selectedSoundTrack = newTrack
        if (newTrack !== "The_sound_of_space") {
            this.soundPromise = this.soundtracks[newTrack].play()
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Plays the default soundtrack
     */
    playDefault() {
        this.turnOffSoundtrack()
        this.soundPromise = this.soundtracks[this.selectedSoundTrack].play()
    }

    playBroadcast() {
        if (this.selectedSoundTrack !== "The_sound_of_space") {
            const broadcastSound = this.soundtracks['broadcast'].cloneNode()
            broadcastSound.volume = 0.02
            broadcastSound.play()
        }
    }
}

module.exports = MusicManager