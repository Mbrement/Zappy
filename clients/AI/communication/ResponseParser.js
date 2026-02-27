import {
    BROADCAST_MSG_OBJECT,
    BROADCAST_RECEIVED_REGEX,
    INVENTORY_CMD_REGEX,
    INVENTORY_CMD_TEMPLATE,
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
        if (!INVENTORY_CMD_REGEX.test(inventory)) {
            console.log('[RESPONSE PARSER] Inventory is invalid', inventory)
            return null
        }

        let finalInventory = {...INVENTORY_CMD_TEMPLATE}

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
            console.log('[RESPONSE PARSER] Vision is invalid', vision)
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

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to parse the broadcast message string received from the server
     * @param broadcast {String} - The broadcast message string to parse
     * @returns {Object|null} - The parsed broadcast message object or null if string passed was not valid
     */
    parseBroadcastMessage(broadcast) {
        if (!BROADCAST_RECEIVED_REGEX.test(broadcast)) {
            console.log('[RESPONSE PARSER] Broadcast is invalid', broadcast)
            return null
        }

        let [direction, message] = broadcast.trim().split(',')

        direction = direction.replaceAll(/\D/g, '')
        message = message.trim().split(' ')

        const parsedBroadcast = {...BROADCAST_MSG_OBJECT}
        parsedBroadcast.direction = Number(direction)
        parsedBroadcast.teamName = message[0]
        parsedBroadcast.senderID = message[1]
        parsedBroadcast.action = message[2]
        parsedBroadcast.argument = message[3] || null

        return parsedBroadcast
    }
}

export default ResponseParser
