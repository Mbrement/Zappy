const THREE = require('three/webgpu');
const Stats = require('stats.js');

class Renderer {
    constructor(scene) {
        this.world = self.worldInstance
        this.canvas = this.world.canvas
        this.scene = scene

        this.stats = new Stats()
        this.stats.showPanel(0)
        document.body.appendChild(this.stats.dom)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the renderer instance
     */
    async setInstance() {
        this.instance = new THREE.WebGPURenderer({
            antialias: true,
            canvas: this.canvas,
            alpha: true,
            powerPreference: 'high-performance'
        })
        this.instance.setSize(this.world.sizes.width, this.world.sizes.height)
        this.instance.setPixelRatio(1)
        this.instance.debug.checkShaderErrors = false
        this.instance.shadowMap.enabled = false;

        await this.instance.init()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Updates the renderer instance
     */
    update() {
        this.stats.begin()
        this.instance.render(this.scene, this.world.camera.instance)
        this.stats.end()

        // console.log(this.instance.info.render)
    }
}

module.exports = Renderer