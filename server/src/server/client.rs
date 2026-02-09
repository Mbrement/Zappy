use crate::server::client;
use mio::Token;
use mio::net::TcpStream;

pub struct Client {
    socket: TcpStream,
    token: Token,
    pub(crate) r#type: String,
    pub(crate) inventory: Vec<String>,
    pub(crate) level: u8,
    pub(crate) hunger: u32,
    pub(crate) position: (u32, u32),
    pub(crate) orientation: char,
}

impl client::Client {
    pub fn new(socket: TcpStream, token: Token) -> Self {
        Client {
            socket,
            token,
            r#type: String::from("unknown"),
            inventory: Vec::new(),
            level: 0,
            hunger: 0,
            position: (0, 0),
            orientation: ('N'),
        }
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
}
