const THREE = require('three/webgpu');
const { Inspector }  = require('three/addons/inspector/Inspector.js')

class Renderer {
    constructor(scene) {
        this.world = self.worldInstance
        this.canvas = this.world.canvas
        this.scene = scene

        this.setInstance()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the renderer instance
     */
    setInstance() {
        if (this.instance) {
            return
        }

        this.instance = new THREE.WebGPURenderer({
            antialias: true,
            canvas: this.canvas,
            alpha: true,
            powerPreference: 'high-performance',
            forceWebGL: true,
        })
        this.instance.setSize(this.world.sizes.width, this.world.sizes.height)
        this.instance.setPixelRatio(1)
        this.instance.toneMapping = THREE.LinearToneMapping
        this.instance.toneMappingExposure = 0.75
        this.instance.debug.checkShaderErrors = false
        this.instance.shadowMap.enabled = false;

        this.instance.inspector = new Inspector()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Initializes the renderer instance
     */
    async init() {
        await this.instance.init()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Updates the renderer instance
     */
    update() {
        this.instance.render(this.scene, this.world.camera.instance)

        // console.log(this.instance.info.render)
    }
}

module.exports = Renderer