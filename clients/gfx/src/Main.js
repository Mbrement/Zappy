const EventEmitter = require('node:events')
const { FontLoader } = require('three/addons/loaders/FontLoader.js')
const NetworkClient = require('./Socketing/NetworkClient');
const MessageHandler = require("./Socketing/MessageHandler");
const EventManager = require('./Interfaces/js/EventManager')
const BroadcastManager = require('./Interfaces/js/modules/BroadcastManager')
const PlayerInfoManager = require("./Interfaces/js/modules/PlayerInfoManager");
const MusicManager = require("./World/MusicManager");
const World = require("./World/World");
const GameState = require("./World/GameState");
const {textures} = require("./World/sources");
const Resources = require("./World/Utils/Resources");

class Main extends EventEmitter {
    constructor() {
        super()

        if (window.mainInstance) {
            return window.mainInstance
        }
        window.mainInstance = this

        this.musicManager = new MusicManager()
        this.gameState = new GameState();
        this.eventManager = new EventManager();
        this.broadcastManager = new BroadcastManager()
        this.playerInfoManager = new PlayerInfoManager()
        this.messageHandler = new MessageHandler();
        this.resources = new Resources(textures);
        this.fontLoader = new FontLoader()

        this.world = new World()
        this.loadFont()
        this.once('loadedFonts', () => {
            this.musicManager.once('loaded', () => {
                this.resources.once('loaded', () => {
                    this.switchToConnectionMenu(true)
                })
            })
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * Edited by: Corentin (ccharton) Charton
     * @description Loads the Poppins SemiBold font
     */
    loadFont() {
        this.fontLoader.load(
            "static://fonts/PoppinsSemiBold.json",
            (font) => {
                window.font = font
                this.emit('loadedFonts')
            }
        )
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
        this.networkClient?.closeSocket()
        this.networkClient = null
        if (this.eventManager.modules.TileInfoManager.isTilesPlayerInfoOpen()) {
            this.eventManager.modules.TileInfoManager.showHideTilesPlayerInfo()
        }
        this.switchToConnectionMenu()
        this.eventManager.modules.ConnectMenu.addError("Failed to connect")
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Connection was closed - We show the connection menu
     */
    connectionClosed() {
        this.networkClient = null
        if (this.eventManager.modules.TileInfoManager.isTilesPlayerInfoOpen()) {
            this.eventManager.modules.TileInfoManager.showHideTilesPlayerInfo()
        }
        this.switchToConnectionMenu()
        this.eventManager.modules.ConnectMenu.addError("Connection closed")
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Switch UI to connection menu
     * @param init - If it is called right after initialization or not
     */
    switchToConnectionMenu(init=false) {
        this.eventManager.modules.ConnectMenu.showConnectMenu()

        if (!init) {
            this.world.reset()
            this.musicManager.turnOffSoundtrack()
            this.gameState.reset()
        }

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

        this.world.themeManager.switchSky('Dark_Theme')
        this.musicManager.playDefault()

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