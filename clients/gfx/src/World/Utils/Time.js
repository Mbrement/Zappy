const EventEmitter = require('node:events')

class Time extends EventEmitter {
    /**
     * @author Emma (epolitze) Politzer
     * @description Manages the time properties and the tick event
     */
    constructor() {
        super()

        this.start = Date.now()
        this.current = this.start
        this.currentInSeconds =  this.start * 0.001
        this.elapsed = 0
        this.delta = 16
        this.deltaInSecond = this.delta * 0.001

        this.request = requestAnimationFrame(() => {
            this.tick()
        })
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the time properties, trigger the tick event and request a new frame
     */
    tick () {
        const current = Date.now()
        this.delta = current - this.current
        this.deltaInSecond = this.delta * 0.001
        this.current = current
        this.currentInSeconds = current * 0.001
        this.elapsed = this.current - this.start

        this.emit('tick')

        this.request = requestAnimationFrame(() => {
            this.tick()
        })
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Clenup the time
     */
    cleanup() {
        cancelAnimationFrame(this.request)

        for (const properties in this) {
            this[properties] = null
        }
    }
}

module.exports = Time