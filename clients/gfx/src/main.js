const NetworkClient = require('./Socketing/NetworkClient');
const MessageHandler = require("./Socketing/MessageHandler");
const EventManager = require('./Interfaces/js/EventManager')
const World = require("./World/World");
const GameState = require("./World/GameState");

class Main {
    constructor() {
        if (window.mainInstance) {
            return window.mainInstance
        }

        this.gameState = new GameState();
        this.eventManager = new EventManager();
        this.messageHandler = new MessageHandler();

        window.mainInstance = this
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Connects to the server
     * @param address - Address of the server
     * @param port - Port of the server
     */
    connectToServer(address, port) {
        this.networkClient = new NetworkClient(address, port);
        this.messageHandler.setupHandlers()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Hides the connectMenu and starts the 3D visualisation
     */
    startVisualisation() {
        this.eventManager.modules.ConnectMenu.hideConnectMenu()
        this.networkClient.send("GRAPHIC\n")
        this.world = new World()
        this.world.createWorld()
    }
}

module.exports = new Main()