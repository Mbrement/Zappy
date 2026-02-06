use crate::server;
use crate::server::map::map;
use mio::Token;
use std::collections::HashMap;
use std::time;

pub struct Game {
    pub team: HashMap<String, Vec<Token>>,
    pub map: server::map::map,
    pub starting_time: time::Instant,
    pub last_update: time::Instant,
}

impl Game {
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            team: HashMap::new(),
            map: map::new(width, height),
            starting_time: time::Instant::now(),
            last_update: time::Instant::now(),
        }
    }
}
