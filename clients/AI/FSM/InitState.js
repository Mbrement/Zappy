import IState from './IState.js'
import GameManager from '../GameManager.js'
import { STATE, BROAD_PING } from '../constant.js'

export default class InitState extends IState {
    constructor() {
        super()
        this.ticks = 0
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Initialize state, reset team and ping
     */
    onEnter() {
        console.log('[INIT] Entering state')
        this.ticks = 0

        GameManager.activeTeamMembers.clear()
        GameManager.activeTeamMembers.add(GameManager.main.config.broadcastID)

        const pingMsg = GameManager.buildBroadcastMessage(BROAD_PING)
        GameManager.commandManager.sendCommand(pingMsg)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Wait for responses then switch to FARMING
     */
    async onUpdate() {
        this.ticks++

        console.log('[INIT] Update loop')
        if (this.ticks > 5) {
            GameManager.evaluatePopulationNeed()
            GameManager.main.brain.switchState(STATE.FARMING)
            return
        }
        
        GameManager.lastVisionRefresh = 0
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Does nothing except putting a log in console in this state
     */
    onExit() {
        console.log('[INIT] Exiting state')
    }
}
