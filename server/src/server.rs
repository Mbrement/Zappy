use mio::net::TcpListener;
use mio::{Events, Interest, Poll, Token};
use std::collections::HashMap;
use std::io::{Read, Write};
mod client;
mod map;
use crate::server::client::Client;
use std::{process, time};
mod game;

type CommandFn = Box<dyn Fn(&mut client::Client, &str)>;

struct CommandManager {
    commands: HashMap<String, CommandFn>,
}

impl CommandManager {
    fn new() -> Self {
        Self {
            commands: HashMap::new(),
        }
    }

    // default configuration of commande for a server
    fn new_server() -> Self {
        let mut command_manager = CommandManager::new();
        command_manager.register("avance", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "avance", _arg).as_bytes());
		});
        command_manager.register("droite", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "droite", _arg).as_bytes());
        });
        command_manager.register("gauche", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "gauche", _arg).as_bytes());
        });
        command_manager.register("voir", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "voir", _arg).as_bytes());
        });
        command_manager.register("inventaire", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "inventaire", _arg).as_bytes());
        });
        command_manager.register("prend", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "prend", _arg).as_bytes());
        });
        command_manager.register("pose", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "pose", _arg).as_bytes());
        });
        command_manager.register("expluse", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "expluse", _arg).as_bytes());
        });
        command_manager.register("broadcast", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "broadcast", _arg).as_bytes());
        });
        command_manager.register("incantation", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "incantation", _arg).as_bytes());
        });
        command_manager.register("fork", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "fork", _arg).as_bytes());
        });
        command_manager.register("connect_nbr", |_c: &mut client::Client, _arg: &str| {
            let _ = _c.get_socket_mut().write(format!("command {} recived {{{}}}\n", "connect_nbr", _arg).as_bytes());
        });
        command_manager
    }

    fn register<F>(&mut self, name: &str, func: F)
    where
        F: Fn(&mut client::Client, &str) + 'static,
    {
        self.commands.insert(name.to_string(), Box::new(func));
    }
    fn execute(&self, name: &str, client: &mut client::Client, arg: &str) {
        if let Some(func) = self.commands.get(name) {
            println!("Executing command '{}' with args: {}", name, arg);
            func(client, arg);
        } else {
            println!("Commande '{}' non trouvée.", name);
        }
    }
}
pub struct Server {
    address: String,
    port: u16,
    client_token: Token,
    next_token: u32,
    poll: Poll,
    events: Events,
    clients: HashMap<Token, client::Client>,
    pub teams: HashMap<String, Vec<Token>>,
    // current_player: u32,
    max_clients: u32,
    socket: mio::net::TcpListener,
    ticks: u32,
    command_manager: CommandManager,
    game: game::Game,
}

impl Server {
    pub fn new(port: u16) -> Self {
        let tmp_socket = TcpListener::bind(format!("{}:{}", "127.0.0.1", port).parse().unwrap());
        if tmp_socket.is_err() {
            eprintln!("Failed to bind to address");
            process::exit(1);
        }
        let tmp_poll = Poll::new();
        if tmp_poll.is_err() {
            println!("Poll created unsuccessfully");
            process::exit(1);
        }
        let tmp = Server {
            address: "127.0.0.1".to_string(),
            port: port.clone(),
            client_token: Token(0),
            poll: tmp_poll.unwrap(),
            events: Events::with_capacity(128),
            // current_player: 0,
            max_clients: 10,
            clients: HashMap::new(),
            teams: HashMap::new(),
            socket: tmp_socket.unwrap(),
            ticks: 100,
            next_token: 1,
            command_manager: CommandManager::new_server(),
            game: game::Game::new(10, 10),
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

    pub fn set_map_width(&mut self, width: u32) {
        self.game.map.set_width(width);
    }

    pub fn set_map_height(&mut self, height: u32) {
        self.game.map.set_height(height);
    }

    pub fn set_ticks(&mut self, ticks: u32) {
        self.ticks = ticks;
    }

    pub fn set_clients_number(&mut self, clients: u32) {
        self.max_clients = clients;
    }

    // ________________Getters
    pub fn get_port(&self) -> u16 {
        self.port
    }

    pub fn get_height(&self) -> u32 {
        self.game.map.get_height()
    }

    pub fn get_width(&self) -> u32 {
        self.game.map.get_width()
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

    pub fn get_clients_number(&self) -> u32 {
        self.max_clients
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

    pub fn get_map(&self) -> &map::Map {
        &self.game.map
    }

    pub fn get_map_mut(&mut self) -> &mut map::Map {
        &mut self.game.map
    }

    pub fn run(&mut self) {
        let mut buf = [0; 1024];
        println!("Server is running...");

        // register listener once
        if let Err(e) =
            self.poll
                .registry()
                .register(&mut self.socket, self.client_token, Interest::READABLE)
        {
            eprintln!("Failed to register socket: {}", e);
            return;
        }

        loop {
            let check = self.poll.poll(
                &mut self.events,
                Some(time::Duration::from_millis((1000 / self.ticks).into())),
            );
            if check.is_err() {
                eprintln!("Failed to poll events");
                return;
            }
            for event in self.events.iter() {
                if event.token() == self.client_token {
                    loop {
                        match self.socket.accept() {
                            Ok((mut client_stream, _)) => {
                                let token = Token(self.next_token as usize);
                                if self.clients.contains_key(&token) {
                                    eprintln!("Client with token {:?} already exists", token);
                                    break;
                                }
                                self.next_token += 1;
                                self.clients
                                    .insert(token, Client::new(client_stream, token));
                                let tmp = self.clients.get_mut(&token);
                                if tmp.is_none() {
                                    eprintln!("Failed to get client socket");
                                    self.clients.remove(&token);
                                    break;
                                }
                                let check = self.poll.registry().register(
                                    tmp.unwrap().get_socket_mut(),
                                    token,
                                    Interest::READABLE,
                                );
                                if check.is_err() {
                                    eprintln!("Failed to register client");
                                    self.clients.remove(&token);
                                    break;
                                }
                                let response = format!("Bienvenue\n");
                                if self
                                    .clients
                                    .get_mut(&token)
                                    .unwrap()
                                    .get_socket_mut()
                                    .write(response.as_bytes())
                                    .is_err()
                                {
                                    self.clients.remove(&token);
                                    break;
                                }
								self.clients.get_mut(&token).unwrap().r#type = "welcomed".to_string();
                            }
                            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                            Err(e) => {
                                eprintln!("Error accepting connection: {}", e);
                                break;
                            }
                        }
                        break;
                    }
                } else {
                    let token = event.token();
                    if let Some(client) = self.clients.get_mut(&token) {
                        match client.get_socket_mut().read(&mut buf) {
                            Ok(0) => {
                                let _ = client.get_socket_mut().shutdown(std::net::Shutdown::Both);

                                self.clients.remove(&token);
                                println!("Client {:?} disconnected", token);
                            }
                            Ok(n) => {
                                println!("Received {} bytes from {:?} 1", n, token);
                                if client.r#type == "player"{
                                    let cmd = String::from_utf8_lossy(&buf[..n]).trim().to_string();
                                    let mut parts = cmd.splitn(2, ' ');
                                    let name = parts.next().unwrap_or("");
                                    let arg = parts.next().unwrap_or("");
                                    println!("Received command '{}' from {:?}", cmd, token);
                                    self.command_manager.execute(name, client, arg);
                                }
								else if client.r#type == "welcomed" {
									let cmd = String::from_utf8_lossy(&buf[..n]).trim().to_string();
									if self.teams.contains_key(&cmd) && self.teams[&cmd].len() < self.max_clients as usize {
										self.teams.get_mut(&cmd).unwrap().push(token);
										client.r#type = "player".to_string();
										let response = format!("{}", self.max_clients as usize - self.teams[&cmd].len());
										if client.get_socket_mut().write(response.as_bytes()).is_err() {
											self.clients.remove(&token);
										}
									}
								else {
									let response = format!("WHO THE FUCK ARE YOU {}\n",  client.r#type);
									if client.get_socket_mut().write(response.as_bytes()).is_err() {
										self.clients.remove(&token);
									}
								}
								}
                            }
                            Err(_) => {
                                let _ = client.get_socket_mut().shutdown(std::net::Shutdown::Both);
                                self.clients.remove(&token);
                                println!("Client {:?} disconnected (error)", token);
                            }
                        }
                    }
                }
            }
            if time::Instant::now()
                .duration_since(self.game.last_update)
                .as_millis()
                >= (1000 / self.ticks) as u128
            {
                // println!("Game has been running for {} second", (time::Instant::now().duration_since(self.game.starting_time).as_millis()));
                self.game.last_update = time::Instant::now();
            }
        }
    }
}
