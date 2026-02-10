class PacketBuffer {
    #buffer = ''

    constructor() {
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Store the message received by the server.
     * @param packet {string} - The received string to store.x
     */
    push(packet) {
        if (packet.length !== 0) {
            this.#buffer += packet.replaceAll('\\n', '\n')
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to extract completed string from buffer and return it.
     * returns {string[]} - The extracted array of message from the buffer or an empty array.
     */
    extractMessage() {
        if (!this.#buffer.includes('\n')) {
            return []
        }

        const messageArray = this.#buffer.split('\n')
        this.#buffer = messageArray.pop()

        console.log('Message Array:', messageArray)
        console.log('Buffer:', this.#buffer)

        return messageArray
    }
}

module.exports = new PacketBuffer()