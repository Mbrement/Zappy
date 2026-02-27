export const DEFAULT_HOSTNAME = 'localhost';
export const MAX_SERVER_MSG = 9
export const VISION_REFRESH_RATE = 500
export const INVENTORY_CMD_REFRESH_RATE = 5000
export const HEARTBEAT_INTERVAL = 150
export const HEARTBEAT_TIMEOUT = 400
export const FOOD_UNIT = 126

/*****************
 *     ERROR     *
 ****************/

export const ARGV_ERROR = 'Usage: ./client -n <team> -p <port> [-h <hostname>]\n-n team_name\n-p port\n-h name of the host, by default localhost';
export const NO_PROMISE_TO_RESOLVE = 'Server has send a message but no promise found to resolve'
export const NO_SPACE_AVAILABLE = 'No space available in the team... Exiting.'
/*****************
 *     REGEX     *
 ****************/

export const ONLY_NUMBER_REGEX = /^\d+$/
export const MAP_SIZE_REGEX = /^\d+ \d+$/


/*****************
 *     OBJECT    *
 ****************/

export const PLAYER = 'player'
export const FOOD = 'nourriture'
export const LINEMATE = 'linemate'
export const DERAUMERE = 'deraumere'
export const SIBUR = 'sibur'
export const MENDIANE = 'mendiane'
export const PHIRAS = 'phiras'
export const THYSTAME = 'thystame'

export const INCANTATION_TABLE = [
    {player: 1, linemate: 1, deraumere: 0, sibur: 0, mendiane: 0, phiras: 0, thystame: 0},
    {player: 2, linemate: 1, deraumere: 1, sibur: 1, mendiane: 0, phiras: 0, thystame: 0},
    {player: 2, linemate: 2, deraumere: 0, sibur: 1, mendiane: 0, phiras: 2, thystame: 0},
    {player: 4, linemate: 1, deraumere: 1, sibur: 2, mendiane: 0, phiras: 1, thystame: 0},
    {player: 4, linemate: 1, deraumere: 2, sibur: 1, mendiane: 3, phiras: 0, thystame: 0},
    {player: 6, linemate: 1, deraumere: 2, sibur: 3, mendiane: 0, phiras: 1, thystame: 0},
    {player: 6, linemate: 2, deraumere: 2, sibur: 2, mendiane: 2, phiras: 2, thystame: 1},
]

export const INVENTORY_CMD_TEMPLATE = {
    nourriture: 0,
    linemate: 0,
    deraumere: 0,
    sibur: 0,
    mendiane: 0,
    phiras: 0,
    thystame: 0
}

export const VALID_ITEM_LIST = new Set([PLAYER, ...Object.keys(INVENTORY_CMD_TEMPLATE)])

/****************
 *   BASE CMD   *
 ***************/

export const ADVANCE = 'avance'
export const RIGHT = 'droite'
export const LEFT = 'gauche'
export const SEE = 'voir'
export const INVENTORY = 'inventaire'

export const TAKE = 'prend'
export const PUT_FOOD = 'pose'
export const KICK = 'expulse'
export const INCANTATION = 'incantation'
export const FORK = 'fork'
export const AVAILABLE_CONNECTION = 'connect_nbr'

/*****************
 *  SERVER MSG   *
 ****************/

export const ADVANCE_CMD = 'avance\n'
export const RIGHT_CMD = 'droite\n'
export const LEFT_CMD = 'gauche\n'
export const SEE_CMD = 'voir\n'
export const INVENTORY_CMD = 'inventaire\n'

export const TAKE_FOOD_CMD = `prend ${FOOD}\n`
export const TAKE_LINEMATE_CMD = `prend ${LINEMATE}\n`
export const TAKE_DERAUMERE_CMD = `prend ${DERAUMERE}\n`
export const TAKE_SIBUR_CMD = `prend ${SIBUR}\n`
export const TAKE_MENDIANE_CMD = `prend ${MENDIANE}\n`
export const TAKE_PHIRAS_CMD = `prend ${PHIRAS}\n`
export const TAKE_THYSTAME_CMD = `prend ${THYSTAME}\n`


export const TAKE_COMMANDS = {
    [LINEMATE]: TAKE_LINEMATE_CMD,
    [DERAUMERE]: TAKE_DERAUMERE_CMD,
    [SIBUR]: TAKE_SIBUR_CMD,
    [MENDIANE]: TAKE_MENDIANE_CMD,
    [PHIRAS]: TAKE_PHIRAS_CMD,
    [THYSTAME]: TAKE_THYSTAME_CMD,
    [FOOD]: TAKE_FOOD_CMD
};

export const PUT_FOOD_CMD = `pose ${FOOD}\n`
export const PUT_LINEMATE_CMD = `pose ${LINEMATE}\n`
export const PUT_DERAUMERE_CMD = `pose ${DERAUMERE}\n`
export const PUT_SIBUR_CMD = `pose ${SIBUR}\n`
export const PUT_MENDIANE_CMD = `pose ${MENDIANE}\n`
export const PUT_PHIRAS_CMD = `pose ${PHIRAS}\n`
export const PUT_THYSTAME_CMD = `pose ${THYSTAME}\n`

export const KICK_CMD = 'expulse\n'
export const INCANTATION_CMD = 'incantation\n'
export const FORK_CMD = 'fork\n'
export const AVAILABLE_CONNECTION_CMD = 'connect_nbr\n'
export const COMMAND_COST = {
    avance: 7,
    droite: 7,
    gauche: 7,
    voir: 7,
    inventaire: 1,
    prend: 7,
    pose: 7,
    expulse: 7,
    broadcast: 7,
    incantation: 300,
    fork: 42,
    connect_nbr: 0
}

/*****************
 *  SERVER RSP   *
 ****************/

export const WELCOME = 'BIENVENUE'
export const VISION_REGEX =  /^\{[\w\s,]*}$/
export const INVENTORY_CMD_REGEX = /^\{[\w\s,\d]*}$/
export const EXPULSION_REGEX = /^deplacement [1-8]$/
export const OK = 'ok'
export const KO = 'ko'
export const START_INCANTION = 'elevation en cours'
export const INCANTATION_DONE = /^niveau actuel : \d$/
export const DEATH = 'mort'


/*****************
 * BROADCAST MSG *
 ****************/
// Broadcast MSG format: BROADCAST [TEAM_NAME] [SENDER_ID] [ACTION] [ARGUMENTS...]

export const BROADCAST_RECEIVED_REGEX = /^message [0-8],.*/
export const BROADCAST = 'broadcast'
export const BROAD_NEED_PLAYER = 'NEED'
export const BROAD_COMING = 'OMW'
export const BROAD_WITH_PLAYER = 'HERE'
export const BROAD_INCANTATION = 'CAST'
export const BROAD_CANCEL = 'CANCEL'
export const BROAD_ALIVE = 'ALIVE'


export const BROADCAST_MSG_OBJECT = {
    direction: null,
    teamName: null,
    senderID: null,
    action: null,
    argument: null
}

export const SOUND_MAPPING = {
    1: [ADVANCE_CMD],
    2: [ADVANCE_CMD],
    3: [LEFT_CMD, ADVANCE_CMD],
    4: [LEFT_CMD, ADVANCE_CMD],
    5: [LEFT_CMD, LEFT_CMD, ADVANCE_CMD],
    6: [RIGHT_CMD, ADVANCE_CMD],
    7: [RIGHT_CMD, ADVANCE_CMD],
    8: [ADVANCE_CMD]
}


/*****************
 * STATE MACHINE *
 *****************/

export const STATE = Object.freeze({
    INIT: Symbol('INIT'),
    SURVIVAL: Symbol('SURVIVAL'),
    FARMING: Symbol('FARMING'),
    HOMING: Symbol('HOMING'),
    ELEVATION: Symbol('ELEVATION'),
})