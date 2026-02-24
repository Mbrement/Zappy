import IState from "./IState.js"
import GameManager from "../GameManager.js"
import {ADVANCE, FOOD, LEFT, RIGHT, TAKE_FOOD} from "../constant.js"

class SurvivalState extends IState {
    constructor() {
        super()
    }

    onEnter() {
        console.log("[SURVIVAL] Entering state")
    }

    async onUpdate() {
        const vision = GameManager.vision

        if (vision && vision.includes(FOOD)) {
            await GameManager.commandManager.sendCommand(TAKE_FOOD)
            GameManager.lastVisionRefresh = 0
            return
        }

        let targetIndex = -1
        for (let i = 0; i < vision.length; i++) {
            if (vision[i] && vision[i].includes(FOOD)) {
                targetIndex = i
                break
            }
        }

        if (targetIndex !== -1) {
            const itinerary = GameManager.main.brain.buildItinerary(targetIndex)

            itinerary.push(TAKE_FOOD)

            console.log(`[SURVIVAL] Going to take food at index ${targetIndex}. Itinerary :`, itinerary.map(cmd => cmd.trim()))

            const sequencePromises = itinerary.map((cmd) => {
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

        console.log(`[SURVIVAL] No food found in vision. Moving ${moveCmd}...`);
        await GameManager.commandManager.sendCommand(moveCmd);

        GameManager.lastVisionRefresh = 0
    }

    onExit() {
        console.log('[SURVIVAL] Exiting state')
    }
}

export default SurvivalState