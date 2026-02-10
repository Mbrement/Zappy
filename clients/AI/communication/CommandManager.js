import {BROADCAST, DEATH, MAX_SERVER_MSG, NO_PROMISE_TO_RESOLVE, WELCOME} from "../constant.js";
import GameManager from "../GameManager.js";

class CommandManager {
    #inProcessQueue = []
    #waitingQueue = []
    constructor(networkClient) {
        this.networkClient = networkClient;

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
            this.#inProcessQueue.push(request)
            this.networkClient.send(request.command)

            if (this.#inProcessQueue.length > 0) {
                this.trySend()
            }
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
            return;
        }

        if (message === BROADCAST) {
            // TODO: define brodacast
            console.log('Server broadcast :', message)
            return
        }

        if (message === DEATH) {
            // TODO: Define exit routine
            return;
        }

        if (this.#inProcessQueue.length <= 0) {
            console.error(NO_PROMISE_TO_RESOLVE)
            return
        }

        this.#inProcessQueue.at(0).answer.push(message)
        this.#inProcessQueue.at(0).expectedAnswerCount--
        console.log(this.#inProcessQueue.at(0))

        if (this.#inProcessQueue.at(0).expectedAnswerCount === 0) {
            console.log('resolved promise')
            const requestToResolve = this.#inProcessQueue.shift()

            requestToResolve.resolve(requestToResolve.answer)
            this.trySend()
        }
    }
}

export default CommandManager