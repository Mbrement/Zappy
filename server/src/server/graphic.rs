use crate::server::{Server, client::Client, game::Game, map::Tile};
use std::collections::HashMap;

fn map_size(width: u32, height: u32) -> String {
    format!("msz {} {}\n", width, height)
}

fn content_tile(col: u32, row: u32, tile: &Tile) -> String {
    //format!("bct {} {} {} {} {} {} {} {} {}\n", col, row, )
    // ToDo:: tmp string en attente du rework de Tile
    format!("bct {} {}\n", col, row)
}

fn map_content(map: &Vec<Vec<Tile>>) -> String {
    let mut res = String::new();

    for (y, row) in map.iter().enumerate() {
        for (x, tile) in row.iter().enumerate() {
            res.push_str(&content_tile(x as u32, y as u32, tile));
        }
    };
    res
}

fn team_names(teams: HashMap<String, Vec<mio::Token>>) -> String {
    let mut res = String::new();

    for team in teams.keys() {
        res += &format!("tna {}\n", team);
    };
    res
}

//TODO
//fn new_player() -> String {}

fn player_pos(player: Client) -> String {
    let (x, y) = player.position;
    format!("ppo {:?} {} {} {}\n", player.token, x, y, player.orientation)
}

fn player_level(player: Client) -> String {
    format!("plv {:?} {}\n", player.token, player.level)
}

fn player_inventory(player: Client) -> String {
    let (x, y) = player.position;
    format!("pin {:?} {} {} {} {} {} {} {} {} {}\n",
    player.token, x, y,
    player.inventory[0],
    player.inventory[1],
    player.inventory[2],
    player.inventory[3],
    player.inventory[4],
    player.inventory[5],
    player.inventory[6])
}

fn ban_hammer(player: Client) -> String {
    #[cfg(feature = "debug")]
    println!("get bonked\n");
    format!("pex {:?}\n", player.token)
}

fn player_broadcast(player: Client, message: String) -> String {
    format!("pbc {:?} {}", player.token, message)
}

//TODO
//fn start_incant() -> String {}

//TODO
//fn end_incant() -> String {}

fn birth_egg(player: Client) -> String {
    format!("pex {:?}\n", player.token)
}

fn player_drop_item(player: Client, item_num: u8) -> String {
    format!("pdr {:?} {}\n", player.token, item_num)
}

fn player_pick_item(player: Client, item_num: u8) -> String {
    format!("pgt {:?} {}\n", player.token, item_num)
}

fn player_death(player: Client) -> String {
    format!("pdi {:?}\n", player.token)
}

//TODO: attente que mbrement ajoute l'id au oeufs
//fn egg_laid(player: Client) -> String {
//    let (x, y) = player.position;
//    format!("enw {} {:?} {} {}\n", ???, player.token, x, y)
//}

//fn egg_hatches() -> String {}

fn get_time_unit(tick: u64) -> String {
    format!("sgt {}\n", tick)
}

fn end_game(winner: String) -> String {
    format!("seg {}\n", winner)
}

fn server_msg(message: String) -> String {
    format!("smg {}\n", message)
}

fn unknown_cmd() -> String {
    String::from("suc\n")
}

fn bad_param() -> String {
    String::from("sbp\n")
}

fn graph_connect(server: Server, game: Game) -> String {
    let mut res = String::new();

    res += &map_size(game.map.get_width(), game.map.get_height());
    res += &get_time_unit(server.get_ticks());
    res += &map_content(game.map.get_tiles());
    res += &team_names(game.team);
    //res += &new_player();
    //res += &egg_laid()
    res
}