pub struct map {
    width: u32,
    height: u32,
    tiles: Vec<Vec<u32>>,
}

impl map {
    pub fn new(width: u32, height: u32) -> Self {
        map {
            width,
            height,
            tiles: vec![vec![0; width as usize]; height as usize],
        }
    }
    pub fn set_width(&mut self, width: u32) {
        self.width = width;
        self.tiles = vec![vec![0; width as usize]; self.height as usize];
    }

    pub fn set_height(&mut self, height: u32) {
        self.height = height;
        self.tiles = vec![vec![0; self.width as usize]; height as usize];
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

    pub fn get_tiles(&self) -> &Vec<Vec<u32>> {
        &self.tiles
    }
}
