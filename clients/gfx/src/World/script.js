const nwWindow = nw.Window.get()
nwWindow.showDevTools()

const THREE = require('three/webgpu')
const {OrbitControls} = require('three/examples/jsm/controls/OrbitControls.js');

const net = require('node:net')
console.log(net)

/**
 * Base
 */

const canvas = document.getElementById('webgpu')
const scene = new THREE.Scene()

const geometry = new THREE.BoxGeometry(1, 1)

const material = new THREE.MeshBasicNodeMaterial()

const mesh = new THREE.Mesh(geometry, material)

scene.add(mesh)

/**
 * Sizes
 */
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

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 200)
camera.position.set(0, 0, 5)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)

/**
 * Renderer
 */
const renderer = new THREE.WebGPURenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const tick = () =>
{
    controls.update()

    renderer.renderAsync(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()