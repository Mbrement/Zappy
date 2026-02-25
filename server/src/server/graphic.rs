use mio::Token;

use crate::server::client;
use crate::server::{Server, client::Client, define, game::Game, map::Tile};
use std::collections::HashMap;
use std::io::Write;

fn map_size(width: u32, height: u32) -> String {
    format!("msz {} {}\n", width, height)
}

pub(crate) fn content_tile(col: u32, row: u32, tile: &Tile) -> String {
    format!(
        "bct {} {} {} {} {} {} {} {} {}\n",
        col,
        row,
        tile.get_content()[0],
        tile.get_content()[1],
        tile.get_content()[2],
        tile.get_content()[3],
        tile.get_content()[4],
        tile.get_content()[5],
        tile.get_content()[6]
    )
}

fn map_content(map: &Vec<Vec<Tile>>) -> String {
    let mut res = String::new();

    for (y, row) in map.iter().enumerate() {
        for (x, tile) in row.iter().enumerate() {
            res.push_str(&content_tile(x as u32, y as u32, tile));
        }
    }
    res
}

fn team_names(teams: HashMap<String, Vec<mio::Token>>) -> String {
    let mut res = String::new();

    for team in teams.keys() {
        res += &format!("tna {}\n", team);
    }
    res
}

pub(crate) fn new_player(team: String, player: &Client) -> String {
    let (x, y) = player.position;
    format!(
        "pnw {:?} {} {} {} {} {}\n",
        player.token.0,
        x,
        y,
        define::CARDINAL_DICT[&player.orientation],
        player.level,
        team
    )
}

pub(crate) fn player_pos(player: &Client) -> String {
    let (x, y) = player.position;
    format!(
        "ppo {:?} {} {} {}\n",
        player.token.0,
        x,
        y,
        define::CARDINAL_DICT[&player.orientation]
    )
}

fn player_level(player: &Client) -> String {
    format!("plv {:?} {}\n", player.token.0, player.level)
}

fn player_inventory(player: &Client) -> String {
    let (x, y) = player.position;
    format!(
        "pin {:?} {} {} {} {} {} {} {} {} {}\n",
        player.token.0,
        x,
        y,
        player.inventory[0],
        player.inventory[1],
        player.inventory[2],
        player.inventory[3],
        player.inventory[4],
        player.inventory[5],
        player.inventory[6]
    )
}

//Todo:: Bonus
//fn ban_hammer(player: Client) -> String {
//    #[cfg(feature = "debug")]
//    println!("get bonked\n");
//    format!("hax {:?}\n", player.token)
//}

fn leonidas(token: &Token) -> String {
    format!("pex {:?}\n", token.0)
}

pub(crate) fn player_broadcast(token: &Token, message: &str) -> String {
    format!("pbc {:?} {}\n", token.0, message)
}

pub(crate) fn start_incant(tokens: Vec<Token>, origin: Token, server: &Server) -> String {
    let mut res = String::new();
    let (x, y) = server._game.get_player_position(origin);
    res += &format!(
        "pic {} {} {}",
        x,
        y,
        server._clients.get(&origin).unwrap().level //TODO THIS JUST CRASHED // it should be fixed now
    );
    for token in tokens {
        res += &format!(" {:?}", token.0);
    }
    res += "\n";
    res
}

fn end_incant(x: u32, y: u32, success: bool) -> String {
    if success {
        format!("pie {} {} {}\n", x, y, 1)
    } else {
        format!("pie {} {} {}\n", x, y, 0)
    }
}

pub(crate) fn fork(token: &Token) -> String {
    format!("pfk {:?}\n", token.0)
}

pub(crate) fn end_fork(team: String, egg_id: u128, x: u32, y: u32) -> String {
    format!("enw {} {} {} {}\n", egg_id, team, x, y)
}

fn player_drop_item(player: &Client, item_num: usize) -> String {
    format!("pdr {:?} {}\n", player.token.0, item_num)
}

fn player_pick_item(player: &Client, item_num: usize) -> String {
    format!("pgt {:?} {}\n", player.token.0, item_num)
}

pub(crate) fn player_death(token: &Token) -> String {
    format!("pdi {:?}\n", token.0)
}

pub(crate) fn egg_hatches(token: &Token, server: &Server) -> String {
    let mut res = String::new();
    let player = server._clients.get(token).unwrap();

    if player.was_egg > 0 {
        res += &format!("eht {}\n", player.was_egg);
    }
    res += &new_player(server.get_team_for_player(&player.token), player);
    res
}

pub(crate) fn rotten_egg(egg_id: u128) -> String {
    format!("eht {}\n", egg_id)
}

fn get_time_unit(tick: u64) -> String {
    format!("sgt {}\n", tick)
}

pub(crate) fn end_game(winner: String) -> String {
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

pub(crate) fn event_graph_connect(server: &Server) -> String {
    let mut res = String::new();

    res += &map_size(server._game.map.get_width(), server._game.map.get_height());
    res += &get_time_unit(server.get_ticks());
    res += &map_content(server._game.map.get_tiles());
    res += &team_names(server._game.team.clone());
    for player in server.get_clients_by_type(define::ROLE_PLAYER) {
        res += &new_player(server.get_team_for_player(&player.token), player);
    }
    for (egg_id, (x, y, token, tick)) in &server._game.map.egg_position {
        res += &end_fork(server.get_team_for_player(token), *egg_id, *x, *y);
    }
    res
}

pub(crate) fn event_take_an_item(server: &Server, token: &Token, item_num: usize) -> String {
    let mut res = String::new();
    let player = server._clients.get(token).unwrap();

    let (x, y) = player.position;

    res += &player_pick_item(player, item_num);
    res += &player_inventory(player);
    res += &content_tile(x, y, &server._game.map.get_tiles()[y as usize][x as usize]);
    res
}

pub(crate) fn event_drop_an_item(server: &Server, token: &Token, item_num: usize) -> String {
    let mut res = String::new();
    let player = server._clients.get(token).unwrap();

    let (x, y) = player.position;

    res += &player_drop_item(player, item_num);
    res += &player_inventory(player);
    res += &content_tile(x, y, &server._game.map.get_tiles()[y as usize][x as usize]);
    res
}

pub(crate) fn event_fus_ro_dah(players: Vec<&mut Client>, token: Token) -> String {
    let mut res = String::new();

    res += &leonidas(&token);
    for player in players {
        if (player.token != token) {
            res += &player_pos(player);
        }
    }
    res
}

pub(crate) fn event_incant_end(server: &mut Server, success: bool, token: Token) -> String {
    let mut res = String::new();
    let (x, y) = server._game.get_player_position(token);
    res += &end_incant(x, y, success);
	res
    // let tile: &Tile = &server.get_map().get_tiles()[y as usize][x as usize];

    // for player_token in server._incantation_list.get(&token).unwrap() {
    //     if let Some(player) = server._clients.get(player_token) {
    //         res += &player_level(player);
    //     }
    // }
    // res += &content_tile(x, y, tile);
    // res
}

pub(crate) fn send_graphic_clients(command: String, server: &mut Server) {
    for graph_client in server.get_clients_by_type_mut(define::GRAPHICAL_CLIENT) {
        let _ = graph_client.get_socket_mut().write(command.as_bytes());
    }
}
