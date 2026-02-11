import Main from "./Main.js";

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

        if (Number(handskakeAnswer[0]) < 1) {
            // TODO: Cleanly exit
            process.exit(1)
        }

        const mapSize = handskakeAnswer[1].split(' ')
        this.mapSize.x = mapSize[0]
        this.mapSize.y = mapSize[1]
    }
}

export default new GameManager()