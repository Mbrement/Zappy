const NetworkClient = require('./Socketing/NetworkClient');
const MessageHandler = require("./Socketing/MessageHandler");
const EventManager = require('./Interfaces/js/EventManager')
const BroadcastManager = require('./Interfaces/js/modules/BroadcastManager')
const PlayerInfoManager = require("./Interfaces/js/modules/PlayerInfoManager");
const World = require("./World/World");
const GameState = require("./World/GameState");
const {textures} = require("./World/sources");
const Resources = require("./World/Utils/Resources");

class Main {
    constructor() {
        if (window.mainInstance) {
            return window.mainInstance
        }
        window.mainInstance = this

        this.gameState = new GameState();
        this.eventManager = new EventManager();
        this.broadcastManager = new BroadcastManager()
        this.playerInfoManager = new PlayerInfoManager()
        this.messageHandler = new MessageHandler();
        this.resources = new Resources(textures);

        // TODO : Remove this
        // for (let i = 0; i < 50; i++) {
        //     for (let j = 0; j < 50; j++) {
        //         console.log(`bct ${j} ${i} ${Math.floor(Math.random() * 5)} ${Math.floor(Math.random() * 5)} ${Math.floor(Math.random() * 5)} ${Math.floor(Math.random() * 5)} ${Math.floor(Math.random() * 5)} ${Math.floor(Math.random() * 5)} ${Math.floor(Math.random() * 5)}`)
        //     }
        // }

        this.world = new World()
        this.resources.once('loaded', () => {
            this.switchToConnectionMenu()
        })
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
     * @description Got connection error - We show the connection menu
     */
    connectError() {
        this.networkClient = null
        this.switchToConnectionMenu()
        this.eventManager.modules.ConnectMenu.addError("Failed to connect")
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Switch UI to connection menu
     */
    switchToConnectionMenu() {
        this.eventManager.modules.ConnectMenu.showConnectMenu()

        const broadcastContainer = document.getElementById('broadcastContainer')
        broadcastContainer.classList.add('hidden')

        const tilesPlayerInfoContainer = document.getElementById('tilesPlayerInfoContainer')
        tilesPlayerInfoContainer.classList.add('hidden')

        const changeThemeMusicContainer = document.getElementById('changeThemeMusicContainer')
        changeThemeMusicContainer.classList.add('hidden')
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Switch UI to game UI
     */
    switchToGameUI() {
        this.eventManager.modules.ConnectMenu.hideConnectMenu()

        const broadcastContainer = document.getElementById('broadcastContainer')
        broadcastContainer.classList.remove('hidden')

        const tilesPlayerInfoContainer = document.getElementById('tilesPlayerInfoContainer')
        tilesPlayerInfoContainer.classList.remove('hidden')

        const changeThemeMusicContainer = document.getElementById('changeThemeMusicContainer')
        changeThemeMusicContainer.classList.remove('hidden')
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Hides the connectMenu and starts the 3D visualisation
     */
    startVisualisation() {
        this.world.createWorld()
        this.messageHandler.world = window.worldInstance
        this.networkClient.send("GRAPHIC\n")
    }
}

module.exports = new Main()