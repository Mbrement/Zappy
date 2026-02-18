class TileInfoManager {
    constructor() {
        this.VIEW_TITLE = 'Tile Information'
        this.playerOnTileTemplate = document.getElementById('playersOnTile')?.
                                removeChild(
                                    document.getElementById('playersOnTile').firstElementChild
                                )
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Switch to the tile information view and fill it
     * @param resources {TileResources} - The resources on the tile
     * @param players {PlayerInformation[]} - Array of players on the tile
     */
    switchToTileInfoView(resources, players) {
        const tilesPlayerInfoContainer = document.getElementById('tilesPlayerInfoContainer')
        if (tilesPlayerInfoContainer) {
            tilesPlayerInfoContainer.classList.remove('tilesPlayerInfoContainerHidden')

            const nothingToSeeContainer = document.getElementById('nothingToSeeContainer')
            nothingToSeeContainer.classList.add('hidden')

            const tilesPlayerInfoHeaderContainer = document.getElementById('tilesPlayerInfoHeaderContainer')
            tilesPlayerInfoHeaderContainer.classList.remove('hidden')

            const tilesPlayerInfoTitle = tilesPlayerInfoContainer.querySelector('#tilesPlayerInfoTitle')
            tilesPlayerInfoTitle.textContent = this.VIEW_TITLE

            const playerInfoContainer = tilesPlayerInfoContainer.querySelector('#playerInfoContainer')
            playerInfoContainer.classList.add('hidden')

            this.fillTileView(resources, players)

            const tilesInfoContainer = tilesPlayerInfoContainer.querySelector('#tilesInfoContainer')
            tilesInfoContainer.classList.remove('hidden')
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Fill the resources of the tile in the right element
     * @param resources {TileResources} - The tile resources object
     */
    changeTileResources(resources) {
        const tilesInfoContainer = document.getElementById('tilesInfoContainer')
        if (tilesInfoContainer) {
            const foodCount = tilesInfoContainer.querySelector('#foodCount')
            foodCount.textContent = resources.food

            const linemateCount = tilesInfoContainer.querySelector('#linemateCount')
            linemateCount.textContent = resources.linemate

            const deraumereCount = tilesInfoContainer.querySelector('#deraumereCount')
            deraumereCount.textContent = resources.deraumere

            const siburCount = tilesInfoContainer.querySelector('#siburCount')
            siburCount.textContent = resources.sibur

            const mendianeCount = tilesInfoContainer.querySelector('#mendianeCount')
            mendianeCount.textContent = resources.mendiane

            const phirasCount = tilesInfoContainer.querySelector('#phirasCount')
            phirasCount.textContent = resources.phiras

            const thystameCount = tilesInfoContainer.querySelector('#thystameCount')
            thystameCount.textContent = resources.thystame
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Fill the players list on the tile
     * @param players {Array} - List of players on the tile
     */
    changePlayersOnTile(players) {
        this.removeAllPlayers()
        this.addPlayers(players)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Fill the tile view with resources and players
     * @param resources {TileResources} - The tile resources object
     * @param players {Array} - The list of players
     */
    fillTileView(resources, players) {
        this.changeTileResources(resources)
        this.changePlayersOnTile(players)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Remove all players from the playersOnTile div
     */
    removeAllPlayers() {
        const playersOnTile = document.getElementById('playersOnTile')
        if (playersOnTile) {
            while (playersOnTile.firstChild) {
                playersOnTile.removeChild(playersOnTile.firstChild)
            }
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Add a player to the playersOnTile div
     * @param player {PlayerInformation} - The player to add
     */
    addPlayer(player) {
        const playersOnTile = document.getElementById('playersOnTile')
        if (playersOnTile && this.playerOnTileTemplate) {
            const playerDiv = this.playerOnTileTemplate.cloneNode(true)
            playerDiv.id = `player-${player.id}`
            playerDiv.dataset.id = player.id
            playerDiv.dataset.team = player.team
            
            const teamElement = playerDiv.querySelector('.playerTeamIdInfoContainer:nth-child(1) .resourcePlayerText:nth-child(2)')
            teamElement.textContent = player.team
            
            const idElement = playerDiv.querySelector('.playerTeamIdInfoContainer:nth-child(2) .resourcePlayerText:nth-child(2)')
            idElement.textContent = player.id

            playersOnTile.appendChild(playerDiv)
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Add an array of players to the playersOnTile div
     * @param players {PlayerInformation[]} - The array of players to add
     */
    addPlayers(players) {
        this.removeAllPlayers()
        players.forEach((player) => {
            this.addPlayer(player)
        })
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Remove a player from the playersOnTile div
     * @param playerId {number} - The ID of the player to remove
     */
    removePlayer(playerId) {
        const playerDiv = document.getElementById(`player-${playerId}`)
        if (playerDiv) {
            playerDiv.remove()
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Display player info when clicked
     * @param event {Event} - The click event
     */
    displayPlayerInfo(event) {
        const playerDiv = event.target.closest('.playerOnTile')
        if (playerDiv) {
            const playerId = playerDiv.dataset.id
            const playerTeam = playerDiv.dataset.team
            console.log(`Player clicked: ID=${playerId}, Team=${playerTeam}`)
            // TODO: Focus player and display information about it
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Switch pane state between showed and hide
     */
    showHideTilesPlayerInfo() {
        const tilesPlayerInfoContainer = document.getElementById('tilesPlayerInfoContainer')
        if (tilesPlayerInfoContainer) {
            if(tilesPlayerInfoContainer.classList.contains('tilesPlayerInfoContainerHidden')) {
                tilesPlayerInfoContainer.classList.remove('tilesPlayerInfoContainerHidden')
            } else {
                tilesPlayerInfoContainer.classList.add('tilesPlayerInfoContainerHidden')

                new Promise(resolve => {
                    setTimeout(() => {
                        const tilesPlayerInfoHeaderContainer = document.getElementById('tilesPlayerInfoHeaderContainer')
                        tilesPlayerInfoHeaderContainer.classList.add('hidden')

                        const tilesInfoContainer = document.getElementById('tilesInfoContainer')
                        tilesInfoContainer.classList.add('hidden')

                        const playerInfoContainer = document.getElementById('playerInfoContainer')
                        playerInfoContainer.classList.add('hidden')

                        const nothingToSeeContainer = document.getElementById('nothingToSeeContainer')
                        nothingToSeeContainer.classList.remove('hidden')

                        resolve()
                    }, 350)
                })
                // TODO: call cancel rayvast function HERE
            }
        }
    }
}

module.exports = TileInfoManager

/**
 * @typedef {object} TileResources
 * @property {String} food
 * @property {String} linemate
 * @property {String} deraumere
 * @property {String} sibur
 * @property {String} mendiane
 * @property {String} phiras
 * @property {String} thystame
 */

/**
 * @typedef {object} PlayerInformation
 * @property {number} id
 * @property {string} team
 */
