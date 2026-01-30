use mio::net::TcpListener;
use mio::{Events, Interest, Poll, Token};
use std::io::{Read, Write};
use std::collections::HashMap;
mod client;
mod map;
use std::process;

use crate::server;



pub struct Server {
	address: String,
    port: u16,
    client_token: Token,
    poll: Poll,
    events: Events,
    map: map::map,
    clients: HashMap<Token, client::Client>,
    socket: mio::net::TcpListener,
    ticks: u32,
}

impl Server {
	pub fn new(port: u16) -> Self {
		let tmp_socket = TcpListener::bind(format!("{}:{}", "127.0.0.1", port).parse().unwrap());
        if tmp_socket.is_err() {
            eprintln!("Failed to bind to address");
            process::exit(1);
        }
        let tmp = Server {
            address: "127.0.0.1".to_string(),
            port: port.clone(),
            client_token: Token(0),
            poll: Poll::new().unwrap(),
            events: Events::with_capacity(128),
            map: map::map::new(10, 10),
            clients: HashMap::new(),
            socket: tmp_socket.unwrap(),
            ticks: 100,
        };
        tmp
    }

    // ________________Setters
    pub fn set_address(&mut self, addr: String) {
        self.address = format!("{}", addr);
        let tmp_socket =
            TcpListener::bind(format!("{}:{}", "127.0.0.1", self.port).parse().unwrap());
        if tmp_socket.is_err() {
            eprintln!("Failed to bind to address");
            process::exit(1);
        }
        println!("Server address changed to: {}", self.address);
        self.socket = tmp_socket.unwrap();
    }

    pub fn set_port(&mut self, port: u16) {
        self.port = port;
        let tmp_socket =
            TcpListener::bind(format!("{}:{}", self.address, self.port).parse().unwrap());
        if tmp_socket.is_err() {
            eprintln!("Failed to bind to address");
            process::exit(1);
        }
        println!("Server port changed to: {}", self.port);
        self.socket = tmp_socket.unwrap();
    }

    // ________________Getters
    pub fn get_port(&self) -> u16 {
        self.port
    }

    pub fn get_address(&self) -> String {
        self.address.clone()
    }
	
	pub fn get_events(&self) -> &Events {
		&self.events
	}

	pub fn get_events_mut(&mut self) -> &mut Events {
		&mut self.events
	}

    pub fn get_poll(&self) -> &Poll {
        &self.poll
    }

	pub fn get_poll_mut(&mut self) -> &mut Poll {
        &mut self.poll
    }

    pub fn get_clients(&self) -> &HashMap<Token, client::Client> {
        &self.clients
    }

    pub fn get_ticks(&self) -> u32 {
        self.ticks
    }

	pub fn get_socket(&self) -> &mio::net::TcpListener {
        &self.socket
    }

    pub fn get_socket_mut(&mut self) -> &mut mio::net::TcpListener {
        &mut self.socket
    }

    pub fn get_map(&self) -> &map::map {
        &self.map
    }

	pub fn get_map_mut(&mut self) -> &mut map::map {
        &mut self.map
    }


	pub fn run(&mut self) {
		let mut buf = [0; 1024];
		println!("Server is running...");
		loop {
			self.poll.poll(&mut self.events, None);
			for event in self.events.iter() {
				match event.token() {
					SERVER	 => loop {
						match self.socket.accept() {
							Ok((mut client, _)) => {
								let response = format!("Bienvenue\n");
								if client.write(response.as_bytes()).is_err() {
									break;
								}
								let _ = client.read(&mut buf);
								println!(
									"Received data from {:?}: {:?}",
									client.peer_addr(),
									String::from_utf8_lossy(&buf)
								);
							}
							Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
							Err(e) => {
								eprintln!("Error accepting connection: {}", e);
								break;
							}
						}
					}
				}
			}
		}	
	}
}
