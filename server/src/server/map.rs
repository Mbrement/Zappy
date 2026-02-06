pub struct Map {
    width: u32,
    height: u32,
    tiles: Vec<Vec<Tile>>,
}

#[derive(Clone)]
pub struct Tile {
    strings: Vec<String>,
}

impl Tile {
    pub fn new() -> Self {
        Tile {
            strings: Vec::new(),
        }
    }
}

impl Map {
    pub fn new(width: u32, height: u32) -> Self {
        Map {
            width,
            height,
            tiles: vec![vec![Tile::new(); width as usize]; height as usize],
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

    pub fn resize(&mut self, width: u32, height: u32) {
        self.set_width(width);
        self.set_height(height);
        //TODO DO IT resize existe for the vec, check them tho
    }

    pub fn get_width(&self) -> u32 {
        self.width
    }

    pub fn get_height(&self) -> u32 {
        self.height
    }
    pub fn get_tiles(&self) -> &Vec<Vec<Tile>> {
        &self.tiles
    }
    pub fn fill_start(&mut self) {
        for row in &mut self.tiles {
            for tile in row {}
        }
    }
}

pub fn fill_case(tile: &mut Tile) {
    tile.strings.push("Case".into());
}
