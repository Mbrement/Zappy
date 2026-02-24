import IState from './IState.js'
import GameManager from '../GameManager.js'
import { STATE, BROAD_PING } from '../constant.js'

export default class InitState extends IState {
    constructor() {
        super()
        this.ticks = 0
    }

    onEnter() {
        console.log('[INIT] Entering state')
        this.ticks = 0

        GameManager.activeTeamMembers.clear()
        GameManager.activeTeamMembers.add(GameManager.main.config.broadcastID)

        const pingMsg = GameManager.buildBroadcastMessage(BROAD_PING)
        GameManager.commandManager.sendCommand(pingMsg)
    }

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

    onExit() {
        console.log('[INIT] Exiting state')
    }
}