import Main from "./Main.js";
import {COMMAND_COST, ONLY_NUMBER_REGEX} from "./constant.js";

class GameManager {
    constructor() {
        this.main = new Main()

        this.awaitRessourcesAvailableFromMain()

        this.inventory = {
            nourriture: 1260,
            linemate: 0,
            deraumere: 0,
            sibur: 0,
            mendiane: 0,
            phiras: 0,
            thystame: 0
        };
        this.level = 1;
        this.mapSize = {x: -1, y: -1}
        this.vision = []
    }

    async awaitRessourcesAvailableFromMain() {
        while(!this.main.commandManager && !this.main.responseParser) {
            await new Promise((resolve) => {setTimeout(resolve, 100)})
        }

        this.teamName = this.main.config.teamName
        this.commandManager = this.main.commandManager
        this.responseParser = this.main.responseParser
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the internal inventory state based on server response.
     * @param inventoryData {Object} - The parsed inventory object.
     */
    updateInventory(inventoryData) {
        this.inventory = { ...this.inventory, ...inventoryData };
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the player level.
     * @param level {number} - The new level.
     */
    updateLevel(level) {
        this.level = level;
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the player vision.
     * @param vision {String[]} - The new vision array.
     */
    updateVision(vision) {
        this.vision = vision
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Do the handshake with the server.
     */
    async handshakeServer() {
        const handskakeAnswer = await this.commandManager.sendCommand(`${this.teamName}\n`, 2)
        console.log('Handshake resolved with answer', handskakeAnswer)

        if (!ONLY_NUMBER_REGEX.test(handskakeAnswer[0]) && Number(handskakeAnswer[0]) < 1) {
            // TODO: Cleanly exit
            process.exit(1)
        }

        const mapSize = handskakeAnswer[1].split(' ')
        if (mapSize.length !== 2 || !ONLY_NUMBER_REGEX.test(mapSize[0]) || !ONLY_NUMBER_REGEX.test(mapSize[1])) {
            // TODO: Cleanly exit
            process.exit(1)
        }

        this.mapSize.x = mapSize[0]
        this.mapSize.y = mapSize[1]
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Update the food actually available after a command resolve
     * @param commandExecuted {String} - The resolved command already stripped
     * (if command is 'pose sibur\n' param should be 'pose')
     */
    updateFoodAvailable(commandExecuted) {
        if (COMMAND_COST.hasOwnProperty(commandExecuted)) {
            this.inventory.nourriture -= COMMAND_COST[commandExecuted]
            console.log('Command', commandExecuted, 'Costed:', COMMAND_COST[commandExecuted], 'Food left:', this.inventory.nourriture)
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

        //TODO: TAKE Action with the parsed Broadcast
    }
}

export default new GameManager()