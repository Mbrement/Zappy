import {
    INVENTORY_REGEX,
    INVENTORY_TEMPLATE,
    ONLY_NUMBER_REGEX,
    VALID_ITEM_LIST,
    VISION_REGEX
} from "../constant.js";

class ResponseParser {
    constructor() {
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to parse the inventory string received from the server
     * @param inventory {string} - The string to parse
     * @returns {Object|null} - The parsed inventory object or null if string passed was not valid
     */
    parseInventory(inventory) {
        if (!inventory.match(INVENTORY_REGEX)) {
            return null
        }

        let finalInventory = {...INVENTORY_TEMPLATE}

        inventory = inventory.replaceAll(/[{}]/g, '')
        let inventoryByItem = inventory.split(',')

        for(const itemStr of inventoryByItem) {
            const [item, value] = itemStr.trim().split(' ')

            if (!ONLY_NUMBER_REGEX.test(value)) {
                continue
            }

            if (Object.hasOwn(finalInventory, item)) {
                finalInventory[item] = Number(value);
            }
        }
        return finalInventory
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to parse the vision string received from the server
     * @param vision {String} - The vision string to parse
     * @returns {string[][]|null} - The parsed vision array or null if string passed was not valid
     */
    parseVision(vision) {
        if (!VISION_REGEX.test(vision)) {
            return null
        }

        vision = vision.replaceAll(/[{}]/g, '')

        let visionByTile = vision.split(',')
        let finalVision = visionByTile.map((tile) => {
          return tile.trim()
                .split(' ')
                .filter(item => VALID_ITEM_LIST.has(item))
        })

        return finalVision
    }
}

export default ResponseParser