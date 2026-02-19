const THREE = require('three/webgpu')
const { mergeGeometries } = require("three/addons/utils/BufferGeometryUtils.js");

class Players {
    constructor() {
        this.world = window.worldInstance
        this.gameMap = this.world.gameMap
        this.scene = this.world.scene
        this.main = window.mainInstance
        this.gameState = this.main.gameState

        this.maxPlayers = 50
        this.maxEggs = 50

        this.playerMeshes = new Map()
        this.eggMeshes = new Map()

        this.nullifyMap(this.playerMeshes, 0, this.maxPlayers)
        this.nullifyMap(this.eggMeshes, 0, this.maxEggs)

        this.positionningMatrix = new THREE.Matrix4().setPosition(9999, 9999, 9999)
        this.dummyObject = new THREE.Object3D()

        this.createInstances()
    }


    createInstances() {
        this.bodyGeometry = new THREE.CapsuleGeometry(0.05, 0.1, 1, 4, 1)

        this.orientationGeometry = new THREE.CircleGeometry(0.05, 3)
        this.orientationGeometry.rotateX(-90 * Math.PI / 180)
        this.orientationGeometry.rotateY(90 * Math.PI / 180)
        this.orientationGeometry.translate(0, -0.03, -0.09)

        this.playerGeometry = mergeGeometries([this.bodyGeometry, this.orientationGeometry])
        this.playerMaterial = new THREE.MeshBasicMaterial({side: THREE.DoubleSide})

        this.playerInstance = this.createInstance(this.playerGeometry, this.playerMaterial, this.maxPlayers)

        this.eggGeometry = new THREE.CapsuleGeometry(0.05, 0.06, 1, 4, 1)
        this.eggMaterial = new THREE.MeshBasicMaterial()

        this.eggInstance = this.createInstance(this.eggGeometry, this.eggMaterial, this.maxEggs)
    }

    nullifyMap(map, start, end) {
        for (let i = start; i < end; i++) {
            map.set(i, null)
        }
    }

    getPlayerById(id) {
        for (let index = 0; index < this.maxPlayers; index++) {
            if (this.playerMeshes.get(index) === id) {
                return index
            }
        }
    }

    getEggById(id) {
        for (let index = 0; index < this.maxEggs; index++) {
            if (this.eggMeshes.get(index) === id) {
                return index
            }
        }
    }

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

    addPlayer(playerInfo, playerTeam) {
        const [playerId, x, y, orientation] = playerInfo

        if (!this.main.gameState.playerInfo.has(playerId)) {
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

        this.changePlayerPosition([playerId, x, y, orientation])

        const color = new THREE.Color(this.main.gameState.teams.get(playerTeam))
        this.playerInstance.setColorAt(unusedIndex, color)
        this.playerInstance.instanceColor.needsUpdate = true
    }

    rotatePlayer(playerId, orientation) {
        const index = this.getPlayerById(playerId)

        this.playerInstance.getMatrixAt(index, this.positionningMatrix)
        this.positionningMatrix.decompose(this.dummyObject.position, this.dummyObject.quaternion, this.dummyObject.scale)
        this.dummyObject.rotateY((orientation - 1) * -90 * (Math.PI / 180))
        this.dummyObject.updateMatrix()
        this.playerInstance.setMatrixAt(index, this.dummyObject.matrix)
    }

    changePlayerPosition(playerInfo) {
        const [playerId, x, y, orientation] = playerInfo
        const index = this.getPlayerById(playerId)

        const start = [-(this.gameMap.mapSize[0] - 1) * 0.5, -(this.gameMap.mapSize[1] - 1) * 0.5]
        this.positionningMatrix.setPosition(start[0] + x, 1, start[1] + y)
        this.playerInstance.setMatrixAt(index, this.positionningMatrix)
        this.rotatePlayer(playerId, orientation)
        this.playerInstance.instanceMatrix.needsUpdate = true
    }

    removePlayer(playerId) {
        const index = this.getPlayerById(playerId)
        this.playerMeshes.set(index, null)

        this.positionningMatrix.setPosition(9999, 9999, 9999)
        this.playerInstance.setMatrixAt(index, this.positionningMatrix)
        this.playerInstance.instanceMatrix.needsUpdate = true
    }



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

        const start = [-(this.gameMap.mapSize[0] - 1) * 0.5, -(this.gameMap.mapSize[1] - 1) * 0.5]
        this.positionningMatrix.setPosition(start[0] + x, 0.5, start[1] + y)
        this.eggInstance.setMatrixAt(unusedIndex, this.positionningMatrix)
        this.eggInstance.instanceMatrix.needsUpdate = true

        const color = new THREE.Color(this.main.gameState.teams.get(eggTeam))
        this.eggInstance.setColorAt(unusedIndex, color)
        this.eggInstance.instanceColor.needsUpdate = true
    }

    removeEgg(eggId) {
        const index = this.getEggById(eggId)
        this.eggMeshes.set(index, null)

        this.positionningMatrix.setPosition(9999, 9999, 9999)
        this.eggInstance.setMatrixAt(index, this.positionningMatrix)
        this.eggInstance.instanceMatrix.needsUpdate = true
    }
}

module.exports = Players