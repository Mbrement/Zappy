const EventEmitter = require('node:events')
const {Socket} = require('node:net')
const PacketBuffer = require('./PacketBuffer.js')

class NetworkClient extends EventEmitter {
    constructor(address, port) {
        super();

        this.address = address;
        this.port = port;

        this.receiveMessageBind = this.receiveMessage.bind(this);
        this.socketErrorBind = this.socketError.bind(this);


        this.socket = new Socket({keepalive: true, onread: this.receiveMessageBind})
        this.connect()
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Initialize connection & catch message to the server.
     */
    connect() {
        this.socket.connect({host: this.address, port: this.port})
        this.socket.on('data', this.receiveMessageBind)
        this.socket.on('error', this.socketErrorBind)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Send a message to the server.
     */
    send(message) {
        this.socket.write(message)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Receive a message from the server and try to extract completed message from the buffer.
     * @param message {Buffer} - The message from server.
     */
    receiveMessage(message) {
        console.log('receive Message with buffer :', message.toString())
        PacketBuffer.push(message.toString())

        const messageArray = PacketBuffer.extractMessage()
        for (const message of messageArray) {
            this.emit('message', message)
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Handle socket error and exit process.
     * @param event {Object} -  The error Object from the socket.
     */
    socketError(event) {
        console.log('An error on the socket connection has occured:', event.message)
        console.log('AI client will now exit...')
        if (!this.socket.destroyed) {
            this.socket.destroy()
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Close the socket connection.
     */
    closeSocket() {
        this.socket.end()
        this.socket.destroy()
    }
}

module.exports = NetworkClient