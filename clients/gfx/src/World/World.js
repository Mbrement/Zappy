const THREE = require('three/webgpu');
const {OrbitControls} = require('three/examples/jsm/controls/OrbitControls.js');
const Renderer = require("./Renderer");
const Camera = require("./Camera");
const UpdateManager = require("./UpdateManager");
const Time = require("./Utils/Time");
const GameMap = require("./Map/GameMap");
const Players = require("./Map/Players")

class World {
    constructor() {
        window.worldInstance = this
        this.main = window.mainInstance
        this.resources = this.main.resources;
        this.canvas = document.getElementById('webgpu')

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2( 1, 1 );
        this.hoverColor = new THREE.Color()
        this.previousHover = {
            index: null,
            mesh: null
        }

        this.time = new Time()
        this.scene = new THREE.Scene()
        this.gameMap = new GameMap()
        this.players = new Players()

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(this.ambientLight)

        window.addEventListener('resize', this.resizeView.bind(this))
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
    }

    resizeView() {
        this.sizes.width = window.innerWidth
        this.sizes.height = window.innerHeight

        if (this.camera) {
            this.camera.instance.aspect = this.sizes.width / this.sizes.height
            this.camera.instance.updateProjectionMatrix()
        }

        if (this.renderer) {
            this.renderer.instance.setSize(this.sizes.width, this.sizes.height)
            this.renderer.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }
    }

    onMouseMove(event) {
        event.preventDefault();

        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
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
        this.updateManager.add(this, 'world')
    }

    update() {
        this.raycaster.setFromCamera( this.mouse, this.camera.instance );
        if (!this.gameMap.evenInstance) {
            return
        }

        const intersection = this.raycaster.intersectObjects( [this.gameMap.evenInstance, this.gameMap.oddInstance], false);

        if ( intersection.length > 0 ) {
            // console.log("Intersected", intersection)

            if (this.previousHover.mesh) {
                this.previousHover.mesh.setColorAt(this.previousHover.index, this.hoverColor.set(1, 1, 1))
                this.previousHover.mesh.instanceColor.needsUpdate = true;
            }

            const instanceMesh = intersection[ 0 ].object
            const index = intersection[ 0 ].instanceId;

            instanceMesh.getColorAt( index, this.hoverColor );
            instanceMesh.setColorAt( index, this.hoverColor.set(3, 3, 3) );
            instanceMesh.instanceColor.needsUpdate = true;

            this.previousHover.mesh = instanceMesh
            this.previousHover.index = index
        }
        else {
            if (this.previousHover.mesh) {
                this.previousHover.mesh.setColorAt(this.previousHover.index, this.hoverColor.set(1, 1, 1))
                this.previousHover.mesh.instanceColor.needsUpdate = true;
            }
        }
    }
}

module.exports = World