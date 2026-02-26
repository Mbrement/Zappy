import IState from './IState.js'
import GameManager from '../GameManager.js'
import {
    INCANTATION_TABLE,
    INCANTATION,
    BROAD_NEED_PLAYER,
    SEE,
    BROAD_CANCEL
} from '../constant.js'

class ElevationState extends IState {
    constructor() {
        super()
        this.isIncanting = false
        this.isElevationSuccessful = false

        this.censusTicks = 0
        this.isCensusDone = false
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Reset state and clear array used for this state
     */
    onEnter() {
        console.log(`[ELEVATION] Entering state, elevation to level ${GameManager.level + 1}.`)
        this.isIncanting = false
        this.isElevationSuccessful = false

        this.censusTicks = 0
        this.isCensusDone = false

        GameManager.elevationReadyPlayers.clear()
        GameManager.elevationReadyPlayers.add(GameManager.main.config.broadcastID)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to elevate by sending broadcast message.
     * @return {Promise<void>}
     */
    async onUpdate() {
        if (this.isIncanting) {
            return
        }

        const level = GameManager.level
        if (level >= 8) {
            return
        }

        if (!this.isCensusDone) {
            this.censusTicks++
            if (this.censusTicks > 5) {
                this.isCensusDone = true
                GameManager.evaluatePopulationNeed()
            } else {
                const vision = await GameManager.commandManager.sendCommand(SEE)
                GameManager.updateVision(vision[0])
                return
            }
        }

        const requiredPlayers = INCANTATION_TABLE[level - 1].player
        const playersReadyCount = GameManager.elevationReadyPlayers.size

        if (playersReadyCount >= requiredPlayers) {
            console.log(`[ELEVATION] Everyone is ready to elevate (${playersReadyCount}/${requiredPlayers}).`)
            this.isIncanting = true

            const answers = await GameManager.commandManager.sendCommand(INCANTATION, 2)
            console.log('[ELEVATION] Result:', answers)

            const finalAnswer = answers[1]
            const newLevel = parseInt(finalAnswer.split(':')[1].trim())

            if (newLevel > level) {
                console.log(`[ELEVATION] Success new level: ${newLevel}`)
                this.isElevationSuccessful = true
                GameManager.updateLevel(newLevel)
            } else {
                console.log('[ELEVATION] Failure')
            }

            this.isIncanting = false
            GameManager.lastVisionRefresh = 0
            GameManager.lastInventoryRefresh = 0

        } else {
            this.censusTicks++

            if (this.censusTicks > 150) {
                console.log(`[ELEVATION] Awaiting for to long... Canceling`)
                GameManager.elevationCooldown = Date.now() + 10000
                GameManager.lastVisionRefresh = 0
                return
            }

            console.log(`[ELEVATION] Await enough players to elevate (${playersReadyCount}/${requiredPlayers}).`)

            GameManager.elevationReadyPlayers.clear()
            GameManager.elevationReadyPlayers.add(GameManager.main.config.broadcastID)

            const broadcastMsg = GameManager.buildBroadcastMessage(BROAD_NEED_PLAYER, `${GameManager.level + 1}`)
            await GameManager.commandManager.sendCommand(broadcastMsg)

            GameManager.lastVisionRefresh = 0
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Reset state and clear array used for this state
     */
    onExit() {
        console.log('[ELEVATION] End State.')
        if (!this.isElevationSuccessful) {
            console.log('[ELEVATION] Cancelling broadcast...')
            const cancelMsg = GameManager.buildBroadcastMessage(BROAD_CANCEL)
            GameManager.commandManager.sendCommand(cancelMsg)
        }
        this.isIncanting = false
        GameManager.elevationReadyPlayers.clear()
    }
}

export default ElevationState