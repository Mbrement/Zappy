class MessageHandler {
    constructor() {
        this.handleMessageBind = this.handleMessage.bind(this)
        this.handleErrorBind = this.handleError.bind(this)

        this.networkClient = null
        this.gameState = null

        this.commands = new Map()
        this.commands["BIENVENUE"] = this.welcome.bind(this)
        this.commands["msz"] = this.mapSize.bind(this)
        this.commands["bct"] = this.mapTileContent.bind(this)
        this.commands["tna"] = this.teamName.bind(this)
        this.commands["pnw"] = this.newPlayerConnection.bind(this)
        this.commands["ppo"] = this.playerPosition.bind(this)
        this.commands["plv"] = this.playerLevel.bind(this)
        this.commands["pin"] = this.playerInventory.bind(this)
        this.commands["pex"] = this.playerExpelled.bind(this)
        this.commands["pbc"] = this.playerBroadcast.bind(this)
        this.commands["pic"] = this.incantationStart.bind(this)
        this.commands["pie"] = this.incantationEnd.bind(this)
        this.commands["pfk"] = this.playerLaysEgg.bind(this)
        this.commands["pdr"] = this.playerDropsResource.bind(this)
        this.commands["pgt"] = this.playerTakesResource.bind(this)
        this.commands["pdi"] = this.playerDies.bind(this)
        this.commands["enw"] = this.eggIsLaid.bind(this)
        this.commands["eht"] = this.eggHatches.bind(this)
        this.commands["ebo"] = this.playerConnectsForEgg.bind(this)
        this.commands["edi"] = this.hatchedEggDies.bind(this)
        this.commands["sgt"] = this.timeUnit.bind(this)
        this.commands["seg"] = this.endOfGame.bind(this)
        this.commands["smg"] = this.serverMessage.bind(this)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Sets up the server communication handlers
     */
    setupHandlers() {
        this.networkClient = window.mainInstance.networkClient
        this.gameState = window.mainInstance.gameState
        this.networkClient.on('message', this.handleMessageBind)
        this.networkClient.on('error', this.handleErrorBind)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description If socket connection fails or if an error occurs we show
     * the connection screen and display an error
     */
    handleError() {
        window.mainInstance.eventManager.modules.ConnectMenu.showConnectMenu()
        window.mainInstance.eventManager.modules.ConnectMenu.showConnectionError("Couldn't connect to server")
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Handles the messages comming in from the server
     */
    handleMessage(msg) {
        console.log("Just recieved message", msg)
        const command = msg.split(" ")
        if (!this.commands[command[0]]) {
            console.log(this.commands)
            return
        }

        this.commands[command[0]](command)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the BIENVENUE command : command :
     * Once the server welcomes us we launch the 3D visualisation
     */
    welcome() {
        window.mainInstance.startVisualisation()
        console.log("Received welcome message from server, starting visualisation")
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the msz command :
     * The server sends us the map size, we save it in the game state
     * @param {Array} command - the command and it's arguments:
     * command[1] = x size of the map
     * command[2] = y size of the map
     */
    mapSize(command) {
        if (command.length !== 3 || !/^\d+$/.test(command[1]) || !/^\d+$/.test(command[2])) {
            console.error("Received invalid map size from server", command)
            return
        }

        this.gameState.setMapSize(parseInt(command[1]), parseInt(command[2]))
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the bct command :
     * @param {Array} command - the command and it's arguments
     */
    mapTileContent(command) {
        if (command.length !== 10) {
            console.error("Received invalid map tile content from server", command)
            return
        }

        const resources = command.slice(3)

        for (let resource of resources) {
            if (!/^\d+$/.test(resource)) {
                console.error("Received invalid map tile content from server", command)
                return
            }
            resource = parseInt(resource)
        }

        this.gameState.setTileContent(parseInt(command[1]), parseInt(command[2]), resources)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the tna command :
     * @param {Array} command - the command and it's arguments
     */
    teamName(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pnw command :
     * @param {Array} command - the command and it's arguments
     */
    newPlayerConnection(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the ppo command :
     * @param {Array} command - the command and it's arguments
     */
    playerPosition(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the plv command :
     * @param {Array} command - the command and it's arguments
     */
    playerLevel(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pin command :
     * @param {Array} command - the command and it's arguments
     */
    playerInventory(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pex command :
     * @param {Array} command - the command and it's arguments
     */
    playerExpelled(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pbc command :
     * @param {Array} command - the command and it's arguments
     */
    playerBroadcast(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pic command :
     * @param {Array} command - the command and it's arguments
     */
    incantationStart(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pie command :
     * @param {Array} command - the command and it's arguments
     */
    incantationEnd(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pfk command :
     * @param {Array} command - the command and it's arguments
     */
    playerLaysEgg(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pdr command :
     * @param {Array} command - the command and it's arguments
     */
    playerDropsResource(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pgt command :
     * @param {Array} command - the command and it's arguments
     */
    playerTakesResource(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pdi command :
     * @param {Array} command - the command and it's arguments
     */
    playerDies(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the enw command :
     * @param {Array} command - the command and it's arguments
     */
    eggIsLaid(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the eht command :
     * @param {Array} command - the command and it's arguments
     */
    eggHatches(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the ebo command :
     * @param {Array} command - the command and it's arguments
     */
    playerConnectsForEgg(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the edi command :
     * @param {Array} command - the command and it's arguments
     */
    hatchedEggDies(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the sgt command :
     * @param {Array} command - the command and it's arguments
     */
    timeUnit(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the seg command :
     * @param {Array} command - the command and it's arguments
     */
    endOfGame(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the smg command :
     * @param {Array} command - the command and it's arguments
     */
    serverMessage(command) {
    }


}

module.exports = MessageHandler