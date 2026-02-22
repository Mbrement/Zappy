const THREE = require('three/webgpu');
const {OrbitControls} = require('three/examples/jsm/controls/OrbitControls.js');
const Renderer = require("./Renderer");
const Camera = require("./Camera");
const Time = require("./Utils/Time");
const UpdateManager = require("./UpdateManager");
const ThemeManager = require("./ThemeManager");
const GameMap = require("./Map/GameMap");
const Players = require("./Map/Players")

class World {
    constructor() {
        window.worldInstance = this
        this.main = window.mainInstance
        this.resources = this.main.resources
        this.gameState = this.main.gameState
        this.canvas = document.getElementById('webgpu')

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2( 1, 1 );
        this.hoverColor = new THREE.Color()
        this.previousColor = new THREE.Color()
        this.previousHover = {
            index: null,
            mesh: null,
            color: null,
        }
        this.focusedMeshIndex = null

        this.time = new Time()
        this.updateManager = new UpdateManager()
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x000000)
        this.renderer = new Renderer(this.scene)
        this.themeManager = new ThemeManager()
        this.gameMap = new GameMap()
        this.players = new Players()

        window.addEventListener('resize', this.resizeView.bind(this))
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        window.addEventListener('mousedown', this.onMouseDown.bind(this))
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Handles the resize event
     */
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

    /**
     * @author Emma (epolitze) Politzer
     * @description Handles the mousemove event
     * @param event - the mousemove event
     */
    onMouseMove(event) {
        event.preventDefault();

        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Handles the click event
     * @param event - the click event
     */
    onMouseDown(event) {
        event.preventDefault();

        if (event.button !== 0 || event.target !== this.canvas) {
            return
        }

        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        const intersection = this.castRay()
        if (!intersection) {
            this.focusedMeshIndex = null
            this.updateManager.remove(this, "world", "focusPlayer")

            if (this.main.eventManager.modules.TileInfoManager.isTilesPlayerInfoOpen()) {
                this.main.eventManager.modules.TileInfoManager.showHideTilesPlayerInfo()
            }
            return
        }

        const instanceMesh = intersection.object
        const index = intersection.instanceId;

        if (instanceMesh === this.gameMap.evenInstance || instanceMesh === this.gameMap.oddInstance) {
            this.focusedMeshIndex = null
            this.updateManager.remove(this, "world", "focusPlayer")

            const [x, y] = this.gameMap.getTileCoordinate(instanceMesh, index)
            const tileInfo = this.gameState.map[y][x]

            this.main.eventManager.modules.TileInfoManager.switchToTileInfoView(tileInfo.resources, tileInfo.players)
        }
        else {
            this.focusedMeshIndex = index
            this.updateManager.add(this, "world", "focusPlayer")

            const playerId = this.players.playerMeshes.get(index)
            const player = this.gameState.playerInfo.get(playerId)

            const playerCopy = Object.assign({}, player)
            playerCopy.id = playerCopy.id.toString()
            this.main.playerInfoManager.switchToPlayerInfoView(playerCopy, playerCopy.inventory)
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the world
     */
    async createWorld() {
        this.camera = new Camera(this.scene)
        await this.renderer.init()

        this.controls = new OrbitControls(this.camera.instance, this.canvas)

        this.updateManager.start()

        this.updateManager.add(this.renderer, 'renderers')
        this.updateManager.add(this, 'world')
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Casts a ray from the camera to the mouse position
     * @returns the first object it intercepted, if no object was intercepted returns null
     */
    castRay() {
        if (!this.raycaster || !this.gameMap.evenInstance) {
            return
        }

        this.raycaster.setFromCamera( this.mouse, this.camera.instance );

        const intersection = this.raycaster.intersectObjects( [this.gameMap.evenInstance, this.gameMap.oddInstance, this.players.playerInstance], false);

        if ( intersection.length > 0 ) {
            return intersection[0]
        }
        return null
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Focuses the camera/controls on a given player
     */
    focusPlayer() {
        this.players.playerInstance.getMatrixAt(this.focusedMeshIndex, this.players.positionningMatrix)
        this.players.positionningMatrix.decompose(this.players.dummyObject.position, this.players.dummyObject.quaternion, this.players.dummyObject.scale)
        this.controls.target = this.players.dummyObject.position
        this.controls.update()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Updates the world
     */
    update() {
        if (this.previousHover.mesh) {
            this.previousHover.mesh.setColorAt(this.previousHover.index, this.previousColor)
            this.previousHover.mesh.instanceColor.needsUpdate = true;
        }

        const intersection = this.castRay()
        if (!intersection) {
            return
        }

        const instanceMesh = intersection.object
        const index = intersection.instanceId;

        instanceMesh.getColorAt( index, this.hoverColor );
        this.previousColor.copy(this.hoverColor)
        if (instanceMesh === this.players.playerInstance) {
            this.hoverColor.r += 0.2
            this.hoverColor.g += 0.2
            this.hoverColor.b += 0.2
        }
        else {
            this.hoverColor.set(2, 2, 2)
        }

        instanceMesh.setColorAt( index, this.hoverColor);
        instanceMesh.instanceColor.needsUpdate = true;

        this.previousHover.mesh = instanceMesh
        this.previousHover.index = index
        this.previousHover.color = this.previousColor

    }
}

module.exports = World