use crate::server::client::{self, Client};
use crate::server::command_manager::CommandManager;
use crate::server::map::Map;
use crate::server::{self, Server, define};
use mio::Token;
use rand::RngExt;
use std::collections::HashMap;
use std::io::Write;
use std::time;

pub struct Game {
    pub(crate) team: HashMap<String, Vec<mio::Token>>,
    pub(crate) map: server::map::Map,
    pub(crate) starting_time: time::Instant,
    pub(crate) last_update: time::Instant,
    _is_running: bool,
    pub(crate) starting: bool,
    pub(crate) _tick: u128,
}

impl Game {
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            team: HashMap::new(),
            map: Map::new(width, height),
            starting_time: time::Instant::now(),
            last_update: time::Instant::now(),
            _is_running: false,
            starting: false,
            _tick: 0,
        }
    }

    pub fn routine(&mut self) {
        if self._is_running {
            self._tick += 1;
            match self._tick % 100 {
                0 => {
                    self.map.partial_fill(0);
                }
                25 => {
                    self.map.partial_fill(1);
                }
                50 => {
                    self.map.partial_fill(2);
                }
                75 => {
                    self.map.partial_fill(3);
                }
                _ => (),
            }
        } else if self.starting == true {
            // Game starting logic goes here
            self.map.fill_start();
            self.starting = true;
            self._is_running = true;
            #[cfg(feature = "log")]
            self.map.print_map();
        }
    }

    pub fn get_player_position(&self, token: Token) -> (u32, u32) {
        let r = self.map.player_position.get(&token).cloned();
        if r.is_none() {
            eprintln!("Player position not found for token: {:?}", token);
            (0, 0)
        } else {
            r.unwrap()
        }
    }
    pub fn update_player_position(&mut self, token: Token, position: (u32, u32)) {
        self.map.player_position.insert(token, position);
    }

    pub(crate) fn change_player_orientation(
        &mut self,
        player: &mut client::Client,
        rotation: String,
    ) {
        let orientation = player.orientation.clone();
        if rotation == "droite" {
            player.orientation = match orientation {
                'N' => 'E',
                'E' => 'S',
                'S' => 'W',
                'W' => 'N',
                _ => orientation,
            };
        } else if rotation == "gauche" {
            player.orientation = match orientation {
                'N' => 'W',
                'E' => 'N',
                'S' => 'E',
                'W' => 'S',
                _ => orientation,
            };
        }
    }

    pub(crate) fn move_player(&mut self, player: &mut client::Client) {
        let position = self.get_player_position(player.get_token());
        // Move the player on the map
        match player.orientation {
            'N' => {
                if position.1 > 0 {
                    self.map
                        .move_player(&player.get_token(), (position.0, position.1 - 1));
                } else {
                    self.map
                        .move_player(&player.get_token(), (position.0, self.map.get_height()));
                }
            }
            'E' => {
                if self.map.get_width() > position.0 {
                    self.map
                        .move_player(&player.get_token(), (position.0 + 1, position.1));
                } else {
                    self.map.move_player(&player.get_token(), (0, position.1));
                }
            }
            'S' => {
                if self.map.get_height() > position.1 {
                    self.map
                        .move_player(&player.get_token(), (position.0, position.1 + 1));
                } else {
                    self.map.move_player(&player.get_token(), (position.0, 0));
                }
            }
            'W' => {
                if position.0 > 0 {
                    self.map
                        .move_player(&player.get_token(), (position.0 - 1, position.1));
                } else {
                    self.map
                        .move_player(&player.get_token(), (self.map.get_width(), position.1));
                }
            }
            _ => {}
        }
    }

    pub fn spawn_player(&mut self, token: Token, team: &str) -> (u32, u32) {
        let x = self.map.rng.random_range((0..self.map.get_width()));
        let y = self.map.rng.random_range((0..self.map.get_height()));
        self.map.player_position.insert(token, (x, y));
        (x, y)
    }

    pub fn put_item_on_cell(&mut self, client: &mut Client, item: &str) -> bool {
        let idx: Option<usize> = match item {
            define::FOOD => Some(0),
            define::T1_MAT => Some(1),
            define::T2_MAT => Some(2),
            define::T3_MAT => Some(3),
            define::T4_MAT => Some(4),
            define::T5_MAT => Some(5),
            define::T6_MAT => Some(6),
            _ => None, // If the item is not recognized, we disallow putting it on the cell
        };
        let idx = match idx {
            Some(i) => i,
            None => return false,
        };
        if client.inventory[idx] == 0 {
            return false; // The client doesn't have the item in their inventory
        }
        let (x, y) = client.position;
        //TODO:: a tester car je crois que ta maniere ne fonctionne pas
        //self.map.get_tiles_mut()[y as usize][x as usize].inc_tile_item(idx);
        self.map.get_tile_content_mut(x, y).push(item.to_string());
        client.inventory[idx] = client.inventory[idx].saturating_sub(1);
        true
    }

    pub fn get_visible_cells(
        &self,
        position: (u32, u32),
        orientation: char,
        level: u8,
    ) -> Vec<String> {
        let mut visible_cells = Vec::new();
        let directions = match orientation {
            'N' => define::SEE_TAB_N,
            'E' => define::SEE_TAB_E,
            'S' => define::SEE_TAB_S,
            'W' => define::SEE_TAB_W,
            _ => [(0, 0); 81],
        };

        let mut max_index = (level + 1).pow(2) as usize;
        for (dx, dy) in directions {
            let cell_x = (position.0 as i32 + dx).rem_euclid(self.map.get_width() as i32) as u32;
            let cell_y = (position.1 as i32 + dy).rem_euclid(self.map.get_height() as i32) as u32;
            if let Some(cell) = self.map.get_tile_content(cell_x, cell_y) {
                visible_cells.push(cell.iter().cloned().collect::<Vec<String>>().join(" "));
                max_index -= 1;
                if max_index == 0 {
                    break;
                }
            }
        }
        visible_cells
    }

    pub fn fork_player(&mut self, token: Token) {
        println!("Player {:?} is trying to fork", token); // if let Some(client) = self._clients.get(&token) { if client.r#type == define::ROLE_PLAYER { let team_name = self.get_team_for_player(&token); let new_token = Token(self._next_token as usize); self._next_token += 1; self._clients.insert(new_token, Client::new(client.get_socket().try_clone().unwrap(), new_token)); self.teams.get_mut(&team_name).unwrap().push(new_token); self._game.spawn_player(new_token, &team_name); println!("Player {:?} forked successfully as {:?}", token, new_token); } else { println!("Client {:?} is not a player and cannot fork", token); } } else { println!("Client {:?} not found for forking", token); }
	}
    pub(crate) fn check_inventory(&self, player_token: &Token, server: &Server) -> bool {
        let player = server._clients.get(player_token).unwrap();
        let required_items = define::INCANTATION_REQ[(player.level - 1) as usize];
        for i in 1..7 {
            if player.inventory[i] < required_items[i] {
                return false;
            }
        }
        true
    }

    pub(crate) fn can_incantation(&self, player_token: &Token, server: Server) -> Vec<Token> {
        // for player in &server._game.map.player_position{
        // 	if player == (player_token, &self.get_player_position(*player_token)) {
        // 		return true;
        // 	}
        // }
        let (x, y) = server._game.map.player_position[player_token];
        let player_incanting: Vec<Token> = server
            ._game
            .map
            .player_position
            .iter()
            .filter(|(token, pos)| *pos == &(x, y) && *token != player_token)
            .map(|(token, _)| *token)
            .collect();
        player_incanting
        // if player_incanting.len() != define::INCANTATION_REQ[(server._clients[player_token].level - 1) as usize][0] as usize &&
        //     self.check_inventory(player_token, &*server) {
        //     {

        //         return true;
        //     }
        // }
        // false
    }

    pub fn take_item_from_cell(&mut self, client: &mut Client, item: &str) -> bool {
        let position = self.get_player_position(client.get_token());
        if self.map.remove_item_from_cell(position.0, position.1, item) {
            match item {
                define::FOOD => client.set_hunger(client.hunger + define::FOOD_VALUE), // Assuming 126 is the hunger value for food
                define::T1_MAT => client.inventory[define::T1_MAT_INV] += 1,
                define::T2_MAT => client.inventory[define::T2_MAT_INV] += 1,
                define::T3_MAT => client.inventory[define::T3_MAT_INV] += 1,
                define::T4_MAT => client.inventory[define::T4_MAT_INV] += 1,
                define::T5_MAT => client.inventory[define::T5_MAT_INV] += 1,
                define::T6_MAT => client.inventory[define::T6_MAT_INV] += 1,
                _ => (),
            }
            return true;
        }
        return false;
    }
}
