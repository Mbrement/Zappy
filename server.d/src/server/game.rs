use crate::server::client::{self, Client};
use crate::server::map::Map;
use crate::server::{self, Server, define};
use mio::Token;
use std::collections::HashMap;
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

    pub fn routine(&mut self) -> String {
        let mut res = String::new();
        if self._is_running {
            self._tick += 1;
            match self._tick % 100 {
                0 => {
                    res += &self.map.partial_fill(0);
                }
                25 => {
                    res += &self.map.partial_fill(1);
                }
                50 => {
                    res += &self.map.partial_fill(2);
                }
                75 => {
                    res += &self.map.partial_fill(3);
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
        res
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
                'S' => 'O',
                'O' => 'N',
                _ => orientation,
            };
        } else if rotation == "gauche" {
            player.orientation = match orientation {
                'N' => 'O',
                'E' => 'N',
                'S' => 'E',
                'O' => 'S',
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
                        .move_player(&player.get_token(), (position.0, self.map.get_height() - 1));
                }
            }
            'E' => {
                if self.map.get_width() - 1 > position.0 {
                    self.map
                        .move_player(&player.get_token(), (position.0 + 1, position.1));
                } else {
                    self.map.move_player(&player.get_token(), (0, position.1));
                }
            }
            'S' => {
                if self.map.get_height() - 1 > position.1 {
                    self.map
                        .move_player(&player.get_token(), (position.0, position.1 + 1));
                } else {
                    self.map.move_player(&player.get_token(), (position.0, 0));
                }
            }
            'O' => {
                if position.0 > 0 {
                    self.map
                        .move_player(&player.get_token(), (position.0 - 1, position.1));
                } else {
                    self.map
                        .move_player(&player.get_token(), (self.map.get_width() - 1, position.1));
                }
            }
            _ => {}
        }
    }
    
    pub fn put_item_on_cell(&mut self, client: &mut Client, item: &str) -> bool {
        let idx: usize = match item {
            define::FOOD => define::FOOD_INV,
            define::T1_MAT => define::T1_MAT_INV,
            define::T2_MAT => define::T2_MAT_INV,
            define::T3_MAT => define::T3_MAT_INV,
            define::T4_MAT => define::T4_MAT_INV,
            define::T5_MAT => define::T5_MAT_INV,
            define::T6_MAT => define::T6_MAT_INV,
            _ => return false, // If the item is not recognized, we disallow putting it on the cell
        };

        if client.inventory[idx] == 0 {
            return false; // The client doesn't have the item in their inventory
        }
        let (x, y) = client.position;
        self.map.get_tiles_mut()[y as usize][x as usize].inc_tile_item(idx);
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
            'O' => define::SEE_TAB_W,
            _ => [(0, 0); 81],
        };

        let mut max_index = (level + 1).pow(2) as usize;
        let mut max_index_initial = max_index;
        for (dx, dy) in directions {
            let cell_x = (position.0 as i32 + dx).rem_euclid(self.map.get_width() as i32) as u32;
            let cell_y = (position.1 as i32 + dy).rem_euclid(self.map.get_height() as i32) as u32;
            if let Some(cell) = self.map.get_tile_content(cell_x, cell_y) {
                visible_cells.push(cell.iter().cloned().collect::<Vec<String>>().join(" "));
                for _i in self
                    .map
                    .player_position
                    .iter()
                    .filter(|(_, pos)| **pos == (cell_x, cell_y))
                    .map(|(token, _)| *token)
                    .collect::<Vec<Token>>()
                {
                    if max_index == max_index_initial {
                        max_index_initial += 1;
                    } else {
                        visible_cells
                            .last_mut()
                            .unwrap()
                            .push_str(&format!(" player"));
                    }
                }
                max_index -= 1;
                if max_index == 0 {
                    break;
                }
            }
        }
        visible_cells
    }

    pub(crate) fn check_inventory(&self, player_token: &Token, server: &Server) -> bool {
        let player = server._clients.get(player_token).unwrap();
        let required_items = if player.level != 8 {
            define::INCANTATION_REQ[(player.level - 1) as usize]
        } else {
            return false;
        };
        for i in 1..7 {
            if player.inventory[i] < required_items[i] {
                return false;
            }
        }
        true
    }

    pub fn take_item_from_cell(&mut self, client: &mut Client, item: &str) -> bool {
        let position = self.get_player_position(client.get_token());
        if self.map.remove_item_from_cell(position.0, position.1, item) {

            let mut inc: u128 = 1;
            if item == define::FOOD {
                inc = define::FOOD_VALUE;
            }
            client.inventory[define::ITEMS_DICT[item]] += inc;
            return true;
        }
        false
    }
}
