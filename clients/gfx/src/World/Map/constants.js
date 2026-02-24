const THREE = require('three/webgpu')

const resourceTypes = {
    0: 'food',
    1: 'linemate',
    2: 'deraumere',
    3: 'sibur',
    4: 'mendiane',
    5: 'phiras',
    6: 'thystame'
}

const actionTicks = {
    avance: "7",
    droite: "7",
    gauche: "7",
    voir: "7",
    inventaire: "1",
    prend: "7",
    pose: "7",
    expulse: "7",
    broadcast: "7",
    incantation: "300",
    fork: "42",
}

const directions = {
    1: new THREE.Vector3(0, 0, -0.25),
    3: new THREE.Vector3(0, 0, 0.25),
    2: new THREE.Vector3(0.25, 0, 0),
    4: new THREE.Vector3(-0.25, 0, 0),
}

module.exports.resourceTypes = resourceTypes
module.exports.actionTicks = actionTicks
module.exports.directions = directions