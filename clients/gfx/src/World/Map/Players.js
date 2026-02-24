const THREE = require('three/webgpu')
const { mergeGeometries } = require("three/addons/utils/BufferGeometryUtils.js");
const {actionTicks} = require("./constants")
const {
    uniform,
    Fn,
    color,
    vec4,
    vec3,
    float,
    positionLocal,
    If
} = require("three/tsl");

class Players {
    constructor() {
        this.world = window.worldInstance
        this.gameMap = this.world.gameMap
        this.scene = this.world.scene
        this.main = window.mainInstance
        this.gameState = this.main.gameState

        this.tickTime = 0.01
        this.animatedPlayersMove = []
        this.animatedPlayersRotate = []
        this.animatedPlayerBroadcasts = []

        this.maxPlayers = 50
        this.maxEggs = 50

        this.playerGroundFloor = 1
        this.playerBaseGroundFloor = this.playerGroundFloor
        this.playerFloorSize = this.playerGroundFloor * 0.5
        this.eggGroundFloor = 0.5
        this.eggFloorSize = this.eggGroundFloor * 0.5

        this.playerMeshes = new Map()
        this.eggMeshes = new Map()

        this.nullifyMap(this.playerMeshes, 0, this.maxPlayers)
        this.nullifyMap(this.eggMeshes, 0, this.maxEggs)

        this.positionningMatrix = new THREE.Matrix4().setPosition(9999, 9999, 9999)
        this.dummyObject = new THREE.Object3D()
        this.dummyVector = new THREE.Vector3()
        this.dummyQuaternion = new THREE.Quaternion()

        this.createInstances()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the player and egg instances
     */
    createInstances() {
        this.bodyGeometry = new THREE.CapsuleGeometry(0.05, 0.1, 1, 4, 1)

        this.orientationGeometry = new THREE.CircleGeometry(0.05, 3)
        this.orientationGeometry.rotateX(-90 * Math.PI / 180)
        this.orientationGeometry.rotateY(90 * Math.PI / 180)
        this.orientationGeometry.translate(0, -0.03, -0.09)

        this.playerGeometry = mergeGeometries([this.bodyGeometry, this.orientationGeometry])
        this.playerMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide})

        this.playerInstance = this.createInstance(this.playerGeometry, this.playerMaterial, this.maxPlayers)

        this.broadcastGeometry = new THREE.CircleGeometry(0.3)
        this.broadcastGeometry.rotateX(-90 * Math.PI / 180)
        this.broadcastMaterial = new THREE.MeshBasicNodeMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
        })

        this.eggGeometry = new THREE.CapsuleGeometry(0.05, 0.06, 1, 4, 1)
        this.eggMaterial = new THREE.MeshBasicMaterial()

        this.eggInstance = this.createInstance(this.eggGeometry, this.eggMaterial, this.maxEggs)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description nullifies the given map
     * @param map - The map we want to nullify
     * @param start - From where we want to nullify
     * @param end - Where we want to stop nullifying
     */
    nullifyMap(map, start, end) {
        for (let i = start; i < end; i++) {
            map.set(i, null)
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Sets the time unit
     * @param newUnit - the new time unit (T/second) where t is the newUnit
     */
    setTimeUnit(newUnit) {
        this.tickTime = 1 / newUnit
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Get the player's instance index with its id
     * @param id - the player's id
     * @returns {number} - The player's instance index
     */
    getPlayerById(id) {
        for (let index = 0; index < this.maxPlayers; index++) {
            if (this.playerMeshes.get(index) === id) {
                return index
            }
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Get the egg's instance index with its id
     * @param id the egg's id
     * @returns {number} - The egg's instance index
     */
    getEggById(id) {
        for (let index = 0; index < this.maxEggs; index++) {
            if (this.eggMeshes.get(index) === id) {
                return index
            }
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates an instanceMesh
     * @param geometry - The geometry of the instancedMesh
     * @param material - The material of the instancedMesh
     * @param maxCount - The amount of instances
     * @returns {THREE.InstancedMesh} - The newly created instancedMesh
     */
    createInstance(geometry, material, maxCount) {
        const instance = new THREE.InstancedMesh(geometry, material, maxCount)
        instance.frustumCulled = false
        instance.matrixAutoUpdate = false
        instance.matrixWorldAutoUpdate = false

        for (let i = 0; i < maxCount; i++) {
            instance.setMatrixAt(i, this.positionningMatrix)
            instance.setColorAt(i, new THREE.Color())
        }
        instance.instanceMatrix.needsUpdate = true
        instance.instanceColor.needsUpdate = true

        this.scene.add(instance)
        return instance
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Sets the old instancedMesh's positions to the new instancedMesh's instances
     * @param oldInstance - The old instancedMesh
     * @param newInstance - The new instancedMesh
     * @param maxCount - The amount of instances in the old instancedMesh
     */
    remapInstance(oldInstance, newInstance, maxCount) {
        let color = new THREE.Color()
        for (let index = 0; index < maxCount; index++) {
            oldInstance.getMatrixAt(index, this.positionningMatrix)
            oldInstance.getColorAt(index, color)

            newInstance.setMatrixAt(index, this.positionningMatrix)
            newInstance.setColorAt(index, color)
        }
        newInstance.instanceMatrix.needsUpdate = true
        newInstance.instanceColor.needsUpdate = true
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates new instancedMesh when all instances of the old one are used
     * @param type - Which instance to re-do
     */
    changeInstance(type) {
        console.log("Changing instances due to too many assets needed", type)
        if (type === 'player') {
            const newPlayerInstance = this.createInstance(this.playerGeometry, this.playerMaterial, this.maxPlayers * 2)
            this.scene.remove(this.playerInstance)
            this.remapInstance(this.playerInstance, newPlayerInstance, this.maxPlayers)
            this.nullifyMap(this.playerMeshes, this.maxPlayers, this.maxPlayers * 2)
            this.maxPlayers *= 2
            this.playerInstance = newPlayerInstance
        }
        else {
            const newEggInstance = this.createInstance(this.eggGeometry, this.eggMaterial, this.maxEggs * 2)
            this.scene.remove(this.eggInstance)
            this.remapInstance(this.eggInstance, newEggInstance, this.maxEggs)
            this.nullifyMap(this.eggMeshes, this.maxEggs, this.maxEggs * 2)
            this.maxEggs *= 2
            this.eggInstance = newEggInstance
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Add a player to the map
     * @param playerInfo - The information of the new player
     * @param playerTeam - The new player's team
     */
    addPlayer(playerInfo, playerTeam) {
        const [playerId, x, y, orientation] = playerInfo

        if (!this.gameState.playerInfo.has(playerId)) {
            return
        }

        let unusedIndex = null
        for (let i = 0; i < this.maxPlayers; i++) {
            if (this.playerMeshes.get(i) === null) {
                unusedIndex = i
                break
            }
        }

        if (unusedIndex === null) {
            unusedIndex = this.maxPlayers
            this.changeInstance('player')
        }

        this.playerMeshes.set(unusedIndex, playerId)

        this.movePlayer([playerId, x, y, orientation], this.gameState.playerInfo.get(playerId), true)

        const color = new THREE.Color(this.main.gameState.teams.get(playerTeam))
        this.playerInstance.setColorAt(unusedIndex, color)
        this.playerInstance.instanceColor.needsUpdate = true
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Starts the rotate animation for the given player
     * @param init - Whether the function is called at initialization
     * @param playerId - The player's id
     * @param orientation - Which way the player should now be pointing
     */
    rotatePlayer(init, playerId, orientation) {
        const index = this.getPlayerById(playerId)
        const totalTime = actionTicks.droite * this.tickTime

        this.playerInstance.getMatrixAt(index, this.positionningMatrix)
        this.positionningMatrix.decompose(this.dummyObject.position, this.dummyObject.quaternion, this.dummyObject.scale)
        const startRotation = this.dummyObject.quaternion.clone()

        this.dummyObject.rotation.set(this.dummyObject.rotation.x, (orientation - 1) * -90 * (Math.PI / 180), this.dummyObject.rotation.z)
        this.dummyObject.updateMatrix()
        const endRotation = this.dummyObject.quaternion.clone()

        if (init) {
            this.playerInstance.setMatrixAt(index, this.dummyObject.matrix)
            this.playerInstance.computeBoundingSphere()
        }
        else {
            if (this.animatedPlayersRotate.length === 0) {
                this.world.updateManager.add(this, "world", "animatePlayerRotate")
            }

            this.animatedPlayersRotate.push({
                index,
                    duration: totalTime,
                    passedTime: 0,
                    startRotation,
                    endRotation,
            })
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Calculates the player's position inside its tile
     * @param x - The x coordinate of the tile
     * @param y - The y coordinate of the tile
     * @param playerPositionIndex - The position of the player in the player stack
     */
    calculatePlayerPos(x, y, playerPositionIndex) {
        const start = [-(this.gameMap.mapSize[0] - 1) * 0.5, -(this.gameMap.mapSize[1] - 1) * 0.5]
        const xCellIndex = Math.max(0, playerPositionIndex) % 9
        const yCellIndex = this.playerGroundFloor + (Math.floor(playerPositionIndex / 9) * this.playerFloorSize)

        this.dummyVector.x = start[0] + x - 0.33 + (xCellIndex % 3 / 3)
        this.dummyVector.y = yCellIndex
        this.dummyVector.z = start[1] + y - 0.35  + (Math.floor(xCellIndex / 3) / 3)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Re positions all the players on a given tile
     * @param x - The x coordinate of the tile
     * @param y - The y coordinate of the tile
     */
    restackPlayers(x, y) {
        const players = this.gameState.map[y][x].players

        for (let i = 0; i < players.length; i++) {
            this.calculatePlayerPos(x, y, i)
            const index = this.getPlayerById(players[i].id)
            this.playerInstance.getMatrixAt(index, this.positionningMatrix)
            this.positionningMatrix.setPosition(this.dummyVector)
            this.playerInstance.setMatrixAt(index, this.positionningMatrix)
        }
        this.playerInstance.updateMatrix()
        this.playerInstance.instanceMatrix.needsUpdate = true
        this.playerInstance.computeBoundingSphere()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Either places the player on a tile or starts the move animation
     * @param init - Whether the function is called at initialization
     * @param playerId - The player's id
     * @param x - The x coordinate of the tile
     * @param y - The y coordinate of the tile
     * @param playerState - The player's state
     */
    positionPlayer(init, playerId, x, y, playerState) {
        const index = this.getPlayerById(playerId)
        const totalTime = actionTicks.avance * this.tickTime

        this.playerInstance.getMatrixAt(index, this.positionningMatrix)
        this.positionningMatrix.decompose(this.dummyObject.position, this.dummyObject.quaternion, this.dummyObject.scale)
        const startPosition = this.dummyObject.position.clone()

        this.calculatePlayerPos(x, y, this.gameState.map[y][x].players.length - 1)

        this.positionningMatrix.setPosition(this.dummyVector)
        this.positionningMatrix.decompose(this.dummyObject.position, this.dummyObject.quaternion, this.dummyObject.scale)
        const endPosition = this.dummyObject.position.clone()

        if (init) {
            this.playerInstance.setMatrixAt(index, this.positionningMatrix)
            this.playerInstance.computeBoundingSphere()
        }
        else {
            this.restackPlayers(playerState.x, playerState.y)

            if (this.animatedPlayersMove.length === 0) {
                this.world.updateManager.add(this, "world", "animatePlayerMove")
            }

            this.animatedPlayersMove.push({
                index,
                duration: totalTime,
                passedTime: 0,
                startPosition,
                endPosition,
            })
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Moves the player by rotating and/or positioning them
     * @param playerInfo - The information of the player
     * @param playerState - The player's old state
     * @param init - Whether the function is called at initialization
     */
    movePlayer(playerInfo, playerState, init=false) {
        const [playerId, x, y, orientation] = playerInfo

        if (init || playerState.x !== x || playerState.y !== y) {
            this.positionPlayer(init, playerId, x, y, playerState)
        }
        if (init || playerState.orientation !== orientation) {
            this.rotatePlayer(init, playerId, orientation)
        }
        this.playerInstance.instanceMatrix.needsUpdate = true
        this.playerInstance.computeBoundingSphere()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Animates the player movements
     */
    animatePlayerMove() {
        if (this.animatedPlayersMove.length < 1) {
            this.world.updateManager.remove(this, "world", "animatePlayerMove")
        }

        const deltaTime = this.world.updateManager.time.deltaInSecond

        let player
        for (let i = 0; i < this.animatedPlayersMove.length; i++) {
            player = this.animatedPlayersMove[i]

            this.playerInstance.getMatrixAt(player.index, this.positionningMatrix)
            this.dummyVector.lerpVectors(player.startPosition, player.endPosition, player.passedTime / player.duration)
            this.positionningMatrix.setPosition(this.dummyVector)
            this.playerInstance.setMatrixAt(player.index, this.positionningMatrix)

            this.playerInstance.instanceMatrix.needsUpdate = true
            this.playerInstance.computeBoundingSphere()

            player.passedTime += deltaTime
        }

        this.animatedPlayersMove = this.animatedPlayersMove.filter((player) => {
            const remove = player.passedTime > player.duration
            if (remove) {
                this.playerInstance.getMatrixAt(player.index, this.positionningMatrix)
                this.positionningMatrix.setPosition(player.endPosition)
                this.playerInstance.setMatrixAt(player.index, this.positionningMatrix)
                this.playerInstance.instanceMatrix.needsUpdate = true
                this.playerInstance.computeBoundingSphere()
            }

            return !remove
        })
    }

    /**
     * @authorEmma (epolitze) Politzer
     * @description The broadcast shader
     * @param uProgressArg - The progress uniform
     * @returns {*}
     */
    broadcastShader(uProgressArg) {
        return Fn(([uProgress]) => {
            const waveColor = color(1.0, 0.0, 0.0).toConst()

            const localPos = positionLocal.toConst()

            let alpha = float(0.0).toVar()

            If(localPos.distance(vec3(0, 0, 0)).greaterThan(uProgress)
                .and(localPos.distance(vec3(0, 0, 0)).lessThan(uProgress.add(0.01))), () => {
                alpha.assign(1.0)
            })
            .ElseIf(localPos.distance(vec3(0, 0, 0)).greaterThan(uProgress.mul(0.5))
                .and(localPos.distance(vec3(0, 0, 0)).lessThan(uProgress.mul(0.5).add(0.01))), () => {
                alpha.assign(1.0)
            })

            return vec4(waveColor, alpha)
        })(uProgressArg)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Add broadcast animation
     * @param playerId - The id of the player that is broadcasting
     */
    addPlayerBroadcast(playerId) {
        if (this.animatedPlayerBroadcasts.length === 0) {
            this.world.updateManager.add(this, "world", "animatePlayerBroadcast")
        }

        const index = this.getPlayerById(playerId)
        const totalTime = actionTicks.broadcast * this.tickTime

        this.playerInstance.getMatrixAt(index, this.positionningMatrix)
        this.positionningMatrix.decompose(this.dummyObject.position, this.dummyObject.quaternion, this.dummyObject.scale)

        const broadcastMesh = new THREE.Mesh(this.broadcastGeometry, this.broadcastMaterial.clone())
        broadcastMesh.userData.uProgress = uniform(0.0)
        broadcastMesh.material.fragmentNode = this.broadcastShader(broadcastMesh.userData.uProgress)
        broadcastMesh.position.copy(this.dummyObject.position)
        this.scene.add(broadcastMesh)

        this.animatedPlayerBroadcasts.push({
            index,
            duration: totalTime,
            passedTime: 0,
            mesh: broadcastMesh
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Animates the player broadcasts
     */
    animatePlayerBroadcast() {
        if (this.animatedPlayerBroadcasts.length < 1) {
            this.world.updateManager.remove(this, "world", "animatePlayerBroadcast")
        }

        const deltaTime = this.world.updateManager.time.deltaInSecond

        let broadcast
        for (let i = 0; i < this.animatedPlayerBroadcasts.length; i++) {
            broadcast = this.animatedPlayerBroadcasts[i]

            broadcast.passedTime += deltaTime

            broadcast.mesh.userData.uProgress.value = broadcast.passedTime / broadcast.duration
        }

        this.animatedPlayerBroadcasts = this.animatedPlayerBroadcasts.filter((broadcast) => {
            const remove = broadcast.passedTime > broadcast.duration
            if (remove) {
                broadcast.mesh.material.dispose()
                this.scene.remove(broadcast.mesh)
            }

            return !remove
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Animates the player rotations
     */
    animatePlayerRotate() {
        if (this.animatedPlayersRotate.length < 1) {
            this.world.updateManager.remove(this, "world", "animatePlayerRotate")
        }

        const deltaTime = this.world.updateManager.time.deltaInSecond

        let player
        for (let i = 0; i < this.animatedPlayersRotate.length; i++) {
            player = this.animatedPlayersRotate[i]

            this.playerInstance.getMatrixAt(player.index, this.positionningMatrix)
            this.positionningMatrix.decompose(this.dummyObject.position, this.dummyObject.quaternion, this.dummyObject.scale)

            this.dummyQuaternion.slerpQuaternions(player.startRotation, player.endRotation, player.passedTime / player.duration)
            this.dummyObject.quaternion.copy(this.dummyQuaternion)
            this.dummyObject.updateMatrix()

            this.playerInstance.setMatrixAt(player.index, this.dummyObject.matrix)
            this.playerInstance.instanceMatrix.needsUpdate = true
            this.playerInstance.computeBoundingSphere()

            player.passedTime += deltaTime
        }

        this.animatedPlayersRotate = this.animatedPlayersRotate.filter((player) => {
            const remove = player.passedTime > player.duration
            if (remove) {
                this.playerInstance.getMatrixAt(player.index, this.positionningMatrix)
                this.positionningMatrix.decompose(this.dummyObject.position, this.dummyObject.quaternion, this.dummyObject.scale)
                this.dummyObject.quaternion.copy(player.endRotation)
                this.dummyObject.updateMatrix()
                this.playerInstance.setMatrixAt(player.index, this.dummyObject.matrix)
                this.playerInstance.instanceMatrix.needsUpdate = true
                this.playerInstance.computeBoundingSphere()
            }

            return !remove
        })
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Removes a player from the map
     * @param playerId - The player's id
     * @param playerState - The player's state
     */
    removePlayer(playerId, playerState) {
        const index = this.getPlayerById(playerId)

        if (this.world.focusedMeshIndex === index) {
            this.world.focusedMeshIndex = null
            this.world.updateManager.remove(this.world, "world", "focusPlayer")
            this.world.controls.target = new THREE.Vector3()
            this.world.controls.update()
        }

        this.playerMeshes.set(index, null)

        this.positionningMatrix.setPosition(9999, 9999, 9999)
        this.playerInstance.setMatrixAt(index, this.positionningMatrix)
        this.playerInstance.instanceMatrix.needsUpdate = true
        this.playerInstance.computeBoundingSphere()

        this.restackPlayers(playerState.x, playerState.y)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Adds an egg to the map
     * @param eggInfo - The info of the egg
     */
    addEgg(eggInfo) {
        const [eggId, parentId, x, y] = eggInfo

        if (!this.main.gameState.playerInfo.has(parentId)) {
            return
        }

        const eggTeam = this.main.gameState.playerInfo.get(parentId).team

        let unusedIndex = null
        for (let i = 0; i < this.maxEggs; i++) {
            if (this.eggMeshes.get(i) === null) {
                unusedIndex = i
                break
            }
        }

        if (unusedIndex === null) {
            unusedIndex = this.maxEggs
            this.changeInstance('egg')
        }

        this.eggMeshes.set(unusedIndex, eggId)

        this.calculateEggPos(x, y, this.gameState.map[y][x].eggs.length - 1)
        this.positionningMatrix.setPosition(this.dummyVector)
        this.eggInstance.setMatrixAt(unusedIndex, this.positionningMatrix)
        this.eggInstance.instanceMatrix.needsUpdate = true

        this.restackPlayers(x, y)

        const color = new THREE.Color(this.main.gameState.teams.get(eggTeam))
        this.eggInstance.setColorAt(unusedIndex, color)
        this.eggInstance.instanceColor.needsUpdate = true
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Calculates the egg's position in the tile's egg stack
     * @param x - The x coordinate of the tile
     * @param y - The y coordinate of the tile
     * @param eggPositionIndex - The position of the egg in the tile's egg stack
     */
    calculateEggPos(x, y, eggPositionIndex) {
        const start = [-(this.gameMap.mapSize[0] - 1) * 0.5, -(this.gameMap.mapSize[1] - 1) * 0.5]
        const xCellIndex = Math.max(0, eggPositionIndex) % 9
        const yCellIndex = this.eggGroundFloor + (Math.floor(eggPositionIndex / 9) * this.eggFloorSize)
        this.playerGroundFloor = this.playerBaseGroundFloor + (Math.floor(eggPositionIndex / 9) * this.eggFloorSize)

        this.dummyVector.x = start[0] + x - 0.33 + (xCellIndex % 3 / 3)
        this.dummyVector.y = yCellIndex
        this.dummyVector.z = start[1] + y - 0.35  + (Math.floor(xCellIndex / 3) / 3)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Re positions the eggs in the tile's egg stack
     * @param x - The x coordinate of the tile
     * @param y - The y coordinate of the tile
     */
    restackEggs(x, y) {
        const eggs = this.gameState.map[y][x].eggs

        for (let i = 0; i < eggs.length; i++) {
            this.calculateEggPos(x, y, i)
            const index = this.getEggById(eggs[i].id)
            this.eggInstance.getMatrixAt(index, this.positionningMatrix)
            this.positionningMatrix.setPosition(this.dummyVector)
            this.eggInstance.setMatrixAt(index, this.positionningMatrix)
        }
        this.eggInstance.updateMatrix()
        this.eggInstance.instanceMatrix.needsUpdate = true
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Removes the egg from the map
     * @param eggId - The egg's id
     * @param eggState - The egg's state
     */
    removeEgg(eggId, eggState) {
        const index = this.getEggById(eggId)
        this.eggMeshes.set(index, null)

        this.eggInstance.getMatrixAt(index, this.positionningMatrix)
        this.positionningMatrix.setPosition(9999, 9999, 9999)
        this.eggInstance.setMatrixAt(index, this.positionningMatrix)
        this.eggInstance.instanceMatrix.needsUpdate = true

        this.restackEggs(eggState.x, eggState.y)

        this.restackPlayers(eggState.x, eggState.y)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description resets the player and egg instances
     */
    reset() {
        this.playerMeshes.forEach((index) => {
            this.playerInstance.getMatrixAt(index, this.positionningMatrix)
            this.positionningMatrix.setPosition(9999, 9999, 9999)
            this.playerInstance.setMatrixAt(index, this.positionningMatrix)
            this.playerInstance.instanceMatrix.needsUpdate = true
        })

        this.eggMeshes.forEach((index) => {
            this.eggInstance.getMatrixAt(index, this.positionningMatrix)
            this.positionningMatrix.setPosition(9999, 9999, 9999)
            this.eggInstance.setMatrixAt(index, this.positionningMatrix)
            this.eggInstance.instanceMatrix.needsUpdate = true
        })

        this.nullifyMap(this.playerMeshes, 0, this.maxPlayers)
        this.nullifyMap(this.eggMeshes, 0, this.maxEggs)
    }
}

module.exports = Players