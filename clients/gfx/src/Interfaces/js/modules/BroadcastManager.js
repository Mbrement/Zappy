class BroadcastManager {
    constructor() {
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Clears the broadcast container
     */
    clearBroadcast() {
        const broadcastContainer = document.getElementById('broadcastContainer')
        if (broadcastContainer) {
            while (broadcastContainer.firstChild) {
                broadcastContainer.removeChild(broadcastContainer.firstChild)
            }
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Adds a message to the broadcast container
     * @param messageToAdd {String} - The message to add
     */
    addBroadcast(messageToAdd) {
        if(messageToAdd.length === 0) {
            return
        }

        const para = document.createElement('p')
        para.textContent = messageToAdd

        const broadcastContainer = document.getElementById('broadcastContainer')
        if (broadcastContainer) {
            broadcastContainer.appendChild(para)
        }
    }
}

module.exports = new BroadcastManager()