import IState from './IState.js';
import GameManager from '../GameManager.js';
import { SOUND_MAPPING } from '../constant.js';

export default class HomingState extends IState {
    constructor() {
        super();
    }

    onEnter() {
        console.log('[HOMING] Entering state');
    }

    async onUpdate() {
        if (!GameManager.followedBroadcast) {
            return;
        }

        const direction = GameManager.followedBroadcast.direction;

        if (direction === -1) {
            return
        }

        if (direction === 0) {
            console.log('[HOMING] On the followed broadcast tile, awaiting...');
            return
        }

        const itinerary = SOUND_MAPPING[direction];

        if (itinerary && itinerary.length > 0) {
            console.log(`[HOMING] Following sound from: ${direction} -> Itinerary :`, itinerary.map(cmd => cmd.trim()));

            const sequencePromises = itinerary.map((cmd) => {
                return GameManager.commandManager.sendCommand(cmd);
            });
            await Promise.all(sequencePromises);

            GameManager.followedBroadcast.direction = -1;

            GameManager.lastVisionRefresh = 0;
        }
    }

    onExit() {
        console.log('[HOMING] End of state');
    }
}