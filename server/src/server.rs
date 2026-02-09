use mio::net::{TcpListener};
use mio::{Events, Interest, Poll, Token};
use std::collections::HashMap;
use std::io::{Read, Write};
mod client;
pub mod define;
mod map;
use crate::server::client::Client;
use std::{process, time};
mod game;
use rand::{rngs::SmallRng, *};

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
        #[cfg(feature = "log")]
        command_manager.register("position", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
			let _ = _c.get_socket().write(
                format!(
                    "command {} recived {{{}}}\n{} {}",
                    "position", _arg, _c.position.0, _c.position.1
                )
                .as_bytes(),
            );
            println!(
                "command {} recived {{{}}} {:?}",
                "position",
                _arg,
                _c.get_token()
            );
        });
        #[cfg(feature = "debug")]
        command_manager.register("death", |_c: &mut client::Client, _arg: &str| {
            let cl = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "death", _arg).as_bytes());
            println!(
                "command {} recived {{{}}} {:?}",
                "death",
                _arg,
                _c.get_token()
            );
			_c.get_socket().shutdown(std::net::Shutdown::Both);
        });
        command_manager.register("droite", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "droite", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "droite",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("gauche", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "gauche", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "gauche",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("voir", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "voir", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "voir",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("inventaire", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "inventaire", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "inventaire",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("prend", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "prend", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "prend",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("pose", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "pose", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "pose",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("expluse", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "expluse", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "expluse",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("broadcast", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "broadcast", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "broadcast",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("incantation", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "incantation", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "incantation",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("fork", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "fork", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "fork",
                _arg,
                _c.get_token()
            );
        });
        command_manager.register("connect_nbr", |_c: &mut client::Client, _arg: &str| {
            #[cfg(feature = "debug")]
            let _ = _c
                .get_socket_mut()
                .write(format!("command {} recived {{{}}}\n", "connect_nbr", _arg).as_bytes());
            #[cfg(feature = "log")]
            println!(
                "command {} recived {{{}}} {:?}",
                "connect_nbr",
                _arg,
                _c.get_token()
            );
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
            #[cfg(feature = "log")]
            println!("Executing command '{}' with args: {}", name, arg);
            func(client, arg);
        } else {
            #[cfg(feature = "log")]
            println!("Commande '{}' non trouvée.", name);
        }
    }
}
pub struct Server {
    _address: String,
    _port: u16,
    _client_token: Token,
    _next_token: u32,
    _poll: Poll,
    _events: Events,
    _clients: HashMap<Token, client::Client>,
    pub teams: HashMap<String, Vec<Token>>,
    _max_clients: u32,
    _socket: mio::net::TcpListener,
    _ticks: u32,
    _command_manager: CommandManager,
    _game: game::Game,
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
            eprintln!("Poll created unsuccessfully");
            process::exit(1);
        }
        let tmp = Server {
            _address: "127.0.0.1".to_string(),
            _port: port.clone(),
            _client_token: Token(0),
            _poll: tmp_poll.unwrap(),
            _events: Events::with_capacity(1024),
            _max_clients: 10,
            _clients: HashMap::new(),
            teams: HashMap::new(),
            _socket: tmp_socket.unwrap(),
            _ticks: 100,
            _next_token: 1,
            _command_manager: CommandManager::new_server(),
            _game: game::Game::new(10, 10),
        };
        tmp
    }

    // ________________Setters
    pub fn set_address(&mut self, addr: String) {
        self._address = format!("{}", addr);
        let tmp_socket =
            TcpListener::bind(format!("{}:{}", "127.0.0.1", self._port).parse().unwrap());
        if tmp_socket.is_err() {
            eprintln!("Failed to bind to address");
            process::exit(1);
        }
        // #[cfg(feature = "log")]
        println!("Server address changed to: {}", self._address);
        self._socket = tmp_socket.unwrap();
    }

    pub fn set_port(&mut self, port: u16) {
        self._port = port;
        let tmp_socket =
            TcpListener::bind(format!("{}:{}", self._address, self._port).parse().unwrap());
        if tmp_socket.is_err() {
            eprintln!("Failed to bind to address");
            process::exit(1);
        }
        // #[cfg(feature = "log")]
        println!("Server port changed to: {}", self._port);
        self._socket = tmp_socket.unwrap();
    }

    pub fn set_map_width(&mut self, width: u32) {
        self._game.map.set_width(width);
    }

    pub fn set_map_height(&mut self, height: u32) {
        self._game.map.set_height(height);
    }

    pub fn set_ticks(&mut self, ticks: u32) {
        self._ticks = ticks;
    }

    pub fn set_clients_number(&mut self, clients: u32) {
        self._max_clients = clients;
    }

    // ________________Getters
    pub fn get_port(&self) -> u16 {
        self._port
    }

    pub fn get_height(&self) -> u32 {
        self._game.map.get_height()
    }

    pub fn get_width(&self) -> u32 {
        self._game.map.get_width()
    }

    pub fn get_address(&self) -> String {
        self._address.clone()
    }

    pub fn get_events(&self) -> &Events {
        &self._events
    }

    pub fn get_events_mut(&mut self) -> &mut Events {
        &mut self._events
    }

    pub fn get_poll(&self) -> &Poll {
        &self._poll
    }

    pub fn get_poll_mut(&mut self) -> &mut Poll {
        &mut self._poll
    }

    pub fn get_clients(&self) -> &HashMap<Token, client::Client> {
        &self._clients
    }

    pub fn get_clients_number(&self) -> u32 {
        self._max_clients
    }

    pub fn get_ticks(&self) -> u32 {
        self._ticks
    }

    pub fn get_socket(&self) -> &mio::net::TcpListener {
        &self._socket
    }

    pub fn get_socket_mut(&mut self) -> &mut mio::net::TcpListener {
        &mut self._socket
    }

    pub fn get_map(&self) -> &map::Map {
        &self._game.map
    }

    pub fn get_map_mut(&mut self) -> &mut map::Map {
        &mut self._game.map
    }

    pub fn run(&mut self) {
        let mut buf = [0; 1024];
        // #[cfg(feature = "log")]
        println!("Server is running...");

        // register listener once
        if let Err(e) = self._poll.registry().register(
            &mut self._socket,
            self._client_token,
            Interest::READABLE,
        ) {
            eprintln!("Failed to register socket: {}", e);
            return;
        }

        loop {
            let check = self._poll.poll(
                &mut self._events,
                Some(time::Duration::from_millis((1000 / self._ticks).into())),
            );
            if check.is_err() {
                eprintln!("Failed to poll events");
                return;
            }
            for event in self._events.iter() {
                if event.token() == self._client_token {
                    loop {
                        match self._socket.accept() {
                            Ok((mut client_stream, _)) => {
                                let token = Token(self._next_token as usize);
                                if self._clients.contains_key(&token) {
                                    eprintln!("Client with token {:?} already exists", token);
                                    break;
                                }
                                self._next_token += 1;
                                self._clients
                                    .insert(token, Client::new(client_stream, token));
                                let tmp = self._clients.get_mut(&token);
                                if tmp.is_none() {
                                    eprintln!("Failed to get client socket");
                                    self._clients.remove(&token);
                                    break;
                                }
                                let check = self._poll.registry().register(
                                    tmp.unwrap().get_socket_mut(),
                                    token,
                                    Interest::READABLE,
                                );
                                if check.is_err() {
                                    eprintln!("Failed to register client");
                                    self._clients.remove(&token);
                                    break;
                                }
                                let response = format!("Bienvenue\n");
                                if self
                                    ._clients
                                    .get_mut(&token)
                                    .unwrap()
                                    .get_socket_mut()
                                    .write(response.as_bytes())
                                    .is_err()
                                {
                                    self._clients.remove(&token);
                                    break;
                                }
                                self._clients.get_mut(&token).unwrap().r#type =
                                    "welcomed".to_string();
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
                    if let Some(client) = self._clients.get_mut(&token) {
                        match client.get_socket_mut().read(&mut buf) {
                            Ok(0) => {
                                let _ = client.get_socket_mut().shutdown(std::net::Shutdown::Both);

                                self._clients.remove(&token);
                                #[cfg(feature = "log")]
                                println!("Client {:?} disconnected", token);
                            }
                            Ok(n) => {
                                #[cfg(feature = "debug")]
                                println!("Received {} bytes from {:?} 1", n, token);
                                if client.r#type == define::ROLE_PLAYER {
                                    let cmd = String::from_utf8_lossy(&buf[..n]).trim().to_string();
                                    let mut parts = cmd.splitn(2, ' ');
                                    let name = parts.next().unwrap_or("");
                                    let arg = parts.next().unwrap_or("");
                                    #[cfg(feature = "debug")]
                                    println!("Received command '{}' from {:?}", cmd, token);
                                    self._command_manager.execute(name, client, arg);
                                } else if client.r#type == define::ROLE_WELCOMED {
                                    let cmd = String::from_utf8_lossy(&buf[..n]).trim().to_string();
                                    if cmd == define::GRAPHICAL_CLIENT {
                                        client.r#type = define::GRAPHICAL_CLIENT.to_string();
                                        //TODO : Mrozniec : start the routine for comunicate with graphical interface
                                        if client
                                            .get_socket_mut()
                                            .write(
                                                format!("{} connected", define::GRAPHICAL_CLIENT)
                                                    .as_bytes(),
                                            )
                                            .is_err()
                                        {
                                            self._clients.remove(&token);
                                        }
                                    } else if self.teams.contains_key(&cmd)
                                        && self.teams[&cmd].len() < self._max_clients as usize
                                    {
                                        self.teams.get_mut(&cmd).unwrap().push(token);
                                        client.r#type = define::ROLE_PLAYER.to_string();
                                        client.position = (
                                            self._game
                                                .map
                                                .rng
                                                .random_range(0..self._game.map.get_width()),
                                            self._game
                                                .map
                                                .rng
                                                .random_range(0..self._game.map.get_height()),
                                        );
                                        self._game.update_player_position(token, client.position);
										client.orientation = "NESW".chars().nth(self._game.map.rng.random_range(0..3)).unwrap();
                                        println!("{}", client.orientation);
										let response = format!(
                                            "{}\n{} {}",
                                            self._max_clients as usize - self.teams[&cmd].len(),
                                            self._game.get_player_position(token).0,
                                            self._game.get_player_position(token).1
                                        );
                                        if client
                                            .get_socket_mut()
                                            .write(response.as_bytes())
                                            .is_err()
                                        {
                                            self._clients.remove(&token);
                                        }
                                        self._game.starting = true;
                                    } else {
                                        let response =
                                            format!("WHO THE FUCK ARE YOU {}\n", client.r#type);
                                        if client
                                            .get_socket_mut()
                                            .write(response.as_bytes())
                                            .is_err()
                                        {
                                            self._clients.remove(&token);
                                        }
                                    }
                                }
                            }
                            Err(_) => {
                                let _ = client.get_socket_mut().shutdown(std::net::Shutdown::Both);
                                self._clients.remove(&token);
                                #[cfg(feature = "log")]
                                println!("Client {:?} disconnected (error)", token);
                            }
                        }
                    }
                }
            }
            if time::Instant::now()
                .duration_since(self._game.last_update)
                .as_millis()
                >= (1000 / self._ticks) as u128
            {
                #[cfg(feature = "debug")]
                println!(
                    "Game has been running for {} ticks",
                    (time::Instant::now()
                        .duration_since(self._game.starting_time)
                        .as_millis())
                );
                self._game.last_update = time::Instant::now();
                self._game.routine();
            }
        }
    }
}
