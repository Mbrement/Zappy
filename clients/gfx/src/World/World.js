const THREE = require('three/webgpu');
const {OrbitControls} = require('three/examples/jsm/controls/OrbitControls.js');
const Renderer = require("./Renderer");
const Camera = require("./Camera");

class World {
    constructor() {
        this.main = window.mainInstance
        this.canvas = document.getElementById('webgpu')

        this.scene = new THREE.Scene()

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        window.addEventListener('resize', () =>
        {
            this.sizes.width = window.innerWidth
            this.sizes.height = window.innerHeight

            this.camera.instance.aspect = this.sizes.width / this.sizes.height
            this.camera.instance.updateProjectionMatrix()

            this.renderer.instance.setSize(this.sizes.width, this.sizes.height)
            this.renderer.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        })

        window.worldInstance = this
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the world
     */
    async createWorld() {
        const material = new THREE.MeshBasicNodeMaterial()
        const geometry = new THREE.BoxGeometry(1, 1)
        const mesh = new THREE.Mesh(geometry, material)
        this.scene.add(mesh)

        this.camera = new Camera(this.scene)
        this.renderer = new Renderer(this.scene)
        await this.renderer.setInstance()

        this.controls = new OrbitControls(this.camera.instance, this.canvas)

        const tick = () =>
        {
            this.controls.update()

            this.renderer.update()

            window.requestAnimationFrame(tick)
        }

        tick()
    }
}

module.exports = World