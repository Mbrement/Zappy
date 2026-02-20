export const DEFAULT_HOSTNAME = 'localhost';
export const MAX_SERVER_MSG = 10

/*****************
 *     ERROR     *
 ****************/

export const ARGV_ERROR = 'Usage: ./client -n <team> -p <port> [-h <hostname>]\n-n team_name\n-p port\n-h name of the host, by default localhost';
export const NO_PROMISE_TO_RESOLVE = 'Server has send a message but no promise found to resolve'

/*****************
 *     REGEX     *
 ****************/

export const ONLY_NUMBER_REGEX = /^\d+$/


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

export const INVENTORY_TEMPLATE = {
    nourriture: 0,
    linemate: 0,
    deraumere: 0,
    sibur: 0,
    mendiane: 0,
    phiras: 0,
    thystame: 0
}

export const VALID_ITEM_LIST = new Set([PLAYER, ...Object.keys(INVENTORY_TEMPLATE)])


/*****************
 *  SERVER MSG   *
 ****************/

export const ADVANCE = 'avance\n'
export const RIGHT = 'droite\n'
export const LEFT = 'gauche\n'
export const SEE = 'voir\n'
export const INVENTORY = 'inventaire\n'

export const TAKE_FOOD = `prend ${FOOD}\n`
export const TAKE_LINEMATE = `prend ${LINEMATE}\n`
export const TAKE_DERAUMERE = `prend ${DERAUMERE}\n`
export const TAKE_SIBUR = `prend ${SIBUR}\n`
export const TAKE_MENDIANE = `prend ${MENDIANE}\n`
export const TAKE_PHIRAS = `prend ${PHIRAS}\n`
export const TAKE_THYSTAME = `prend ${THYSTAME}\n`

export const PUT_FOOD = `pose ${FOOD}\n`
export const PUT_LINEMATE = `pose ${LINEMATE}\n`
export const PUT_DERAUMERE = `pose ${DERAUMERE}\n`
export const PUT_SIBUR = `pose ${SIBUR}\n`
export const PUT_MENDIANE = `pose ${MENDIANE}\n`
export const PUT_PHIRAS = `pose ${PHIRAS}\n`
export const PUT_THYSTAME = `pose ${THYSTAME}\n`

export const KICK = 'expulse\n'
export const INCANTATION = 'incantation\n'
export const FORK = 'fork\n'
export const AVAILABLE_CONNECTION = 'connect_nbr\n'
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
export const VISION_REGEX =  /^\{([\w\s]*,?)*}$/
export const INVENTORY_REGEX = /^\{(\s*\w+\s+\d+,?)*\s*}$/
export const OK = 'ok'
export const KO = 'ko'
export const START_INCANTION = 'elevation en cours'
export const INCANTATION_DONE = /^niveau actuel : \d$/
export const DEATH = 'mort'

/*****************
 * BROADCAST MSG *
 ****************/
// Broadcast MSG format: BROADCAST [TEAM_NAME] [SENDER_ID] [ACTION] [ARGUMENTS...]

export const BROADCAST_RECEIVED_REGEX = /^message [0-8], (?:\S* ){2}(?:\S*){1}(?: \d){0,1}$/
export const BROADCAST = 'broadcast'
export const BROAD_NEED_PLAYER = 'NEED'
export const BROAD_COMING = 'OMW'
export const BROAD_WITH_PLAYER = 'HERE'
export const BROAD_INCANTATION = 'CAST'

export const BROADCAST_MSG_OBJECT = {
    direction: null,
    teamName: null,
    senderID: null,
    action: null,
    argument: null
}

export const SOUND_MAPPING = {
    1: [ADVANCE],
    2: [ADVANCE],
    3: [LEFT, ADVANCE],
    4: [LEFT, ADVANCE],
    5: [LEFT, LEFT, ADVANCE],
    6: [RIGHT, ADVANCE],
    7: [RIGHT, ADVANCE],
    8: [ADVANCE]
}


/*****************
 * STATE MACHINE *
 *****************/

const STATE = Object.freeze({
    SURVIVAL: Symbol('SURVIVAL'),
    FARMING: Symbol('FARMING'),
    HOMING: Symbol('HOMING'),
    ELEVATION: Symbol('ELEVATION'),
})