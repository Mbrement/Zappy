import process from 'node:process'
import {
    AVAILABLE_CONNECTION,
    BROADCAST_RECEIVED_REGEX,
    DEATH, EXPULSION_REGEX, INCANTATION, INCANTATION_CMD, INCANTATION_DONE, INVENTORY, KO, MAP_SIZE_REGEX,
    MAX_SERVER_MSG,
    NO_PROMISE_TO_RESOLVE, OK, ONLY_NUMBER_REGEX, SEE, START_INCANTION,
    WELCOME
} from "../constant.js"
import GameManager from "../GameManager.js"

class CommandManager {
    #inProcessQueue = []
    #waitingQueue = []
    constructor(networkClient) {
        this.networkClient = networkClient

        this.handleResponseBind = this.handleResponse.bind(this)

        this.networkClient.on('message', this.handleResponseBind)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @param message {String} - The message to send to the server.
     * @param expectedAnswerCount {Number} - The number of expected answer from the server to resolve the promise.
     * @return {Promise<String>} - The created promise that will resolve with the server response.
     */
    sendCommand(message, expectedAnswerCount = 1) {
    return new Promise((resolve, reject) => {

        const request = {
            command: message,
            resolve: resolve,
            reject: reject,
            expectedAnswerCount: expectedAnswerCount,
            answer: []
        }

        this.#waitingQueue.push(request)

        this.trySend()
    })
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to send message to the server if the queue is not full.
     */
    trySend() {
        if (this.#inProcessQueue.length < MAX_SERVER_MSG && this.#waitingQueue.length > 0) {
            const request = this.#waitingQueue.shift()
            if (request.expectedAnswerCount > 0) {
                this.#inProcessQueue.push(request)
            }
            this.networkClient.send(request.command)

            if (this.#inProcessQueue.length > 0) {
                this.trySend()
            }
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Check if the send response is valid for the current command to resolve.
     * @param command {String} - The command to resolve.
     * @param response {String} - The response send by the server.
     * @return {boolean} - Whether the response match the command to resolve or not.
     */
    isValidResponse(command, response) {
        const cmd = command.trim().split(" ")[0]

        if (cmd === GameManager.teamName) {
            return ONLY_NUMBER_REGEX.test(response) || MAP_SIZE_REGEX.test(response)
        }

        if (cmd === SEE || cmd === INVENTORY) {
            return response.startsWith("{") && response.endsWith("}")
        }

        if (cmd === AVAILABLE_CONNECTION) {
            return ONLY_NUMBER_REGEX.test(response)
        }

        if (cmd === INCANTATION) {
            return response === START_INCANTION || INCANTATION_DONE.test(response)
        }

        return response === OK || response === KO
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Check if the response send by the server match the current command to resolve
     * @param message {String} - The response send by the server
     */
    flushDroppedCommands(message) {
        while (this.#inProcessQueue.length > 0) {
            const currentRequest = this.#inProcessQueue[0]

            if (this.isValidResponse(currentRequest.command, message)) {
                break
            }

            console.warn(`[COMMAND MANAGER] Command dropped: ${currentRequest.command}. Received instead: ${message}`)
            const droppedReq = this.#inProcessQueue.shift()

            const fallbackAnswer = [...droppedReq.answer]
            while (droppedReq.expectedAnswerCount > 0) {
                fallbackAnswer.push("ko")
                droppedReq.expectedAnswerCount--
            }

            droppedReq.resolve(fallbackAnswer)
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Handle the response from the server and push waiting one if it's not death or broadcast.
     * @param message {String} - The response send by the server
     */
    handleResponse(message) {
        if (message === WELCOME) {
            GameManager.handshakeServer()
            return
        }

        if (BROADCAST_RECEIVED_REGEX.test(message)) {
            console.log('Server broadcast :', message)
            GameManager.handleBroadcastMessage(message)
            return
        }

        if (message === DEATH) {
            console.log('[COMMAND MANAGER] Server send death threat, Exiting...')
            process.exit(0)
        }

        if (EXPULSION_REGEX.test(message)) {
            console.log(`[COMMAND MANAGER] Player expulse from it's tile (${message})`)

            GameManager.lastVisionRefresh = 0

            if (GameManager.followedBroadcast) {
                GameManager.followedBroadcast.direction = -1
            }

            return
        }

        if (message === START_INCANTION) {
            const isIncantationFromThisAI = this.#inProcessQueue.length > 0 &&
                this.#inProcessQueue[0].command === INCANTATION_CMD

            if (!isIncantationFromThisAI) {
                console.log("[COMMAND MANAGER] Elevation started by another player. Freezing current command.")
                return
            }
        }

        if (INCANTATION_DONE.test(message)) {
            const isIncantationFromThisAI = this.#inProcessQueue.length > 0 &&
                this.#inProcessQueue[0].command === INCANTATION_CMD

            if (!isIncantationFromThisAI) {
                const newLevel = parseInt(message.split(':')[1].trim())
                console.log(`[COMMAND MANAGER] Elevation from an other player has been done: ${newLevel}`)

                GameManager.updateLevel(newLevel)
                GameManager.followedBroadcast = null
                GameManager.lastVisionRefresh = 0
                GameManager.main.brain.think()
                return
            }
        }

        this.flushDroppedCommands(message)

        if (this.#inProcessQueue.length <= 0) {
            console.error(NO_PROMISE_TO_RESOLVE, message)
            this.trySend()
            return
        }

        this.#inProcessQueue.at(0).answer.push(message)
        this.#inProcessQueue.at(0).expectedAnswerCount--
        console.log(this.#inProcessQueue.at(0))

        if (this.#inProcessQueue.at(0).expectedAnswerCount === 0) {
            console.log('resolved promise')
            const requestToResolve = this.#inProcessQueue.shift()

            requestToResolve.resolve(requestToResolve.answer)
            GameManager.updateFoodAndInternalClock(requestToResolve.command.trim().split(' ').at(0))
            this.trySend()
        }
    }
}

export default CommandManager