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
     * @description Handles the messages coming in from the server
     */
    handleMessage(msg) {
        const command = msg.split(" ")

        let finalCommandArray = command.filter(function (element) {
            return element;
        })

        if (!this.commands[command[0]]) {
            return
        }

        this.commands[finalCommandArray[0]](finalCommandArray)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Parses the given string as a number and makes sure it is valid
     * @param number - The number we want to parse
     * @returns {number|null} - The converted number or null if it isn't valid
     */
    parseNumber(number) {
        if (!number) {
            console.error(`Invalid argument: ${number}`)
            return null
        }

        if (!/^\d+$/.test(number)) {
            console.error(`Invalid argument: ${number}, must be a positive integer`)
            return null
        }

        return parseInt(number);
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Checks if the given resource type is valid
     * @param resourceType - the number of the resource to be checked
     * @returns {boolean} - Whether the resource type is valid
     */
    isValidResource(resourceType) {
        if (resourceType < 0 || resourceType > 6) {
            console.error(`Invalid resource: ${resourceType}, must be between 0 and 6`)
            return false
        }
        return true
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        let x = this.parseNumber(command[1])
        let y = this.parseNumber(command[2])
        if (x === null || y === null) {
            return;
        }

        if (this.gameState.isCorrectCoordinates(x, y)) {
            console.error(`Invalid coordinates x: ${x}, y: ${y}`)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        let x = this.parseNumber(command[1])
        let y = this.parseNumber(command[2])
        if (x === null || y === null) {
            return;
        }

        if (!this.gameState.isCorrectCoordinates(x, y)) {
            console.error(`Invalid coordinates x: ${x}, y: ${y}`)
            return
        }

        const integerArguments = command.slice(3)
        for (let i = 0; i < integerArguments.length; i++) {
            integerArguments[i] = this.parseNumber(integerArguments[i])
            if (integerArguments[i] === null) {
                return
            }
        }

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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        if (this.gameState.teams.has(command[1])) {
            console.error(`Team name ${command[1]} already exists`)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        if (!this.gameState.teams.has(command[6])) {
            console.error(`Team name ${command[1]} doesn't exists`)
            return
        }

        const integerArguments = command.slice(1, 6)
        for (let i = 0; i < integerArguments.length; i++) {
            integerArguments[i] = this.parseNumber(integerArguments[i])
            if (integerArguments[i] === null) {
                return
            }
        }

        if (this.gameState.playerInfo.has(integerArguments[0])) {
            console.error(`Player ${integerArguments[0]} does not exist`)
            return
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[1], integerArguments[2])) {
            console.error(`Invalid coordinates x: ${integerArguments[1]}, y: ${integerArguments[2]}`)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const integerArguments = command.slice(1)
        for (let i = 0; i < integerArguments.length; i++) {
            integerArguments[i] = this.parseNumber(integerArguments[i])
            if (integerArguments[i] === null) {
                return
            }
        }

        if (!this.gameState.playerInfo.has(integerArguments[0])) {
            console.error(`Player ${integerArguments[0]} does not exist`)
            return
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[1], integerArguments[2])) {
            console.error(`Invalid coordinates x: ${integerArguments[1]}, y: ${integerArguments[2]}`)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const integerArguments = command.slice(1)
        for (let i = 0; i < integerArguments.length; i++) {
            integerArguments[i] = this.parseNumber(integerArguments[i])
            if (integerArguments[i] === null) {
                return
            }
        }

        if (!this.gameState.playerInfo.has(integerArguments[0])) {
            console.error(`Player ${integerArguments[0]} does not exist`)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const integerArguments = command.slice(1)
        for (let i = 0; i < integerArguments.length; i++) {
            integerArguments[i] = this.parseNumber(integerArguments[i])
            if (integerArguments[i] === null) {
                return
            }
        }

        if (!this.gameState.playerInfo.has(integerArguments[0])) {
            console.error(`Player ${integerArguments[0]} does not exist`)
            return
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[1], integerArguments[2])) {
            console.error(`Invalid coordinates x: ${integerArguments[1]}, y: ${integerArguments[2]}`)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        let message = `#${command[1]}:`
        for (let i = 2; i < command.length; i++) {
            message += " " + command[i]
        }

        const playerId = this.parseNumber(command[1])
        if (playerId === null) {
            return
        }

        if (!this.gameState.playerInfo.has(playerId)) {
            console.error(`Player ${playerId} does not exist`)
            return
        }

        this.world.players.addPlayerBroadcast(playerId, message)

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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const integerArguments = command.slice(1)
        for (let i = 0; i < integerArguments.length; i++) {
            integerArguments[i] = this.parseNumber(integerArguments[i])
            if (integerArguments[i] === null) {
                return
            }
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[0], integerArguments[1])) {
            console.error(`Invalid coordinates x: ${integerArguments[0]}, y: ${integerArguments[1]}`)
            return
        }

        this.gameState.setIncantation(integerArguments)

        for (let i = 3; i < integerArguments.length; i++) {
            const playerId = integerArguments[i]
            const player = this.gameState.playerInfo.get(playerId)

            if (!player) {
                console.error(`Player ${playerId} does not exist`)
                continue
            }

            const playerColor = player.color
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        let integerArguments = command.slice(1)
        for (let i = 0; i < integerArguments.length; i++) {
            integerArguments[i] = this.parseNumber(integerArguments[i])
            if (integerArguments[i] === null) {
                return
            }
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[0], integerArguments[1])) {
            console.error(`Invalid coordinates x: ${integerArguments[0]}, y: ${integerArguments[1]}`)
            return
        }

        this.gameState.stopIncantation(integerArguments)

        for (let i = 3; i < integerArguments.length; i++) {
            let playerId = integerArguments[i]
            let player = this.gameState.playerInfo.get(playerId)

            if (!player) {
                console.error(`Player ${playerId} does not exist`)
                integerArguments = integerArguments.filter((id) => {
                    return playerId === id
                })
            }
        }
        this.world.players.stopIncantation(integerArguments)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description handles the pfk command :
     * The server sends us the id of a player that is laying an egg
     * @param {Array} command - the command and it's arguments
     */
    cmd_pfk(command) {
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const playerId = this.parseNumber(command[1])
        const resourceType = this.parseNumber(command[2])
        if (playerId === null || resourceType === null) {
            return
        }

        if (!this.gameState.playerInfo.has(playerId)) {
            console.error(`Player ${playerId} does not exist`)
            return
        }

        if (!this.isValidResource(resourceType)) {
            return
        }

        this.world.players.addPlayerDrop(playerId, resourceType)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const playerId = this.parseNumber(command[1])
        const resourceType = this.parseNumber(command[2])
        if (playerId === null || resourceType === null) {
            return
        }

        if (!this.gameState.playerInfo.has(playerId)) {
            console.error(`Player ${playerId} does not exist`)
            return
        }

        if (!this.isValidResource(resourceType)) {
            return
        }

        this.world.players.addPlayerPickUp(playerId, resourceType)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const playerId = this.parseNumber(command[1])
        if (playerId === null) {
            return
        }

        if (!this.gameState.playerInfo.has(playerId)) {
            console.error(`Player ${playerId} does not exist`)
            return
        }

        const oldState = Object.assign({}, this.gameState.playerInfo.get(playerId))
        this.gameState.deletePlayer(playerId)

        this.world.players.removePlayer(playerId, oldState)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const integerArguments = command.slice(3)
        integerArguments.unshift(command[1])
        for (let i = 0; i < integerArguments.length; i++) {
            integerArguments[i] = this.parseNumber(integerArguments[i])
            if (integerArguments[i] === null) {
                return
            }
        }

        if (!this.gameState.isCorrectCoordinates(integerArguments[1], integerArguments[2])) {
            console.error(`Invalid coordinates x: ${integerArguments[1]}, y: ${integerArguments[2]}`)
            return
        }

        this.gameState.addEgg(integerArguments)

        this.world.players.addEgg(integerArguments, command[2])
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const eggId = this.parseNumber(command[1])
        if (eggId === null) {
            return
        }

        if (!this.gameState.eggInfo.has(eggId)) {
            console.error(`Egg ${eggId} does not exist`)
            return
        }

        const oldState = Object.assign({}, this.gameState.eggInfo.get(eggId))
        this.gameState.removeEgg(eggId)

        this.world.players.removeEgg(eggId, oldState)
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
            return
        }

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        const timeUnit = this.parseNumber(command[1])
        if (timeUnit === null) {
            console.error("Received invalid time unit from server", command)
            return
        }

        this.world.players.setTimeUnit(timeUnit)
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

        if (!this.world.gameRunning) {
            console.error("Game was never started", command)
            return
        }

        this.world.displayResults(command[1])
    }
}

module.exports = MessageHandler