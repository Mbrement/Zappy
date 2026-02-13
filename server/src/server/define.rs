// GAME CONSTANT
pub const FOOD: &str = "nourriture";
pub const T1_MAT: &str = "linemate";
pub const T2_MAT: &str = "deraumere";
pub const T3_MAT: &str = "sibur";
pub const T4_MAT: &str = "mendiane";
pub const T5_MAT: &str = "phiras";
pub const T6_MAT: &str = "thystame";

// INVANTORY CONST
pub const FOOD_INV: usize = 0;
pub const T1_MAT_INV: usize = 1;
pub const T2_MAT_INV: usize = 2;
pub const T3_MAT_INV: usize = 3;
pub const T4_MAT_INV: usize = 4;
pub const T5_MAT_INV: usize = 5;
pub const T6_MAT_INV: usize = 6;

//SERVER CONSTANT
pub const GRAPHICAL_CLIENT: &str = "GRAPHIC";
pub const R_OK: &str = "ok\n";
pub const R_KO: &str = "ko\n";
pub const COMMANDLIST: [&str; 12] = [
	"avance",
	"droite",
	"gauche",
	"voir",
	"inventaire",
	"prend",
	"pose",
	"expulse",
	"broadcast",
	"incantation",
	"fork",
	"connect_nbr",
];

// Client constants
pub const ROLE_PLAYER: &str = "player";
pub const ROLE_WELCOMED: &str = "welcomed";
