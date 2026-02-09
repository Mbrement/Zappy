use crate::server;
use crate::server::map::Map;
use mio::Token;
use std::collections::HashMap;
use std::time;

pub struct Game {
    pub(crate) team: HashMap<String, Vec<Token>>,
    pub(crate) map: server::map::Map,
    pub(crate) starting_time: time::Instant,
    pub(crate) last_update: time::Instant,
    _is_running: bool,
    pub(crate) starting: bool,
    _tick: u32,
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
}
