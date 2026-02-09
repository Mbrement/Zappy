export const DEFAULT_HOSTNAME = 'localhost';


/*****************
 *     ERROR     *
 ****************/

export const ARGV_ERROR = 'Usage: ./client -n <team> -p <port> [-h <hostname>]\n-n team_name\n-p port\n-h name of the host, by default localhost';


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
export const TAKE_PHIRAS = `prend ${PHIRAS}\n`
export const TAKE_THYSTAME = `prend ${THYSTAME}\n`

export const PUT_FOOD = `pose ${FOOD}\n`
export const PUT_LINEMATE = `pose ${LINEMATE}\n`
export const PUT_DERAUMERE = `pose ${DERAUMERE}\n`
export const PUT_SIBUR = `pose ${SIBUR}\n`
export const PUT_PHIRAS = `pose ${PHIRAS}\n`
export const PUT_THYSTAME = `pose ${THYSTAME}\n`

export const KICK = 'expulse\n'
export const INCANTATION = 'incatation\n'
export const FORK = 'fork\n'
export const AVAILABLE_CONNECTION = 'connect_nbr\n'


/*****************
 * BROADCAST MSG *
 ****************/
// TODO: DEFINE AVAILABLE BROADCAST MESSAGE
export const BROADCAST = 'broadcast'
