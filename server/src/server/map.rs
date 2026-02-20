use crate::server::define::*;
use getopts::Options;
use mio::Token;
use rand::{rngs::SmallRng, *};
use std::collections::HashMap;
pub struct Map {
    pub(crate) rng: SmallRng,
    width: u32,
    height: u32,
    tiles: Vec<Vec<Tile>>,
    pub(crate) egg_position: HashMap<u128, (u32, u32, Token)>,
    pub(crate) player_position: HashMap<Token, (u32, u32)>,
}

#[derive(Clone)]
pub struct Tile {
    // strings: Vec<String>,
    string_tab: [u32; 7],
}

impl Tile {
    pub fn new() -> Self {
        Tile {
            // strings: Vec::new(),
            string_tab: [0; 7],
        }
    }
    pub fn get_content(&self) -> [u32; 7] {
        self.string_tab
    }
    pub fn inc_tile_item(&mut self, item_num: usize) {
        self.string_tab[item_num] += 1;
    }
}

impl Map {
    pub fn new(width: u32, height: u32) -> Self {
        let rng = make_rng();
        Map {
            rng,
            width,
            height,
            tiles: vec![vec![Tile::new(); width as usize]; height as usize],
            player_position: HashMap::new(),
            egg_position: HashMap::new(),
        }
    }
    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        self.tiles = vec![vec![Tile::new(); width as usize]; self.height as usize];
    }

    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        self.tiles = vec![vec![Tile::new(); self.width as usize]; height as usize];
    }

    // pub fn resize(&mut self, width: u32, height: u32) {
    //     self.set_width(width);
    //     self.set_height(height);
    //     //TODO DO IT resize existe for the vec, check them tho
    // }

    pub fn get_width(&self) -> u32 {
        self.width
    }

    pub fn get_height(&self) -> u32 {
        self.height
    }
    pub fn get_tiles(&self) -> &Vec<Vec<Tile>> {
        &self.tiles
    }
    pub fn get_tiles_mut(&mut self) -> &mut Vec<Vec<Tile>> {
        &mut self.tiles
    }
    pub fn fill_case(tile: &mut Tile, first_rng: i32) {
        match first_rng {
            // 0..=100 => tile.strings.push(FOOD.into()),
            // 100..=130 => tile.strings.push(T1_MAT.into()), //8 tot
            // 131..=170 => tile.strings.push(T2_MAT.into()), //8 tot
            // 171..=200 => tile.strings.push(T3_MAT.into()), //10 tot
            // 201..=220 => tile.strings.push(T4_MAT.into()), //5
            // 221..=240 => tile.strings.push(T5_MAT.into()), //6
            // 298..=300 => tile.strings.push(T6_MAT.into()), //1 tot
            0..=100 => tile.string_tab[FOOD_INV] += 1,
            100..=130 => tile.string_tab[T1_MAT_INV] += 1, //8 tot
            131..=170 => tile.string_tab[T2_MAT_INV] += 1, //8 tot
            171..=200 => tile.string_tab[T3_MAT_INV] += 1, //10 tot
            201..=220 => tile.string_tab[T4_MAT_INV] += 1, //5
            221..=240 => tile.string_tab[T5_MAT_INV] += 1, //6
            298..=300 => tile.string_tab[T6_MAT_INV] += 1, //1 tot
            _ => (),
        }
    }

    pub fn get_tile_content(&self, x: u32, y: u32) -> Option<Vec<String>> {
        if x < self.width && y < self.height {
            let mut rtn: Vec<String> = Vec::new();
            for i in 0..7 {
                let count = self.tiles[y as usize][x as usize].string_tab[i];
                for _ in 0..count {
                    let name = match i {
                        FOOD_INV => FOOD,
                        T1_MAT_INV => T1_MAT,
                        T2_MAT_INV => T2_MAT,
                        T3_MAT_INV => T3_MAT,
                        T4_MAT_INV => T4_MAT,
                        T5_MAT_INV => T5_MAT,
                        T6_MAT_INV => T6_MAT,
                        _ => continue,
                    };
                    rtn.push(name.to_string());
                }
            }
            Some(rtn)
        } else {
            None
        }
    }
    pub fn get_tile_content_mut(&mut self, x: u32, y: u32) -> Vec<String> {
        if x < self.width && y < self.height {
            let mut rtn: Vec<String> = Vec::new();
            for i in 0..7 {
                let count = self.tiles[y as usize][x as usize].string_tab[i];
                for _ in 0..count {
                    let name = match i {
                        FOOD_INV => FOOD,
                        T1_MAT_INV => T1_MAT,
                        T2_MAT_INV => T2_MAT,
                        T3_MAT_INV => T3_MAT,
                        T4_MAT_INV => T4_MAT,
                        T5_MAT_INV => T5_MAT,
                        T6_MAT_INV => T6_MAT,
                        _ => continue,
                    };
                    rtn.push(name.to_string());
                }
            }
            rtn
        } else {
            Vec::new()
        }
    }

    pub fn remove_item_from_cell(&mut self, x: u32, y: u32, item: &str) -> bool {
        if x >= self.width || y >= self.height {
            return false;
        }
        let idx = match item {
            FOOD => FOOD_INV,
            T1_MAT => T1_MAT_INV,
            T2_MAT => T2_MAT_INV,
            T3_MAT => T3_MAT_INV,
            T4_MAT => T4_MAT_INV,
            T5_MAT => T5_MAT_INV,
            T6_MAT => T6_MAT_INV,
            _ => return false,
        };
        let count = &mut self.tiles[y as usize][x as usize].string_tab[idx];
        if *count > 0 {
            *count -= 1;
            true
        } else {
            false
        }
    }

    pub fn fill_start(&mut self) {
        for row in &mut self.tiles {
            for tile in row {
                let rng: i32 = self.rng.random_range(0..=300);
                Self::fill_case(tile, rng);
            }
        }
    }
    pub fn partial_fill(&mut self, ticks: u8) {
        //TODO : optimize this with iterator on the 2nd loop
        let mut row_nb: u8 = 0;
        let mut tile_nb: u8 = 0;
        for row in &mut self.tiles {
            tile_nb = 0;
            for tile in row {
                if (tile_nb + row_nb) % 4 == ticks {
                    let rng: i32 = self.rng.random_range(0..=300);
                    Self::fill_case(tile, rng);
                }
                tile_nb += 1;
            }
            row_nb += 1;
        }
        #[cfg(feature = "debug")]
        self.print_map();
    }

    pub fn print_map(&self) {
        for row in &self.tiles {
            for tile in row {
                print!("{:?} ,", tile.string_tab);
            }
            println!();
        }
        println!();
    }

    pub fn move_player(&mut self, player: &mio::Token, new_position: (u32, u32)) {
        if let Some(pos) = self.player_position.get_mut(player) {
            *pos = new_position;
        }
    }
}
