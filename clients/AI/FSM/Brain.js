import {
    ADVANCE,
    INCANTATION_TABLE,
    LEFT,
    RIGHT,
    STATE,
    INVENTORY_REFRESH_RATE,
    VISION_REFRESH_RATE,
    INVENTORY, SEE
} from "../constant.js"
import SurvivalState from "./SurvivalState.js"
import FarmingState from "./FarmingState.js"
import HomingState from "./HomingState.js"
import ElevationState from "./ElevationState.js"
import GameManager from "../GameManager.js"
import InitState from "./InitState.js"

class Brain {
    constructor() {
        this.isRunning = false

        this.state = new Map()
        this.state.set(STATE.INIT, new InitState())
        this.state.set(STATE.SURVIVAL, new SurvivalState())
        this.state.set(STATE.FARMING, new FarmingState())
        this.state.set(STATE.HOMING, new HomingState())
        this.state.set(STATE.ELEVATION, new ElevationState())

        this.currentState = STATE.INIT
        this.currentStateFunc = this.state.get(this.currentState)
    }

    switchState(newState) {
        if (this.currentState === newState) {
            return
        }

        console.log(`[BRAIN] Transitioning from ${this.currentState.description} to ${newState.description}`)
        this.currentStateFunc.onExit()
        this.currentState = newState
        this.currentStateFunc = this.state.get(this.currentState)
        this.currentStateFunc.onEnter()
    }

    evaluateNextState() {
        const food = GameManager.inventory.nourriture

        if (food < 1890) {
            return STATE.SURVIVAL
        }

        if (this.canElevate()) {
            return STATE.ELEVATION
        }

        if (GameManager.followedBroadcast !== null && food >= 2500) {
            return STATE.HOMING
        }

        return STATE.FARMING
    }

    canElevate() {
        const level = GameManager.level

        if (Date.now() < GameManager.elevationCooldown) {
            return false
        }

        if (level >= 8) {
            return false
        }

        const requirements = INCANTATION_TABLE[level - 1]
        const inventory = GameManager.inventory

        for (const [item, requiredCount] of Object.entries(requirements)) {
            if (item !== 'player' && inventory[item] < requiredCount) {
                return false
            }
        }

        return true
    }

    async think() {
        if (this.currentState === STATE.INIT) {
            await this.currentStateFunc.onUpdate()
            return
        }

        const now = Date.now()

        if (now - GameManager.lastInventoryRefresh > INVENTORY_REFRESH_RATE) {
            const inventory = await GameManager.commandManager.sendCommand(INVENTORY)
            GameManager.updateInventory(inventory[0])
            return
        }

        if (now - GameManager.lastVisionRefresh > VISION_REFRESH_RATE) {
            const vision = await GameManager.commandManager.sendCommand(SEE)
            GameManager.updateVision(vision[0])
            return
        }

        const nextState = this.evaluateNextState()
        this.switchState(nextState)

        await this.currentStateFunc.onUpdate()
    }

    async start() {
        console.log('[BRAIN] Starting brain...')
        this.isRunning = true

        this.currentStateFunc.onEnter()
        while (this.isRunning) {
            try {
                await this.think()
            } catch (error) {
                console.error('[BRAIN] Error in think(): ', error)
                await new Promise(resolve => setTimeout(resolve, 100))
            }
        }
    }

    buildItinerary(destinationIndex) {
        const itinerary = []

        if (destinationIndex <= 0) {
            return itinerary
        }
        const Y =  Math.floor(Math.sqrt(destinationIndex))

        for (let i = 0; i < Y; i++) {
            itinerary.push(ADVANCE)
        }

        const centerOfY = Y * Y + Y

        let leftOrRight = destinationIndex - centerOfY

        if (leftOrRight < 0) {
            itinerary.push(LEFT)
            while(leftOrRight < 0) {
                itinerary.push(ADVANCE)
                leftOrRight++
            }
        } else if (leftOrRight > 0) {
            itinerary.push(RIGHT)
            while(leftOrRight > 0) {
                itinerary.push(ADVANCE)
                leftOrRight--
            }
        }
        return itinerary
    }
}

export default Brain