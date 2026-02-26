import {
    ADVANCE,
    INCANTATION_TABLE,
    LEFT,
    RIGHT,
    STATE,
    INVENTORY_REFRESH_RATE,
    VISION_REFRESH_RATE,
    INVENTORY, SEE, HEARTBEAT_INTERVAL, BROAD_ALIVE
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

    /**
     * @author Corentin (ccharton) Charton
     * @description Switches the current state of the brain to a new state.
     * @param newState {Symbol} - The new state to switch to.
     */
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

    /**
     * @author Corentin (ccharton) Charton
     * @description Evaluate what will be the next of the brain.
     * @return {symbol} - The next state of the brain.
     */
    evaluateNextState() {
        const food = GameManager.inventory.nourriture

        if (food < 1890 && !GameManager.followedBroadcast && this.currentState !== STATE.ELEVATION) {
            return STATE.SURVIVAL;
        }

        if (food < 1000 && (GameManager.followedBroadcast || this.currentState === STATE.ELEVATION)) {
            return STATE.SURVIVAL;
        }

        if (this.canElevate() && !GameManager.followedBroadcast) {
            return STATE.ELEVATION
        }

        if (GameManager.followedBroadcast !== null) {
            return STATE.HOMING
        }

        return STATE.FARMING
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Evaluate if the player has the necessary item to elevate.
     * @return {boolean} - A boolean that state if elevation possible
     */
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

    /**
     * @author Corentin (ccharton) Charton
     * @description Execute onUpdate methods of the current state & refresh inventory/vision if needed.
     */
    async think() {
        if (GameManager.internalTicks - GameManager.lastHeartbeatTick >= HEARTBEAT_INTERVAL) {
            const aliveMsg = GameManager.buildBroadcastMessage(BROAD_ALIVE);
            GameManager.commandManager.sendCommand(aliveMsg);
            GameManager.lastHeartbeatTick = GameManager.internalTicks;
        }

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

    /**
     * @author Corentin (ccharton) Charton
     * @description Start the brain thinking loop.
     */
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

    /**
     * @author Corentin (ccharton) Charton
     * @description Build the itinerary to the given index.
     * @param destinationIndex {Number} - The index of the destination in the vision array.
     * @return {String[]|[]} - An array of command or an empty array if already to the destination
     */
    buildItinerary(destinationIndex) {
        const itinerary = []

        if (destinationIndex <= 0 || destinationIndex >= GameManager.vision.length) {
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