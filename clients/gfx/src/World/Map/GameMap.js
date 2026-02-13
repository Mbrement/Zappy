const THREE = require("three/webgpu");
const resourceTypes = require("./constants")
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
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the 3D map
     */
    createMap() {
        const mapSize = [this.gameState.map[0].length, this.gameState.map.length]

        this.mapTiles = new Array(mapSize[1]).fill().map(() => {
            return new Array(mapSize[0]).fill().map(() => {
                return {
                    resourceGroup: null,
                    tileMesh: null,
                }
            })
        })

        const material1 = new THREE.MeshStandardNodeMaterial({
            map: this.resources.items['default'].rockyGroundDiffTexture.file
        })

        const material2 = new THREE.MeshStandardNodeMaterial({
            map: this.resources.items['default'].grassGroundDiffTexture.file
        })

        const geometry = new THREE.BoxGeometry(this.tileSize, this.tileHeight, this.tileSize)

        const start = [-(mapSize[0] - 1) * 0.5, -(mapSize[1] - 1) * 0.5]

        let mesh, group
        for (let y = 0; y < mapSize[1]; y++) {
            for (let x = 0; x < mapSize[0]; x++) {
                if ((x + y) % 2 === 0) {
                    mesh = new THREE.Mesh(geometry, material1)
                }
                else {
                    mesh = new THREE.Mesh(geometry, material2)
                }
                mesh.position.set(start[0] + x, - this.tileHeight * 0.6, start[1] + y)

                this.scene.add(mesh)
                this.mapTiles[y][x].tileMesh = mesh

                group = new THREE.Group()
                group.position.set(start[0] + x, 0, start[1] + y)
                this.scene.add(group)
                this.mapTiles[y][x].resourceGroup = group
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
        for (let i = this.mapTiles[y][x].resourceGroup.children.length - 1; i >= 0; i--) {
            this.mapTiles[y][x].resourceGroup.remove(this.mapTiles[y][x].resourceGroup.children[i])
        }

        const tileResources = this.gameState.map[y][x].resources

        for (let i = 0; i <= 6; i++) {
            let quantity = tileResources[this.resourceTypes[i]]
            if (quantity > 0) {
                this.spawnResource(x, y, i, quantity)
            }
        }
    }

    spawnResource(x, y, type, quantity) {
        const resourceData = this.resourceAssets.resourceMeshInfo[this.resourceTypes[type]]

        let resourceMesh

        if (quantity === 1) {
            resourceMesh = new THREE.Mesh(resourceData.geometry, resourceData.material)
        }
        else if (quantity === 2) {
            resourceMesh = this.resourceAssets.assetGroups[this.resourceTypes[type]].duo.clone()
        }
        else {
            resourceMesh = this.resourceAssets.assetGroups[this.resourceTypes[type]].trio.clone()
        }
        this.mapTiles[y][x].resourceGroup.add(resourceMesh)

        resourceMesh.position.set(
            (Math.random() - 0.5) * 0.75,
            0,
            (Math.random() - 0.5) * 0.75
        )

        const children = this.mapTiles[y][x].resourceGroup.children

        let limit = children.length * 5
        for (let i = 0; i < children.length && limit > 0; i++) {
            if (children[i] !== resourceMesh && children[i].position.distanceTo(resourceMesh.position) < 0.6) {
                resourceMesh.position.set(
                    (Math.random() - 0.5) * 0.75,
                    0,
                    (Math.random() - 0.5) * 0.75
                )
                i = 0
            }
            limit--
        }
    }
}

module.exports = GameMap