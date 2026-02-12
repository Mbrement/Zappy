const THREE = require("three/webgpu");

class GameMap {
    constructor() {
        this.world = window.worldInstance
        this.resources = window.mainInstance.resources
        this.scene = this.world.scene
        this.gameState = window.mainInstance.gameState

        this.tileSize = 1
        this.tileHeight = 1
    }

    createTiles() {
        const mapSize = [this.gameState.map[0].length, this.gameState.map.length]

        const material1 = new THREE.MeshStandardNodeMaterial({
            map: this.resources.items['default'].rockyGroundDiffTexture.file
        })

        const material2 = new THREE.MeshStandardNodeMaterial({
            map: this.resources.items['default'].grassGroundDiffTexture.file
        })

        const geometry = new THREE.BoxGeometry(this.tileSize, this.tileHeight, this.tileSize)

        const start = [-(mapSize[0] - 1) * 0.5, -(mapSize[1] - 1) * 0.5]

        let mesh
        for (let y = 0; y < mapSize[1]; y++) {
            for (let x = 0; x < mapSize[0]; x++) {
                if ((x + y) % 2 === 0) {
                    mesh = new THREE.Mesh(geometry, material1)
                }
                else {
                    mesh = new THREE.Mesh(geometry, material2)
                }
                mesh.position.set(start[0] + x, 0, start[1] + y)
                this.scene.add(mesh)
            }
        }
    }
}

module.exports = GameMap