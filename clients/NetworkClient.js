import EventEmitter from 'node:events';
import {Socket} from 'node:net';
import PacketBuffer from "./AI/PacketBuffer"

class NetworkClient extends EventEmitter {
    constructor(address, port) {
        super();

        this.address = address;
        this.port = port;

        this.receiveMessageBind = this.receiveMessage.bind(this);

        this.socket = new Socket({keepalive: true, onread: this.receiveMessageBind})
        this.connect()
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Initialize connection & catch message to the server.
     */
    connect() {
        this.socket.connect({host: this.address, port: this.port})
        this.socket.on('data', this.receiveMessage.bind(this))
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
}

export default NetworkClient