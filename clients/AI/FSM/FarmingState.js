import IState from "./IState.js"
import {
    ADVANCE,
    AVAILABLE_CONNECTION,
    FOOD,
    FORK,
    INCANTATION_TABLE,
    LEFT,
    RIGHT,
    TAKE_COMMANDS
} from "../constant.js"
import GameManager from "../GameManager.js"

class FarmingState extends IState {
    constructor() {
        super()
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Does nothing except putting a log in console in this state
     */
    onEnter() {
        console.log('[FARMING] Entering state')
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Check what stone are missing to elevate.
     * @return {String[]} - An array of missing stone
     */
    getMissingStones() {
        const level = GameManager.level
        if (level >= 8) {
            return []
        }

        const requirements = INCANTATION_TABLE[level - 1]
        const missing = []

        for (const [item, requiredCount] of Object.entries(requirements)) {
            if (item !== 'player' && GameManager.inventory[item] < requiredCount) {
                missing.push(item)
            }
        }

        return missing
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to find stones and food
     */
    async onUpdate() {
        if (GameManager.needToFork) {
            const connectAns = await GameManager.commandManager.sendCommand(AVAILABLE_CONNECTION)
            const availableSlots = parseInt(connectAns[0], 10)

            if (availableSlots > 0) {
                console.log(`[FARMING] ${availableSlots} available slot in team. Spawning new child AI.`)
                GameManager.main.processManager.fork()
                GameManager.needToFork = false
                return
            }

            if (GameManager.inventory.nourriture > 2000) {
                console.log('[FARMING] Laying an egg...')
                await GameManager.commandManager.sendCommand(FORK)
                GameManager.needToFork = false

                setTimeout(() => {
                    console.log('[FARMING] Egg should have hatches, spawning new child AI.')
                    GameManager.main.processManager.fork()
                }, 6500)

                GameManager.lastVisionRefresh = 0
                return
            } else {
                console.log('[FARMING] Not enough food to reproduce (>2000).')
            }
        }

        const vision = GameManager.vision
        const missingStones = this.getMissingStones()

        if (vision && vision.length > 0) {
            const commandsToSend = []
            let currentMissing = [...missingStones]

            for (const item of vision) {
                if (currentMissing.includes(item) || item === FOOD) {
                    commandsToSend.push(TAKE_COMMANDS[item])

                    if (item !== FOOD) {
                        const index = currentMissing.indexOf(item)
                        if (index > -1) {
                            currentMissing.splice(index, 1)
                        }
                    }
                }
            }

            if (commandsToSend.length > 0) {
                console.log('[FARMING] Taking on current tile:', commandsToSend.map(cmd => cmd.trim()))

                const sequencePromises = commandsToSend.map(cmd => GameManager.commandManager.sendCommand(cmd))
                await Promise.all(sequencePromises)

                GameManager.lastVisionRefresh = 0
                return
            }
        }

        let targetIndex = -1

        for (let i = 1; i < vision.length; i++) {
            if (vision[i]) {
                const foundStone = missingStones.find(stone => vision[i].includes(stone))
                if (foundStone) {
                    targetIndex = i
                    break
                }
            }
        }

        if (targetIndex === -1 && GameManager.inventory[FOOD] < 3500) {
            for (let i = 1; i < vision.length; i++) {
                if (vision[i] && vision[i].includes(FOOD)) {
                    targetIndex = i
                    break
                }
            }
        }

        if (targetIndex !== -1) {
            const commandsToSend = GameManager.main.brain.buildItinerary(targetIndex)

            let currentMissing = [...missingStones]
            for (const item of vision[targetIndex]) {
                if (currentMissing.includes(item) || item === FOOD) {
                    commandsToSend.push(TAKE_COMMANDS[item])

                    if (item !== FOOD) {
                        const index = currentMissing.indexOf(item)
                        if (index > -1) currentMissing.splice(index, 1)
                    }
                }
            }

            console.log(`[FARMING] Going to ${targetIndex} and taking :`, commandsToSend.map(cmd => cmd.trim()))

            const sequencePromises = commandsToSend.map(cmd => {
                return GameManager.commandManager.sendCommand(cmd)
            })
            await Promise.all(sequencePromises)


            GameManager.lastVisionRefresh = 0
            return
        }

        const rand = Math.random()
        let moveCmd = ADVANCE

        if (rand > 0.85) {
            moveCmd = RIGHT
        } else if (rand > 0.70) {
            moveCmd = LEFT
        }

        console.log(`[FARMING] Nothing found in vision. Moving ${moveCmd}...`)
        await GameManager.commandManager.sendCommand(moveCmd)
        GameManager.lastVisionRefresh = 0
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Does nothing except putting a log in console in this state
     */
    onExit() {
        console.log(`[FARMING] Exiting State`)
    }
}

export default FarmingState;