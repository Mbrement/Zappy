class MessageHandler {
    constructor() {
        this.handleMessageBind = this.handleMessage.bind(this)
        this.handleErrorBind = this.handleError.bind(this)

        this.networkClient = null
        this.gameState = null
        this.gameMap = null

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
        const command = msg.split(" ")
        if (!this.commands[command[0]]) {
            console.log(this.commands)
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

        this.gameState.setMapSize(parseInt(command[1]), parseInt(command[2]))

        this.gameMap.createMap()
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
            return;
        }

        const integerArguments = command.slice(3).map(Number)

        this.gameState.setTileContent(x, y, integerArguments)

        this.gameMap.loadTileResources(x, y)
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

        const integerArguments = command.slice(1, 6).map(Number)

        this.gameState.addNewPlayer(integerArguments, command[6])
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


        this.gameState.updatePlayerPosition(integerArguments)
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

        this.gameState.updatePlayerInventory(integerArguments)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pex command :
     * The server sends us the id of a player that is expelling
     * @param {Array} command - the command and it's arguments
     */
    cmd_pex(command) {
        // TODO : Animate #n player expelling
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pbc command :
     * The server sends us the id of a player that is broadcasting a message
     * @param {Array} command - the command and it's arguments
     */
    cmd_pbc(command) {
        // TODO : Animate player #n broadcasting message
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

        // TODO : Animate incantation start of players #n

        this.gameState.setIncantation(integerArguments)
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

        // TODO : Animate incantation end of players #n based on R

        this.gameState.stopIncantation(integerArguments)
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

        // TODO : Animate player #n laying an egg
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

        // TODO : Animate player #n dropping resource i
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

        // TODO : Animate player #n taking resource i
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

        // TODO : Animate player #n dying

        this.gameState.deletePlayer(parseInt(command[1]))
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

        // TODO : Animate egg #e being laid by player #n at position (x, y)

        this.gameState.addEgg(integerArguments)
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

        // TODO : Animate egg #e hatching

        this.gameState.removeEgg(parseInt(command[1]))
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

        // TODO : Set time unit to T
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

        // TODO : Animate end of game and display winning team #n
    }

}

module.exports = MessageHandler