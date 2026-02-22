
class GameState {
    constructor() {
        this.map = null
        this.teams = new Map()
        this.playerInfo = new Map()
        this.eggInfo = new Map()
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Checks if the given coordinates are within the bounds of the map
     * @param x - x coordinate to check
     * @param y - y coordinate to check
     * @returns {null|false|boolean}
     */
    isCorrectCoordinates(x, y) {
        return this.map && y >= 0 && y < this.map.length && x >= 0 && x < this.map[0].length
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Initializes the map with the given size, filling it with empty tiles
     * @param {Number} x - width of the map
     * @param {Number} y - height of the map
     */
    setMapSize(x, y) {
        this.map = new Array(y).fill().map(() => {
            return new Array(x).fill().map(() => {
                return {
                    resources: {
                        food: 0,
                        linemate: 0,
                        deraumere: 0,
                        sibur: 0,
                        mendiane: 0,
                        phiras: 0,
                        thystame: 0,
                    },
                    players: [],
                    eggs: []
                }
            })
        })

        // console.log("Initialized map with size", x, y, this.map)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Sets the content of a tile at the given coordinates
     * @param {Number} x - x coordinate of the tile
     * @param {Number} y - y coordinate of the tile
     * @param {Array} content - an array representing the quantity of each resource on the tile
     */
    setTileContent(x, y, content) {
        const [food, linemate, deraumere, sibur, mendiane, phiras, thystame] = content

        this.map[y][x].resources = {
            // TODO: Uncomment this line when plugged to server
            // food: Math.floor(food / 126),
            food,
            linemate,
            deraumere,
            sibur,
            mendiane,
            phiras,
            thystame
        }

        // console.log("Updated tile", x, y, "with content", this.map[y][x].resources, "Map", this.map)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Adds a team name to the list of teams if it doesn't already exist
     * @param {String} teamName - the name of the team to add
     */
    addTeamName(teamName) {
        this.teams.set(teamName, `hsl(${this.teams.size * 137.508},100%,75%)`)

        // console.log("Added team", teamName, "Total teams", this.teams)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Adds a new player to the game state if it doesn't already exist
     * @param {Array} playerInfo - an array containing the player's information
     * @param {String} playerTeam - the name of the team the player belongs to
     */
    addNewPlayer(playerInfo, playerTeam) {
        const [id, x, y, orientation, level] = playerInfo

        const playerObject = {
            id,
            x,
            y,
            orientation,
            level,
            inventory: {
                food: 0,
                linemate: 0,
                deraumere: 0,
                sibur: 0,
                mendiane: 0,
                phiras: 0,
                thystame: 0
            },
            team: playerTeam,
            color: this.teams.get(playerTeam),
            incantation: { state: false, toLevel: null}
        }

        this.playerInfo.set(id, playerObject)

        this.map[y][x].players.push(playerObject)

        if (window.worldInstance.selectedTile.x === x && window.worldInstance.selectedTile.y === y) {
            window.mainInstance.eventManager.modules.TileInfoManager.addPlayer(playerObject)
        }

        console.log("Added player", id, "Total players are", this.playerInfo)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Updates the position and orientation of an existing player
     * @param {Array} playerInfo - an array containing the player's updated information
     */
    updatePlayerPosition(playerInfo) {
        const [id, x, y, orientation] = playerInfo

        const player = this.playerInfo.get(id)
        this.map[player.y][player.x].players = this.map[player.y][player.x].players.filter((player) => player.id !== id)

        if (window.worldInstance.selectedTile.x === player.x && window.worldInstance.selectedTile.y === player.y) {
            window.mainInstance.eventManager.modules.TileInfoManager.removePlayer(player.id)
        }

        player.x = x
        player.y = y
        player.orientation = orientation

        this.map[y][x].players.push(player)

        if (window.worldInstance.selectedTile.x === x && window.worldInstance.selectedTile.y === y) {
            window.mainInstance.eventManager.modules.TileInfoManager.addPlayer(player)
        }

        console.log("updated player position", id, "Total players are", this.playerInfo)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Updates the level of an existing player
     * @param {Array} playerInfo - an array containing the player's id and level
     */
    updatePlayerLevel(playerInfo) {
        const [id, level] = playerInfo

        const player = this.playerInfo.get(id)
        player.level = level

        window.mainInstance.playerInfoManager.changePlayerLevel(player.id.toString(), player.level)
        console.log("updated player level", id, "Total players are", this.playerInfo)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Updates the inventory of an existing player
     * @param {Array} playerInfo - an array containing the player's id and inventory information
     */
    updatePlayerInventory(playerInfo) {
        const [id, _, __, food, linemate, deraumere, sibur, mendiane, phiras, thystame] = playerInfo

        const player = this.playerInfo.get(id)
        player.inventory = {
            // TODO: Uncomment this line when plugged to server
            // food: Math.floor(food / 126),
            food,
            linemate,
            deraumere,
            sibur,
            mendiane,
            phiras,
            thystame
        }

        window.mainInstance.playerInfoManager.changePlayerInventory(player.id.toString(), player.inventory)
        console.log("updated player inventory", id, "Total players are", this.playerInfo)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Sets the incantation state for a tile and the players involved in the incantation
     * @param {Array} incantationInfo - an array containing the coordinates of the tile, the level of the incantation,
     * and the ids of the players involved
     */
    setIncantation(incantationInfo) {
        const [x, y, level, ...playerIds] = incantationInfo

        this.map[y][x].incantation = true

        for (let id of playerIds) {
            if (this.playerInfo.has(id)) {
                this.playerInfo.get(id).incantation = { state: true, toLevel: level }
            }
        }

        console.log("Set incantation at", x, y, "for level", level, "with players", playerIds)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Resets the incantation state for a tile and the players involved in the incantation
     * @param {Array} incantationInfo - an array containing the coordinates of the tile
     */
    stopIncantation(incantationInfo) {
        const [x, y] = incantationInfo

        this.map[y][x].incantation = false

        console.log("Stopped incantation at", x, y, "Map", this.map)
    }

    deletePlayer(playerId) {
        const deletedPlayer = this.playerInfo.get(playerId)
        this.map[deletedPlayer.y][deletedPlayer.x].players = this.map[deletedPlayer.y][deletedPlayer.x].players.filter((player) => player.id !== playerId)

        if (window.worldInstance.selectedTile.x === deletedPlayer.x && window.worldInstance.selectedTile.y === deletedPlayer.y) {
            window.mainInstance.eventManager.modules.TileInfoManager.removePlayer(deletedPlayer.id)
        }

        this.playerInfo.delete(playerId)

        console.log("Deleted player", playerId, "Total players are", this.playerInfo)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Adds an egg to the tile at the given coordinates
     * @param {Array} eggInfo - an array containing the egg's id, the id of the player who laid the egg,
     * and the coordinates of the tile where the egg is located
     */
    addEgg(eggInfo) {
        const [eggId, parentId, x, y] = eggInfo

        this.map[y][x].eggs.push({id: eggId, parentId})
        this.eggInfo.set(eggId, {id: eggId, parentId, x, y})

        console.log("Added egg", eggId, "at", x, y, "by player", parentId, "Map", this.map)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Removes an egg from the tile and the game state based on the egg's id
     * @param {Number} eggId - the id of the egg to remove
     */
    removeEgg(eggId) {
        const egg = this.eggInfo.get(eggId)
        this.map[egg.y][egg.x].eggs = this.map[egg.y][egg.x].eggs.filter(e => e.id !== eggId)
        this.eggInfo.delete(eggId)

        console.log("Removed egg", eggId, "from", egg.x, egg.y, "Map", this.map)
    }
}

module.exports = GameState
