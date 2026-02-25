use crate::server::client;
use mio::Token;
use mio::net::TcpStream;

pub struct Client {
    socket: TcpStream,
    pub(crate) token: Token,
    pub(crate) r#type: String,
    pub(crate) inventory: [u128; 7],
    pub(crate) level: u8,
    //pub(crate) hunger: u128,
    pub(crate) position: (u32, u32),
    pub(crate) orientation: char,
    pub(crate) is_incanting: Token,
    pub(crate) was_egg: u128,
}

impl client::Client {
    pub fn new(socket: TcpStream, token: Token) -> Self {
        Client {
            socket,
            token,
            r#type: String::from("unknown"),
            inventory: [1260, 1, 0, 0, 0, 0, 0],
            level: 1,
            //hunger: 1260,
            position: (0, 0),
            orientation: ('N'),
            is_incanting: mio::Token(0),
            was_egg: 1,
        }
    }

    pub fn get_inventory(&self) -> [u128; 7] {
        //let mut tmp = self.inventory;
        //tmp[0] = self.hunger as u32;
        //tmp
        self.inventory
    }
    pub fn get_socket(&self) -> &TcpStream {
        &self.socket
    }

    pub fn get_socket_mut(&mut self) -> &mut TcpStream {
        &mut self.socket
    }

    pub fn get_token(&self) -> Token {
        self.token
    }

    pub fn hunger_tick(&mut self) {
        if self.inventory[0] > 0 {
            self.inventory[0] -= 1;
        }
    }
}
