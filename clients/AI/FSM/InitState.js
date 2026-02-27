import IState from "./IState.js"
import GameManager from "../GameManager.js"
import {BROAD_ALIVE, STATE} from "../constant.js"

class InitState extends IState {
    constructor() {
        super()
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Initialize state, register self and broadcast alive
     */
    onEnter() {
        console.log("[INIT] Entering state. Hello world!")

        GameManager.teamRegistry.set(
            GameManager.main.config.broadcastID,
            GameManager.internalTicks
        )
        
        const aliveMsg = GameManager.buildBroadcastMessage(BROAD_ALIVE)
        GameManager.commandManager.sendCommand(aliveMsg)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Switch to SURVIVAL state
     */
    async onUpdate() {
        GameManager.main.brain.switchState(STATE.SURVIVAL)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Does nothing except putting a log in console in this state
     */
    onExit() {
        console.log("[INIT] Exiting state, time to work.")
    }
}

export default InitState
