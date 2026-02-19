use mio::Token;

use crate::server::client;
use crate::server::{Server, client::Client, define, game::Game, map::Tile};
use std::collections::HashMap;
use std::io::Write;

fn map_size(width: u32, height: u32) -> String {
    format!("msz {} {}\n", width, height)
}

fn content_tile(col: u32, row: u32, tile: &Tile) -> String {
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

fn new_player(team: String, player: &Client) -> String {
    let (x, y) = player.position;
    format!(
        "pnw {:?} {} {} {} {} {}\n",
        player.token, x, y, player.orientation, player.level, team
    )
}

fn player_pos(player: &Client) -> String {
    let (x, y) = player.position;
    format!(
        "ppo {:?} {} {} {}\n",
        player.token, x, y, player.orientation
    )
}

fn player_level(player: &Client) -> String {
    format!("plv {:?} {}\n", player.token, player.level)
}

fn player_inventory(player: &Client) -> String {
    let (x, y) = player.position;
    format!(
        "pin {:?} {} {} {} {} {} {} {} {} {}\n",
        player.token,
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
    format!("pex {:?}\n", token)
}

fn player_broadcast(player: &Client, message: String) -> String {
    format!("pbc {:?} {}", player.token, message)
}

//TODO après gestion par micka
//fn start_incant() -> String {}

fn end_incant(x: u32, y: u32, success: bool) -> String {
    if success {
        format!("pie {} {} {}\n", x, y, 1)
    } else {
        format!("pie {} {} {}\n", x, y, 0)
    }
}

fn birth_egg(player: Client) -> String {
    format!("pfk {:?}\n", player.token)
}

fn player_drop_item(player: &Client, item_num: usize) -> String {
    format!("pdr {:?} {}\n", player.token, item_num)
}

fn player_pick_item(player: &Client, item_num: usize) -> String {
    format!("pgt {:?} {}\n", player.token, item_num)
}

fn player_death(player: &Client) -> String {
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

pub fn event_graph_connect(server: &Server) -> String {
    let mut res = String::new();

    res += &map_size(server._game.map.get_width(), server._game.map.get_height());
    res += &get_time_unit(server.get_ticks());
    res += &map_content(server._game.map.get_tiles());
    res += &team_names(server._game.team.clone());
    for player in server.get_clients_by_type(define::ROLE_PLAYER) {
        res += &new_player(server.get_team_for_player(&player.token), player);
    }
    //TODO après gestion par micka
    //res += &egg_laid()
    res
}

pub fn event_take_an_item(server: &mut Server, token: &Token, item_num: usize) {
    let mut res = String::new();
    let player = server._clients.get(token).unwrap(); // fixed the unwrap

    let (x, y) = player.position;

    res += &player_pick_item(player, item_num);
    res += &player_inventory(player);
    res += &content_tile(x, y, &server._game.map.get_tiles()[y as usize][x as usize]);
    send_graphic_clients(res, server);
}

pub fn event_drop_an_item(server: &mut Server, token: &Token, item_num: usize) {
    let mut res = String::new();
    let player = server._clients.get(token).unwrap();

    let (x, y) = player.position;

    res += &player_drop_item(player, item_num);
    res += &player_inventory(player);
    res += &content_tile(x, y, &server._game.map.get_tiles()[y as usize][x as usize]);
    send_graphic_clients(res, server);
}

pub fn event_fus_ro_dah(players: Vec<&mut Client>, token: Token) -> String {
    let mut res = String::new();

    res += &leonidas(&token);
    for player in players {
        if (player.token != token) {
            res += &player_pos(player);
        }
    }
    res
    //send_graphic_clients(res, server);
}

pub fn event_incant_end(server: &mut Server, success: bool, token: Token) {
    let mut res = String::new();
    let (x, y) = server._game.get_player_position(token);
    let tile: &Tile = &server.get_map().get_tiles()[y as usize][x as usize];

    for player in server._incantation_list.get(&token).unwrap() {
        //THIS WILL CRASH IF THE TOKEN IS NOT IN THE INCANTATION LIST
        let player: &Client = server._clients.get(player).unwrap();
        res += &player_level(player);
    }
    res += &content_tile(x, y, tile);
    send_graphic_clients(res, server);
}

pub fn send_graphic_clients(command: String, server: &mut Server) {
    for graph_client in server.get_clients_by_type_mut(define::GRAPHICAL_CLIENT) {
        let _ = graph_client.get_socket_mut().write(command.as_bytes());
        graph_client
            .get_socket_mut()
            .write("pouet\n".as_bytes())
            .unwrap();
    }
}
