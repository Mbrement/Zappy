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
}
