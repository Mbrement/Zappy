const NetworkClient = require('./Socketing/NetworkClient');
const THREE = require('three/webgpu');
const {OrbitControls} = require('three/examples/jsm/controls/OrbitControls.js');
const MessageHandler = require("./Socketing/MessageHandler");
const EventManager = require('./Interfaces/js/EventManager')

class Main {
    constructor() {
        if (window.mainInstance) {
            return window.mainInstance
        }

        this.eventManager = new EventManager();
        this.messageHandler = new MessageHandler();

        window.mainInstance = this
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Connects to the server
     * @param address - Address of the server
     * @param port - Port of the server
     */
    connectToServer(address, port) {
        this.networkClient = new NetworkClient(address, port);
        this.networkClient.send("GRAPHIC\n")

        this.createThreeScene()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates Three.js scene
     */
    createThreeScene() {
        const canvas = document.getElementById('webgpu')
        const scene = new THREE.Scene()

        const geometry = new THREE.BoxGeometry(1, 1)

        const material = new THREE.MeshBasicNodeMaterial()

        const mesh = new THREE.Mesh(geometry, material)

        scene.add(mesh)

        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        window.addEventListener('resize', () =>
        {
            sizes.width = window.innerWidth
            sizes.height = window.innerHeight

            camera.aspect = sizes.width / sizes.height
            camera.updateProjectionMatrix()

            renderer.setSize(sizes.width, sizes.height)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        })

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200)
        camera.position.set(0, 0, 5)
        scene.add(camera)

        const controls = new OrbitControls(camera, canvas)

        const renderer = new THREE.WebGPURenderer({
            canvas: canvas
        })
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        const tick = () =>
        {
            controls.update()

            renderer.renderAsync(scene, camera)

            window.requestAnimationFrame(tick)
        }

        tick()
    }
}

module.exports = new Main()