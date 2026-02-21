/**
 * @exports UpdateManager
 * @author Emma (epolitze) Politzer
 * @description UpdateManager class
 */
class UpdateManager {
    #updatePool

    /**
     * @author Emma (epolitze) Politzer
     * @description Constructor for the UpdateManager class
     */
    constructor() {
        this.time = window.worldInstance.time

        this.#updatePool = {
            world: [],
            shaders: [],
            renderers: []
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Starts the update loop
     */
    start() {
        this.time.on('tick', () => {
            this.update()
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Add a class to the update pool
     * @param clasWhereMethodLives - the class where the method lives
     * @param priorityPool - the priority pool to add the class to
     * @param methodName - the method name to call on the class, defaults to 'update'
     */
    async add(clasWhereMethodLives, priorityPool, methodName = 'update') {
        const pool = this.#updatePool[priorityPool]

        if (pool.find((updateObj) => updateObj.method === methodName && updateObj._class === clasWhereMethodLives)) {
            console.warn('this one already here', methodName);
            return
        }

        pool.push({
            _class: clasWhereMethodLives,
            method: methodName
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Remove a class from the update pool
     * @param clasWhereMethodLives - the class where the method lives
     * @param priorityPool - the priority pool to remove the class from
     * @param methodName - the method name to remove from the class, defaults to 'update'
     */
    async remove(clasWhereMethodLives, priorityPool, methodName = 'update') {
        this.#updatePool[priorityPool] = this.#updatePool[priorityPool].filter((updateObj) =>
            !(updateObj._class === clasWhereMethodLives && updateObj.method === methodName)
        )
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Update all classes in the update pool
     */
    update() {
        Object.keys(this.#updatePool).forEach((priorityPool) => {
            for (const updateObj of this.#updatePool[priorityPool]) {
                updateObj._class[updateObj.method]()
            }
        })
    }

}

module.exports = UpdateManager