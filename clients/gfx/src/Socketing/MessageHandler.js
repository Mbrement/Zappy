class MessageHandler {
    constructor() {
        this.handleConnectBind = this.handleConnect.bind(this)
        this.handleMessageBind = this.handleMessage.bind(this)
        this.handleErrorBind = this.handleError.bind(this)
        this.handleCloseBind = this.handleClose.bind(this)

        this.networkClient = null
        this.gameState = null
        this.world = null

        this.commands = {}
        const allMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        const commandMethods = allMethods.filter((method) => method.startsWith('cmd_'))
        commandMethods.forEach((method) => {
            const commandName = method.replace('cmd_', '')
            this.commands[commandName] = this[method].bind(this)
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Sets up the server communication handlers
     */
    setupHandlers() {
        this.networkClient = window.mainInstance.networkClient
        this.gameState = window.mainInstance.gameState
        this.broadcastManager = window.mainInstance.broadcastManager
        this.networkClient.on('connect', this.handleConnectBind)
        this.networkClient.on('message', this.handleMessageBind)
        this.networkClient.on('error', this.handleErrorBind)
        this.networkClient.on('close', this.handleCloseBind)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description When socket connection is created hide connection menu
     */
    handleConnect() {
        window.mainInstance.switchToGameUI()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description If socket connection fails or if an error occurs we show
     * the connection screen and display an error
     */
    handleError() {
        this.networkClient.off('connect', this.handleConnectBind)
        this.networkClient.off('message', this.handleMessageBind)
        this.networkClient.off('error', this.handleErrorBind)
        this.networkClient.off('close', this.handleCloseBind)
        window.mainInstance.connectError()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description If the socket closes we show the connection screen
     * and display an error
     */
    handleClose() {
        this.networkClient.off('connect', this.handleConnectBind)
        this.networkClient.off('message', this.handleMessageBind)
        this.networkClient.off('error', this.handleErrorBind)
        this.networkClient.off('close', this.handleCloseBind)
        window.mainInstance.connectionClosed()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Handles the messages comming in from the server
     */
    handleMessage(msg) {
        const command = msg.split(" ")
        if (!this.commands[command[0]]) {
            // console.log(this.commands)
            return
        }

        this.commands[command[0]](command)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the BIENVENUE command :
     * Once the server welcomes us we launch the 3D visualisation
     */
    cmd_BIENVENUE() {
        window.mainInstance.startVisualisation()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the msz command :
     * The server sends us the map size, we save it in the game state
     * @param {Array} command - the command and it's arguments:
     * command[1] = x size of the map
     * command[2] = y size of the map
     */
    cmd_msz(command) {
        if (command.length !== 3) {
            console.error("Received invalid map size from server", command)
            return
        }

        let x = parseInt(command[1])
        let y = parseInt(command[2])

        if (this.gameState.isCorrectCoordinates(x, y)) {
            return
        }

        this.gameState.setMapSize(x, y)

        this.world.gameMap.createMap()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the bct command :
     * The server sends us the content of a tile, we save it in the game state
     * @param {Array} command - the command and it's arguments
     */
    cmd_bct(command) {
        if (command.length !== 10) {
            console.error("Received invalid map tile content from server", command)
            return
        }

        let x = parseInt(command[1])
        let y = parseInt(command[2])

        if (!this.gameState.isCorrectCoordinates(x, y)) {
            return
        }

        const integerArguments = command.slice(3).map(Number)

        this.gameState.setTileContent(x, y, integerArguments)

        this.world.gameMap.loadTileResources(x, y)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the tna command :
     * The server sends us the name of a team, we save it in the game state
     * @param {Array} command - the command and it's arguments
     */
    cmd_tna(command) {
        if (command.length !== 2) {
            console.error("Received invalid team name from server", command)
            return
        }

        if (this.gameState.teams.has(command[1])) {
            return
        }

        this.gameState.addTeamName(command[1])
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pnw command :
     * The server sends us the information of a new player connection, we save it in the game state
     * @param {Array} command - the command and it's arguments
     */
    cmd_pnw(command) {
        if (command.length !== 7) {
            console.error("Received invalid new player connection from server", command)
            return
        }

        if (!this.gameState.teams.has(command[6])) {
            return
        }

        const integerArguments = command.slice(1, 6).map(Number)

        if (this.gameState.playerInfo.has(integerArguments[0])) {
            return
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[1], integerArguments[2])) {
            return
        }

        this.gameState.addNewPlayer(integerArguments, command[6])

        this.world.players.addPlayer(integerArguments.slice(0, 4), command[6])
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the ppo command :
     * The server sends us the new position of a player, we update it in the game state
     * @param {Array} command - the command and it's arguments
     */
    cmd_ppo(command) {
        if (command.length !== 5) {
            console.error("Received invalid player position from server", command)
            return
        }

        const integerArguments = command.slice(1).map(Number)

        if (!this.gameState.playerInfo.has(integerArguments[0])) {
            return
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[1], integerArguments[2])) {
            return
        }

        const oldState = Object.assign({}, this.gameState.playerInfo.get(integerArguments[0]))
        this.gameState.updatePlayerPosition(integerArguments)

        this.world.players.movePlayer(integerArguments, oldState)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the plv command :
     * The server sends us the new level of a player, we update it in the game state
     * @param {Array} command - the command and it's arguments
     */
    cmd_plv(command) {
        if (command.length !== 3) {
            console.error("Received invalid player level from server", command)
            return
        }

        const integerArguments = command.slice(1).map(Number)

        if (!this.gameState.playerInfo.has(integerArguments[0])) {
            return
        }

        this.gameState.updatePlayerLevel(integerArguments)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pin command :
     * The server sends us the inventory of a player, we update it in the game state
     * @param {Array} command - the command and it's arguments
     */
    cmd_pin(command) {
        if (command.length !== 11) {
            return
        }

        const integerArguments = command.slice(1).map(Number)

        if (!this.gameState.playerInfo.has(integerArguments[0])) {
            return
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[1], integerArguments[2])) {
            return
        }

        this.gameState.updatePlayerInventory(integerArguments)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pex command :
     * The server sends us the id of a player that is expelling
     * @param {Array} command - the command and it's arguments
     */
    cmd_pex(command) {
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pbc command :
     * The server sends us the id of a player that is broadcasting a message
     * @param {Array} command - the command and it's arguments
     */
    cmd_pbc(command) {
        if (command.length < 3) {
            return
        }

        let message = `#${command[1]}:`
        for (let i = 2; i < command.length; i++) {
            message += " " + command[i]
        }

        this.world.players.addPlayerBroadcast(parseInt(command[1]))

        this.broadcastManager.addBroadcast(message)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pic command :
     * The server sends us the ids of players that are starting an incantation
     * @param {Array} command - the command and it's arguments
     */
    cmd_pic(command) {
        if (command.length < 5) {
            return
        }

        const integerArguments = command.slice(1).map(Number)

        if (!this.gameState.isCorrectCoordinates(integerArguments[0], integerArguments[1])) {
            return
        }

        this.gameState.setIncantation(integerArguments)

        for (let i = 3; i < integerArguments.length; i++) {
            const playerId = integerArguments[i]
            const playerColor = this.gameState.playerInfo.get(playerId).color
            this.world.players.addPlayerIncantation(playerId, playerColor)
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pie command :
     * The server sends us the ids of players that are ending an incantation
     * @param {Array} command - the command and it's arguments
     */
    cmd_pie(command) {
        if (command.length !== 4) {
            return
        }

        const integerArguments = command.slice(1).map(Number)

        if (!this.gameState.isCorrectCoordinates(integerArguments[0], integerArguments[1])) {
            return
        }

        this.gameState.stopIncantation(integerArguments)
        // console.log("Received end of incantation on tiles", {x: integerArguments[0], y:integerArguments[1]})
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pfk command :
     * The server sends us the id of a player that is laying an egg
     * @param {Array} command - the command and it's arguments
     */
    cmd_pfk(command) {
        if (command.length !== 2) {
            return
        }

        // console.log(`Player ${parseInt(command[1])} has laid an egg`)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pdr command :
     * The server sends us the id of a player that is dropping a resource
     * @param {Array} command - the command and it's arguments
     */
    cmd_pdr(command) {
        if (command.length !== 3) {
            return
        }

        this.world.players.addPlayerDrop(parseInt(command[1]), parseInt(command[2]))
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pgt command :
     * The server sends us the id of a player that is taking a resource
     * @param {Array} command - the command and it's arguments
     */
    cmd_pgt(command) {
        if (command.length !== 3) {
            return
        }

        this.world.players.addPlayerPickUp(parseInt(command[1]), parseInt(command[2]))
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pdi command :
     * The server sends us the id of a player that has died, we remove it from the game state
     * @param {Array} command - the command and it's arguments
     */
    cmd_pdi(command) {
        if (command.length !== 2) {
            return
        }

        const id = parseInt(command[1])

        if (!this.gameState.playerInfo.has(id)) {
            return
        }

        const oldState = Object.assign({}, this.gameState.playerInfo.get(id))
        this.gameState.deletePlayer(id)

        this.world.players.removePlayer(id, oldState)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the enw command :
     * The server sends us the information of a new egg laid, we save it in the game state
     * @param {Array} command - the command and it's arguments
     */
    cmd_enw(command) {
        if (command.length !== 5) {
            return
        }

        const integerArguments = command.slice(1).map(Number)

        if (!this.gameState.isCorrectCoordinates(integerArguments[2], integerArguments[3]) ||
            !this.gameState.playerInfo.has(integerArguments[1]) ) {
            return
        }

        this.gameState.addEgg(integerArguments)

        this.world.players.addEgg(integerArguments)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the eht command :
     * The server sends us the id of an egg that has hatched
     * @param {Array} command - the command and it's arguments
     */
    cmd_eht(command) {
        if (command.length !== 2) {
            return
        }

        const id = parseInt(command[1])

        if (!this.gameState.eggInfo.has(id)) {
            return
        }


        const oldState = Object.assign({}, this.gameState.eggInfo.get(id))
        this.gameState.removeEgg(id)

        this.world.players.removeEgg(id, oldState)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the sgt command :
     * The server sends us the time unit
     * @param {Array} command - the command and it's arguments
     */
    cmd_sgt(command) {
        if (command.length !== 2) {
            console.error("Received invalid time unit from server", command)
        }

        this.world.players.setTimeUnit(parseInt(command[1]))
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the seg command :
     * The server sends us the end of game with the winning team
     * @param {Array} command - the command and it's arguments
     */
    cmd_seg(command) {
        if (command.length !== 2) {
            return
        }

        this.world.displayResults(command[1])
    }
}

module.exports = MessageHandler