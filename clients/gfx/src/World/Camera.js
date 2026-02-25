const THREE = require('three/webgpu');

class Camera {
    constructor(scene) {
        this.world = self.worldInstance
        this.sizes = this.world.sizes
        this.canvas = this.world.canvas
        this.scene = scene;

        this.setInstance()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the camera instance
     */
    setInstance() {
        this.instance = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 200)
        this.instance.position.set(0, 5, 5)

        this.scene.add(this.instance)
    }
}

module.exports = Camera
