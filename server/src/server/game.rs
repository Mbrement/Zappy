use crate::server;
use crate::server::map::Map;
use mio::Token;
use std::collections::HashMap;
use std::time;

pub struct Game {
    pub team: HashMap<String, Vec<Token>>,
    pub map: server::map::Map,
    pub starting_time: time::Instant,
    pub last_update: time::Instant,
}

impl Game {
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            team: HashMap::new(),
            map: Map::new(width, height),
            starting_time: time::Instant::now(),
            last_update: time::Instant::now(),
        }
    }
}
