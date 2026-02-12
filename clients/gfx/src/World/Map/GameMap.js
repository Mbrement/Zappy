const THREE = require("three/webgpu");

class GameMap {
    constructor() {
        this.world = window.worldInstance
        this.scene = this.world.scene
        this.gameState = window.mainInstance.gameState

        this.tileSize = 1
        this.tileHeight = 0.1
        this.spacing = 0.1
    }

    createTiles() {
        const mapSize = [this.gameState.map[0].length, this.gameState.map.length]
        const material = new THREE.MeshBasicNodeMaterial()
        const geometry = new THREE.BoxGeometry(this.tileSize, this.tileHeight, this.tileSize)

        const offset = [0, 0]
        const start = [
            -((mapSize[0] - 1) * (this.tileSize + this.spacing)) * 0.5,
            -((mapSize[1] - 1) * (this.tileSize + this.spacing)) * 0.5
        ]

        for (let y = 0; y < mapSize[1]; y++) {
            offset[0] = 0
            for (let x = 0; x < mapSize[0]; x++) {
                let mesh = new THREE.Mesh(geometry, material)
                mesh.position.set(start[0] + x + offset[0], 0, start[1] + y + offset[1])
                this.scene.add(mesh)
                offset[0] += this.tileSize * this.spacing
            }
            offset[1] += this.tileSize * this.spacing
        }
    }
}

module.exports = GameMap