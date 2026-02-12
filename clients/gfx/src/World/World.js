const THREE = require('three/webgpu');
const {OrbitControls} = require('three/examples/jsm/controls/OrbitControls.js');
const Renderer = require("./Renderer");
const Camera = require("./Camera");
const UpdateManager = require("./UpdateManager");
const Time = require("./Utils/Time");
const GameMap = require("./Map/GameMap");

class World {
    constructor() {
        window.worldInstance = this
        this.main = window.mainInstance
        this.canvas = document.getElementById('webgpu')

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        window.addEventListener('resize', this.resizeView.bind(this))

        this.time = new Time()
        this.scene = new THREE.Scene()
        this.gameMap = new GameMap()
    }

    resizeView() {
        this.sizes.width = window.innerWidth
        this.sizes.height = window.innerHeight

        this.camera.instance.aspect = this.sizes.width / this.sizes.height
        this.camera.instance.updateProjectionMatrix()

        this.renderer.instance.setSize(this.sizes.width, this.sizes.height)
        this.renderer.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the world
     */
    async createWorld() {
        this.camera = new Camera(this.scene)
        this.renderer = new Renderer(this.scene)
        await this.renderer.setInstance()

        this.controls = new OrbitControls(this.camera.instance, this.canvas)

        this.updateManager = new UpdateManager()

        this.updateManager.add(this.renderer, 'renderers')
    }
}

module.exports = World