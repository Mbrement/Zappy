const textures = [
    {
        name: 'rockyGroundDiffTexture',
        type: 'texture',
        path: 'static://textures/ground/rocky_terrain_02_diff_1k.jpg'
    },
    {
        name: 'grassGroundDiffTexture',
        type: 'texture',
        path: 'static://textures/ground/aerial_grass_rock_diff_1k.jpg'
    },
    {
        name: 'starTexture',
        type: 'texture',
        path: 'static://textures/star/star.png'
    },
    {
        name: 'moonTexture',
        type: 'texture',
        path: 'static://textures/moon/moon.jpg'
    }
]

const soundtracks = [
    {
        name: 'It\'s_showtime!_8bits',
        volume: 0.05,
        path: 'static://soundtracks/showtime.mp3',
    },
    {
        name: 'Dwarf_fortress_OST',
        volume: 0.05,
        path: 'static://soundtracks/dwarf_fortress.mp3',
    },
    {
        name: 'Ghost_n’_Goblins_(CPC_6128)_OST',
        volume: 0.05,
        path: 'static://soundtracks/Ghostsn_Goblins_Amstrad_CPC.mp3',
    },
    {
        name: 'Sonic_Green_Hill_Zone_OST',
        volume: 0.05,
        path: 'static://soundtracks/sonic_ost.mp3',
    },
]

module.exports.textures = textures
module.exports.soundtracks = soundtracks
