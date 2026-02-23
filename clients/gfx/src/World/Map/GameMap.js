const THREE = require("three/webgpu");
const {resourceTypes} = require("./constants")
const ResourceAssets = require("./ResourceAssets")

class GameMap {
    constructor() {
        this.world = window.worldInstance
        this.resources = window.mainInstance.resources
        this.scene = this.world.scene
        this.gameState = window.mainInstance.gameState
        this.resourceTypes = resourceTypes
        this.resourceAssets = new ResourceAssets()

        this.tileSize = 1
        this.tileHeight = 1

        this.tileGeometry = new THREE.BoxGeometry(this.tileSize, this.tileHeight, this.tileSize)
        this.positioningMatrix = new THREE.Matrix4()

    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the 3D map
     */
    createMap() {
        if (!this.oddMaterial) {
            this.oddMaterial = new THREE.MeshStandardNodeMaterial({
                map: this.resources.items['default'].rockyGroundDiffTexture.file
            })
        }

        if (!this.evenMaterial) {
            this.evenMaterial = new THREE.MeshStandardNodeMaterial({
                map: this.resources.items['default'].grassGroundDiffTexture.file
            })
        }

        this.mapSize = [this.gameState.map[0].length, this.gameState.map.length]

        this.mapTiles = new Array(this.mapSize[1]).fill().map(() => {
            return new Array(this.mapSize[0]).fill().map(() => {
                return {
                    tile: null
                }
            })
        })

        this.resourceAssets.createResourceInstances(this.mapSize)

        const oddInstanceQuantity = Math.ceil(this.mapSize[0] * this.mapSize[1] / 2)
        const evenInstanceQuantity = Math.floor(this.mapSize[0] * this.mapSize[1] / 2)
        this.oddInstance = new THREE.InstancedMesh(this.tileGeometry, this.oddMaterial, oddInstanceQuantity)
        this.evenInstance = new THREE.InstancedMesh(this.tileGeometry, this.evenMaterial, evenInstanceQuantity)

        const start = [-(this.mapSize[0] - 1) * 0.5, -(this.mapSize[1] - 1) * 0.5]

        let oddIndex = 0, evenIndex = 0
        for (let y = 0; y < this.mapSize[1]; y++) {
            for (let x = 0; x < this.mapSize[0]; x++) {
                this.positioningMatrix.setPosition(start[0] + x, - this.tileHeight * 0.6, start[1] + y)

                if ((x + y) % 2 === 0) {
                    this.oddInstance.setMatrixAt(oddIndex, this.positioningMatrix)
                    this.oddInstance.instanceMatrix.needsUpdate = true

                    this.oddInstance.setColorAt(oddIndex, new THREE.Color())
                    this.oddInstance.instanceColor.needsUpdate = true

                    this.mapTiles[y][x].tile = {
                        instance: this.oddInstance,
                        index: oddIndex
                    }
                    oddIndex++
                }
                else {
                    this.evenInstance.setMatrixAt(evenIndex, this.positioningMatrix)
                    this.evenInstance.instanceMatrix.needsUpdate = true

                    this.evenInstance.setColorAt(oddIndex, new THREE.Color())
                    this.evenInstance.instanceColor.needsUpdate = true

                    this.mapTiles[y][x].tile = {
                        instance: this.evenInstance,
                        index: evenIndex
                    }
                    evenIndex++
                }
            }
        }

        this.scene.add(this.oddInstance, this.evenInstance)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description returns the map coordinates for the tile
     * @param instance - The instance the tile is part of
     * @param index - The index of the tile in the instance
     * @returns {number[]} - X and Y map coordinates of the tile
     */
    getTileCoordinate(instance, index) {
        let x, y
        for (y = 0; y < this.mapSize[1]; y++) {
            for (x = 0; x < this.mapSize[0]; x++) {
                if (this.mapTiles[y][x].tile.index === index &&
                    this.mapTiles[y][x].tile.instance === instance) {
                    return [x, y]
                }
            }
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description adds the resources for a tile
     * @param x - the x coordinate of the tile
     * @param y - the y coordinate of the tile
     */
    loadTileResources(x, y) {
        const tileResources = this.gameState.map[y][x].resources

        const availableSlots = Array.from({ length: 9 }, (_, i) => i)
        availableSlots.sort(() => Math.random() - 0.5);

        let cellIndex = 0
        for (let i = 0; i <= 6; i++) {
            this.resetTileResource(x, y, i)
            let quantity = tileResources[this.resourceTypes[i]]
            if (quantity > 0) {
                cellIndex = availableSlots.pop()
                this.spawnResource(x, y, cellIndex, i, quantity)
            }
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Resets a tiles resources to 0
     * @param x - the x coordinate of the tile
     * @param y - the y coordinate of the tile
     * @param type - the type of resource we want to remove
     */
    resetTileResource(x, y, type) {
        const index = y * this.mapSize[1] + x
        const resourceData = this.resourceAssets.resourceInstances[this.resourceTypes[type]]

        this.positioningMatrix.setPosition(9999, 9999, 9999)
        resourceData.singleInstance.setMatrixAt(index, this.positioningMatrix)
        resourceData.singleInstance.instanceMatrix.needsUpdate = true

        resourceData.duoInstance.setMatrixAt(index, this.positioningMatrix)
        resourceData.duoInstance.instanceMatrix.needsUpdate = true

        resourceData.trioInstance.setMatrixAt(index, this.positioningMatrix)
        resourceData.trioInstance.instanceMatrix.needsUpdate = true
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Spawns a resource on the tile
     * @param x - the x coordinate of the tile
     * @param y - the y coordinate of the tile
     * @param cellIndex - The index of the resource in the tile
     * @param type - the type of resource we want to remove
     * @param quantity - the quantity of the resource
     */
    spawnResource(x, y, cellIndex, type, quantity) {
        const index = y * this.mapSize[1] + x
        const resourceData = this.resourceAssets.resourceInstances[this.resourceTypes[type]]

        let resourceInstance
        if (quantity === 1) {
            resourceInstance = resourceData.singleInstance
        }
        else if (quantity === 2) {
            resourceInstance = resourceData.duoInstance
        }
        else {
            resourceInstance = resourceData.trioInstance
        }

        const start = [-(this.mapSize[0] - 1) * 0.5, -(this.mapSize[1] - 1) * 0.5]

        const finalX = start[0] + x - 0.33 + (cellIndex % 3 / 3)
        const finalY = 0
        const finalZ = start[1] + y - 0.35  + (Math.floor(cellIndex / 3) / 3)

        this.positioningMatrix.setPosition(finalX, finalY, finalZ)
        resourceInstance.setMatrixAt(index, this.positioningMatrix)
        resourceInstance.instanceMatrix.needsUpdate = true
    }

    /**
     * Emma (epolitze) Politzer
     * @description resets map tile instances
     */
    reset() {
        this.scene.remove(this.oddInstance)
        this.oddInstance = null
        this.scene.remove(this.evenInstance)
        this.evenInstance = null

        this.resourceAssets.reset()
    }
}

module.exports = GameMap