const THREE = require('three/webgpu');
const {OrbitControls} = require('three/examples/jsm/controls/OrbitControls.js');
const Renderer = require("./Renderer");
const Camera = require("./Camera");
const Time = require("./Utils/Time");
const UpdateManager = require("./UpdateManager");
const ThemeManager = require("./ThemeManager");
const GameMap = require("./Map/GameMap");
const Players = require("./Map/Players")
const { createTextGeometry } = require("./threeUtils");

class World {
    constructor() {
        window.worldInstance = this
        this.main = window.mainInstance
        this.resources = this.main.resources
        this.gameState = this.main.gameState
        this.canvas = document.getElementById('webgpu')

        this.sizes = {
            width: 1200,
            height: 800
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
        this.selectedTile = null
        this.gameEnded = false
        this.teamMaterial = new THREE.MeshBasicMaterial()
        this.backToMenuMaterial = new THREE.MeshBasicMaterial()

        this.time = new Time()
        this.updateManager = new UpdateManager()
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x000000)
        this.renderer = new Renderer(this.scene)
        this.themeManager = new ThemeManager()
        this.gameMap = new GameMap()
        this.players = new Players()
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
        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Handles the click event
     * @param event - the click event
     */
    onMouseDown(event) {
        if (event.button !== 0 || event.target !== this.canvas) {
            return
        }

        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        const intersection = this.castRay()
        if (!intersection) {
            if (this.focusedMeshIndex) {
                this.updateManager.remove(this, "world", "focusPlayer")
                this.players.playerInstance.getMatrixAt(this.focusedMeshIndex, this.players.positionningMatrix)
                this.players.positionningMatrix.decompose(this.players.dummyObject.position, this.players.dummyObject.quaternion, this.players.dummyObject.scale)
                this.controls.target = this.players.dummyObject.position
                this.controls.update()
                this.focusedMeshIndex = null
            }

            if (this.main.eventManager.modules.TileInfoManager.isTilesPlayerInfoOpen()) {
                this.main.eventManager.modules.TileInfoManager.showHideTilesPlayerInfo()
            }
            return
        }

        const instanceMesh = intersection.object
        const index = intersection.instanceId;

        if (!this.gameEnded && (instanceMesh === this.gameMap.evenInstance || instanceMesh === this.gameMap.oddInstance)) {
            this.focusedMeshIndex = null
            this.updateManager.remove(this, "world", "focusPlayer")

            const [x, y] = this.gameMap.getTileCoordinate(instanceMesh, index)
            const tileInfo = this.gameState.map[y][x]

            this.selectedTile = {
                x,
                y,
            }

            this.main.eventManager.modules.TileInfoManager.switchToTileInfoView(tileInfo.resources, tileInfo.players)
            return
        }
        else if (!this.gameEnded) {
            this.selectedTile = null

            this.focusedMeshIndex = index
            this.updateManager.add(this, "world", "focusPlayer")

            const playerId = this.players.playerMeshes.get(index)
            const player = this.gameState.playerInfo.get(playerId)

            const playerCopy = Object.assign({}, player)
            playerCopy.id = playerCopy.id.toString()
            this.main.playerInfoManager.switchToPlayerInfoView(playerCopy, playerCopy.inventory)
            return
        }

        this.updateManager.remove(this, "world", "updateEndGameHover")
        this.main.broadcastManager.clearBroadcast()
        this.main.networkClient.closeSocket()

        this.scene.remove(this.backToMenuMesh, this.winMesh, this.teamNameMesh)
        this.teamNameMesh.geometry.dispose()

        this.reset()
        this.gameEnded = false
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Creates the world
     */
    async createWorld() {
        window.addEventListener('resize', this.resizeView.bind(this))
        window.addEventListener('mousemove', this.onMouseMove.bind(this))
        window.addEventListener('mousedown', this.onMouseDown.bind(this))

        this.previousHover = {
            index: null,
            mesh: null,
            color: null,
        }

        this.camera = new Camera(this.scene)
        await this.renderer.init()

        this.controls = new OrbitControls(this.camera.instance, this.canvas)

        this.winMesh = new THREE.Mesh(
            createTextGeometry(0.1, "Winner is", 0.5),
            this.teamMaterial
        )
        this.winMesh.position.set(0, 1.2, 0)

        const backToMenuGeometry = createTextGeometry(0.05, "back to menu", 0.4)
        backToMenuGeometry.rotateX(-Math.PI * 0.5)
        this.backToMenuMesh = new THREE.Mesh(
            backToMenuGeometry,
            this.backToMenuMaterial
        )
        this.backToMenuMesh.position.set(0, -0.1, 1)

        this.updateManager.start()

        this.updateManager.add(this.renderer, 'renderers')
        this.updateManager.add(this, 'world', "updateHover")
        this.resizeView()
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

        let intersection
        if (!this.gameEnded) {
            intersection = this.raycaster.intersectObjects( [this.gameMap.evenInstance, this.gameMap.oddInstance, this.players.playerInstance], false);
        }
        else {
            intersection = this.raycaster.intersectObject( this.backToMenuMesh, false);
        }

        if ( intersection.length > 0 ) {
            return intersection[0]
        }
        return null
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Sets the focused mesh to the player correct player mesh based on the given ID
     * @param playerId - The id of the player we want to focus
     */
    focusPlayerWithId(playerId) {
        this.focusedMeshIndex = this.players.getPlayerById(playerId)
        this.focusPlayer()
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
     * @description Updates the hovering of elements
     */
    updateHover() {
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
            this.hoverColor.r -= 0.5
            this.hoverColor.g -= 0.5
            this.hoverColor.b -= 0.5
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

    /**
     * @author Emma (epolitze) Politzer
     * @description Updates the hovering of elements when the game has ended
     */
    updateEndGameHover() {
        if (this.previousHover.mesh) {
            this.previousHover.mesh.material.color.set(this.previousColor)
        }

        const intersection = this.castRay()
        if (!intersection) {
            return
        }

        const mesh = intersection.object

        this.hoverColor.set(mesh.material.color)
        this.previousColor.copy(this.hoverColor)

        this.hoverColor.r -= 0.5
        this.hoverColor.g -= 0.5
        this.hoverColor.b -= 0.5

        mesh.material.color.set(this.hoverColor)

        this.previousHover.mesh = mesh
        this.previousHover.index = null
        this.previousHover.color = this.previousColor
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Display the winning team
     * @param winningTeam - The name of the winning team
     */
    displayResults(winningTeam) {
        this.updateManager.remove(this, 'world','updateHover')
        this.gameEnded = true
        this.players.reset()
        this.gameMap.removeResources()

        this.teamNameMesh = new THREE.Mesh(
            createTextGeometry(0.1, winningTeam, 1),
            this.teamMaterial
        )
        this.teamNameMesh.position.set(0, 0.3, 0)

        this.teamMaterial.color.set(this.gameState.teams.get(winningTeam))
        this.backToMenuMaterial.color.set(this.gameState.teams.get(winningTeam))
        this.scene.add(this.backToMenuMesh, this.winMesh, this.teamNameMesh)

        this.updateManager.add(this, "world", "updateEndGameHover")
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Resets the world
     */
    reset() {
        window.removeEventListener('resize', this.resizeView.bind(this))
        window.removeEventListener('mousemove', this.onMouseMove.bind(this))
        window.removeEventListener('mousedown', this.onMouseDown.bind(this))

        this.gameMap.reset()
        this.players.reset()
        this.themeManager.reset()

        this.updateManager.remove(this, "world", "focusPlayer")
        this.updateManager.remove(this.renderer, 'renderers')
        this.updateManager.remove(this, 'world','updateHover')

        this.backToMenuMesh.geometry.dispose()
        this.winMesh.geometry.dispose()

        this.camera?.cleanup()
        this.camera = null
        this.controls = null

        this.updateManager?.stop()

        this.renderer.instance.clear()
    }
}

module.exports = World