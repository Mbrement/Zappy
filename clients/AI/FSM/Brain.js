import {ADVANCE, LEFT, RIGHT} from "../constant.js";

class Brain {
    constructor() {

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