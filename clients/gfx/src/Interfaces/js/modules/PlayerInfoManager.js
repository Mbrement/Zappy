class PlayerInfoManager  {
    constructor() {
        this.VIEW_TITLE = 'Player Information'
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Switch to the player information view and fill it
     * @param info {PlayerInformation} - The player information object
     * @param inventory {PlayerInventory} - The player inventory object
     */
    switchToPlayerInfoView(info, inventory) {
        const tilesPlayerInfoContainer = document.getElementById('tilesPlayerInfoContainer')
        if(tilesPlayerInfoContainer) {
            tilesPlayerInfoContainer.classList.remove('tilesPlayerInfoContainerHidden')

            const nothingToSeeContainer = document.getElementById('nothingToSeeContainer')
            nothingToSeeContainer.classList.add('hidden')

            const tilesPlayerInfoHeaderContainer = document.getElementById('tilesPlayerInfoHeaderContainer')
            tilesPlayerInfoHeaderContainer.classList.remove('hidden')

            const tilesPlayerInfoTitle = tilesPlayerInfoContainer.querySelector('#tilesPlayerInfoTitle')
            tilesPlayerInfoTitle.textContent = this.VIEW_TITLE

            const tilesInfoContainer = tilesPlayerInfoContainer.querySelector('#tilesInfoContainer')
            tilesInfoContainer.classList.add('hidden')

            this.fillPlayerView(info, inventory)

            const playerInfoContainer = tilesPlayerInfoContainer.querySelector('#playerInfoContainer')
            playerInfoContainer.classList.remove('hidden')
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Fill information about the player in the right element
     * @param info {PlayerInformation} - The player information object
     */
    changePlayerInfo(info) {
        const playerInfoContainer = document.getElementById('playerInfoContainer')
        if(playerInfoContainer) {
            const playerID = playerInfoContainer.querySelector('#playerID')
            playerID.textContent = info.id

            const playerTeamName = playerInfoContainer.querySelector('#playerTeamName')
            playerTeamName.textContent = info.team

            const playerLevel = playerInfoContainer.querySelector('#playerLevel')
            playerLevel.textContent = info.level
        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Fill the inventory of the player in the right element
     * @param inventory {PlayerInventory} - The player inventory object
     */
    changePlayerInventory(inventory) {
        const playerInfoContainer = document.getElementById('playerInfoContainer')
        if(playerInfoContainer) {
            const playerFoodCount = playerInfoContainer.querySelector('#playerFoodCount')
            playerFoodCount.textContent = inventory.food

            const playerLinemateCount = playerInfoContainer.querySelector('#playerLinemateCount')
            playerLinemateCount.textContent = inventory.linemate

            const playerDeraumereCount = playerInfoContainer.querySelector('#playerDeraumereCount')
            playerDeraumereCount.textContent = inventory.deraumere

            const playerSiburCount = playerInfoContainer.querySelector('#playerSiburCount')
            playerSiburCount.textContent = inventory.sibur

            const playerMendianeCount = playerInfoContainer.querySelector('#playerMendianeCount')
            playerMendianeCount.textContent = inventory.mendiane

            const playerPhirasCount = playerInfoContainer.querySelector('#playerPhirasCount')
            playerPhirasCount.textContent = inventory.phiras

            const playerThystameCount = playerInfoContainer.querySelector('#playerThystameCount')
            playerThystameCount.textContent = inventory.thystame

        }
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Simple caller to method changePlayerInfo and changePlayerInventory
     * @param info {PlayerInformation} - The player information object
     * @param inventory {PlayerInventory} - The player inventory object
     */
    fillPlayerView(info, inventory) {
        this.changePlayerInfo(info);
        this.changePlayerInventory(inventory);
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Change the level of the player
     * @param newLevel {String} - The new level of the player
     */
    changePlayerLevel(newLevel) {
        const playerLevel = document.getElementById('playerLevel')
        if(playerLevel) {
            playerLevel.textContent = newLevel
        }
    }
}

module.exports  = new PlayerInfoManager();


/**
 * @description How method changePlayerInfo and fillPlayerView await their info object
 * @typedef {object} PlayerInformation - The player information object
 * @property {String} id - The player id
 * @property {String} team - The player team
 * @property {String} level - The player level
 * @property {String} color - The player's team color
 */

/**
 * @description How method changePlayerInventory and fillPlayerView await their inventory object
 * @typedef {object} PlayerInventory - The player inventory object
 * @property {String} food - The food count
 * @property {String} linemate - The linemate count
 * @property {String} deraumere - The deraumere count
 * @property {String} sibur - The sibur count
 * @property {String} mendiane - The mendiane count
 * @property {String} phiras - The phiras count
 * @property {String} thystame - The thystame count
 */