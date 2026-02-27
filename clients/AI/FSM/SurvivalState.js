import IState from "./IState.js"
import GameManager from "../GameManager.js"
import {ADVANCE_CMD, FOOD, LEFT_CMD, RIGHT_CMD, TAKE_FOOD_CMD} from "../constant.js"

class SurvivalState extends IState {
    constructor() {
        super()
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Does nothing except putting a log in console in this state
     */
    onEnter() {
        console.log("[SURVIVAL] Entering state")
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to find food and take it
     */
    async onUpdate() {
        const vision = GameManager.vision

        if (vision && vision.includes(FOOD)) {
            await GameManager.commandManager.sendCommand(TAKE_FOOD_CMD)
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

            itinerary.push(TAKE_FOOD_CMD)

            console.log(`[SURVIVAL] Going to take food at index ${targetIndex}. Itinerary :`, itinerary.map(cmd => cmd.trim()))

            const sequencePromises = itinerary.map((cmd) => {
               return GameManager.commandManager.sendCommand(cmd)
            })
            await Promise.all(sequencePromises)

            GameManager.lastVisionRefresh = 0
            return
        }

        const rand = Math.random()
        let moveCmd = ADVANCE_CMD

        if (rand > 0.85) {
            moveCmd = RIGHT_CMD
        } else if (rand > 0.70) {
            moveCmd = LEFT_CMD
        }

        console.log(`[SURVIVAL] No food found in vision. Moving ${moveCmd}...`);
        await GameManager.commandManager.sendCommand(moveCmd);

        GameManager.lastVisionRefresh = 0
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Does nothing except putting a log in console in this state
     */
    onExit() {
        console.log('[SURVIVAL] Exiting state')
    }
}

export default SurvivalState