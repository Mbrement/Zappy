import Main from "./Main.js";
import {
    BROAD_ALIVE,
    BROAD_CANCEL,
    BROAD_NEED_PLAYER,
    BROAD_WITH_PLAYER,
    BROADCAST,
    COMMAND_COST,
    HEARTBEAT_TIMEOUT,
    NO_SPACE_AVAILABLE,
    ONLY_NUMBER_REGEX,
} from "./constant.js"

class GameManager {
    constructor() {
        this.main = new Main()

        this.ready = false
        this.awaitRessourcesAvailableFromMain()

        this.inventory = {
            nourriture: 1260,
            linemate: 0,
            deraumere: 0,
            sibur: 0,
            mendiane: 0,
            phiras: 0,
            thystame: 0
        }
        this.lastInventoryRefresh = 0

        this.level = 1
        this.mapSize = {x: -1, y: -1}

        this.vision = []
        this.lastVisionRefresh = 0

        this.followedBroadcast = null
        this.elevationReadyPlayers = new Set()


        this.teamRegistry = new Map()
        this.internalTicks = 0
        this.lastHeartbeatTick = 0

        this.needToFork = false
        this.elevationCooldown = 0
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Await main class is fully declared to get some class from it
     * @returns {Promise<void>}
     */
    async awaitRessourcesAvailableFromMain() {
        while(!this.main.commandManager && !this.main.responseParser) {
            await new Promise((resolve) => {setTimeout(resolve, 100)})
        }

        this.teamName = this.main.config.teamName
        this.commandManager = this.main.commandManager
        this.responseParser = this.main.responseParser
        this.ready = true
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the internal inventory state based on server response.
     * @param inventoryData {String} - The new inventory to parse.
     */
    updateInventory(inventoryData) {
        if (!inventoryData) {
            return
        }

        const parsedInventory = this.responseParser.parseInventory(inventoryData)
        if (parsedInventory) {
            this.inventory = { ...this.inventory, ...parsedInventory }
            this.lastInventoryRefresh = Date.now()
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the player level.
     * @param level {number} - The new level.
     */
    updateLevel(level) {
        this.level = level
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the player vision.
     * @param vision {String} - The new vision to parse
     */
    updateVision(vision) {
        if (!vision) {
            return
        }

        const newVision = this.responseParser.parseVision(vision)
        if (vision) {
            this.vision = newVision
            this.lastVisionRefresh = Date.now()
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Do the handshake with the server.
     */
    async handshakeServer() {
        while (!this.ready) {
            await new Promise((resolve) => {setTimeout(resolve, 100)})
        }
        const handskakeAnswer = await this.commandManager.sendCommand(`${this.teamName}\n`, 2)
        console.log('Handshake resolved with answer', handskakeAnswer)

        if (ONLY_NUMBER_REGEX.test(handskakeAnswer[0]) && Number(handskakeAnswer[0]) < 1) {
            console.error(NO_SPACE_AVAILABLE)
            process.exit(1)
        }

        const mapSize = handskakeAnswer[1].split(' ')
        if (mapSize.length !== 2 || !ONLY_NUMBER_REGEX.test(mapSize[0]) || !ONLY_NUMBER_REGEX.test(mapSize[1])) {
            // TODO: Cleanly exit
            process.exit(1)
        }

        this.mapSize.x = mapSize[0]
        this.mapSize.y = mapSize[1]

        this.main.brain.start()
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the food actually available and internal clock after a command resolve
     * @param commandExecuted {String} - The resolved command already stripped
     * (if command is 'pose sibur\n' param should be 'pose')
     */
    updateFoodAndInternalClock(commandExecuted) {
        if (COMMAND_COST.hasOwnProperty(commandExecuted)) {
            this.inventory.nourriture -= COMMAND_COST[commandExecuted]
            this.internalTicks += COMMAND_COST[commandExecuted]
            console.log('Command', commandExecuted, 'Costed:', COMMAND_COST[commandExecuted], 'Food left:', this.inventory.nourriture)
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Calculate if AI need to fork or not.
     */
    evaluatePopulationNeed() {
        for (const [id, lastTick] of this.teamRegistry.entries()) {
            if (this.internalTicks - lastTick > HEARTBEAT_TIMEOUT) {
                this.teamRegistry.delete(id)
            }
        }

        const teamSize = this.teamRegistry.size + 1;
        console.log(`[POPULATION] Actual team size: ${teamSize}`)

        if (teamSize < 10) {
            this.needToFork = true
        } else if (teamSize >= 20) {
            this.needToFork = false
        } else {
            this.needToFork = Math.random() > 0.5
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Handle an unparsed broadcast message and decide action to take.
     * @param broadcast {String} -  The broadcast to handle
     */
    handleBroadcastMessage(broadcast) {
        const parsedBroadcast = this.responseParser.parseBroadcastMessage(broadcast)

        console.log('Broadcast', parsedBroadcast)

        if (!parsedBroadcast || parsedBroadcast.teamName !== this.teamName) {
            return
        }

        if (parsedBroadcast.action === BROAD_ALIVE) {
            this.teamRegistry.set(parsedBroadcast.senderID, this.internalTicks)
            return
        }

        if (parsedBroadcast.action === BROAD_CANCEL) {
            if (this.followedBroadcast && this.followedBroadcast.senderID === parsedBroadcast.senderID) {
                console.log(`[GAMEMANAGER] Leader ${parsedBroadcast.senderID} has cancel elevation...`)
                this.followedBroadcast = null
            }
            return
        }

        if (parsedBroadcast.action === BROAD_NEED_PLAYER && parsedBroadcast.direction === 0 && Number(parsedBroadcast.argument) === (this.level + 1)) {
            this.commandManager.sendCommand(this.buildBroadcastMessage(BROAD_WITH_PLAYER, parsedBroadcast.senderID))
            return
        }

        if (parsedBroadcast.action === BROAD_WITH_PLAYER && parsedBroadcast.argument === this.main.config.broadcastID) {
            this.elevationReadyPlayers.add(parsedBroadcast.senderID)
            return
        }

        if (parsedBroadcast.action === BROAD_NEED_PLAYER && Number(parsedBroadcast.argument) === (this.level + 1)) {
            this.followedBroadcast = parsedBroadcast
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @param action {String} - The Action to put in the message.
     * @param argument=null {String|null} - The argument of the action to put in the message.
     * @returns {string} - The built message.
     */
    buildBroadcastMessage(action, argument = null ) {
        if (argument === null) {
            return `${BROADCAST} ${this.teamName} ${this.main.config.broadcastID} ${action}\n`
        }

        return `${BROADCAST} ${this.teamName} ${this.main.config.broadcastID} ${action} ${argument}\n`
    }
}

export default new GameManager()