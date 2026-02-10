
class GameState {
    constructor() {

        this.map = []
        this.teams = []

    }

    setMapSize(x, y) {
        this.map = new Array(y).fill().map(() => new Array(x).fill().map(() => ({ resources: [], players: [] })))
    }

    setTileContent(x, y, content) {
        if (!this.map || y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
            return
        }

        this.map[y][x].resources = {
            food: content[0],
            linemate: content[1],
            deraumere: content[2],
            sibur: content[3],
            mendiane: content[4],
            phiras: content[5],
            thystame: content[6]
        }
    }
}

module.exports = GameState
