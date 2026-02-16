use mio::net::TcpListener;
use mio::{Events, Interest, Poll, Token};
use std::collections::HashMap;
use std::io::{Read, Write};
mod client;
pub mod command_manager;
pub mod define;
pub mod utils;
pub mod graphic;
mod game;
mod map;
use crate::server::client::Client;
use crate::server::command_manager::CommandManager;
use rand::{rngs::SmallRng, *};
use std::collections::VecDeque;
use std::{process, time};

pub struct Server {
    _address: String,
    _port: u16,
    _client_token: Token,
    _next_token: u32,
    _poll: Poll,
    _events: Events,
    _clients: HashMap<Token, client::Client>,
    pub teams: HashMap<String, Vec<Token>>,
    _max_clients: HashMap<String, u32>,
    pub _max_clients_per_team: u32,
    _socket: mio::net::TcpListener,
    _ticks: u64,
    _incantation_list: HashMap<Token, Vec<Token>>,
    // _command_manager: CommandManager,
    pub(crate) _game: game::Game,
}

impl Server {
    pub fn new(port: u16) -> Self {
        let tmp_socket = TcpListener::bind(format!("{}:{}", "0.0.0.0", port).parse().unwrap());
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
            _address: "0.0.0.0".to_string(),
            _port: port,
            _client_token: Token(0),
            _poll: tmp_poll.unwrap(),
            _events: Events::with_capacity(1024),
            _max_clients: HashMap::new(),
            _clients: HashMap::new(),
            teams: HashMap::new(),
            _socket: tmp_socket.unwrap(),
            _ticks: 100,
            _next_token: 1,
            _max_clients_per_team: 10,
            // _command_manager: CommandManager::new_server(),
            _game: game::Game::new(10, 10),
            _incantation_list: HashMap::new(),
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

    pub fn set_ticks(&mut self, ticks: u64) {
        self._ticks = ticks;
    }

    pub fn set_clients_number(&mut self, clients: u32) {
        self._max_clients_per_team = clients;
        for team in self.teams.keys() {
            self._max_clients.insert(team.clone(), clients);
        }
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

    pub fn get_clients_by_type(&self, clients_type: &str) -> Vec<&Client> {
        self._clients
            .values()
            .filter(|client| client.r#type == clients_type)
            .collect()
    }

    pub fn get_clients_by_type_mut(&mut self, clients_type: &str) -> Vec<&mut Client> {
        self._clients
            .values_mut()
            .filter(|client| client.r#type == clients_type)
            .collect()
    }

    pub fn get_clients_by_pos(&self, clients_pos: (u32, u32)) -> Vec<&Client> {
        self._clients
            .values()
            .filter(|client| client.position == clients_pos)
            .collect()
    }

    pub fn get_clients_by_pos_mut(&mut self, clients_pos: (u32, u32)) -> Vec<&mut Client> {
        self._clients
            .values_mut()
            .filter(|client| client.position == clients_pos)
            .collect()
    }
    // pub fn get_clients_number(&self) -> u32 {
    //     self._max_clients.values().sum()
    // }

    pub fn get_ticks(&self) -> u64 {
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

    pub fn disconnect_client_by_token(&mut self, token: &Token) {
        // Remove the client first to avoid double mutable borrow
        let mut client = match self._clients.remove(token) {
            Some(client) => client,
            None => {
                eprintln!("Client with token {:?} not found for disconnection", token);
                return;
            }
        };
        self.disconnect_client_mut(&mut client);

        #[cfg(feature = "log")]
        println!("Client {:?} disconnected", token);
    }

    // pub fn disconnect_client(&mut self, client: Client) {
    //     client.get_socket().shutdown(std::net::Shutdown::Both);
    //     self._clients.remove(&client.get_token());
    // 	if client.r#type == define::ROLE_PLAYER{

    // 	}
    //     #[cfg(feature = "log")]
    //     println!("Client {:?} disconnected", client.get_token());
    // }

    pub fn disconnect_client_mut(&mut self, client: &mut Client) {
        let _ = client.get_socket_mut().shutdown(std::net::Shutdown::Both);
        // self._clients.remove(&client.get_token()); // Already removed in disconnect_client_by_token
        if client.r#type == define::ROLE_PLAYER {
            if let Some(team_name) = self.teams.iter_mut().find_map(|(name, tokens)| {
                if let Some(pos) = tokens.iter().position(|t| t == &client.get_token()) {
                    tokens.remove(pos);
                    Some(name.clone())
                } else {
                    None
                }
            }) {
                if let Some(max) = self._max_clients.get_mut(&team_name)
                    && self._max_clients_per_team < *max
                {
                    *max -= 1;
                }
            }
        }
        #[cfg(feature = "log")]
        println!("Client {:?} disconnected", client.get_token());
    }

    pub fn run(&mut self) {
        let mut _command_manager = CommandManager::new_server(self);
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
        let mut to_disconnect = Vec::new();
        loop {
            let check = self._poll.poll(
                &mut self._events,
                Some(time::Duration::from_millis((1000 / self._ticks))),
            );
            if check.is_err() {
                eprintln!("Failed to poll events");
                return;
            }
            for event in self._events.iter() {
                if event.token() == self._client_token {
                    // loop {
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
                            self._clients.get_mut(&token).unwrap().r#type = "welcomed".to_string();
                        }
                        Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                        Err(e) => {
                            eprintln!("Error accepting connection: {}", e);
                            break;
                        }
                    }
                    // break;
                    // }
                } else {
                    let token = event.token();
                    if let Some(client) = self._clients.get_mut(&token) {
                        match client.get_socket_mut().read(&mut buf) {
                            Ok(0) => {
                                // let _ = client.get_socket_mut().shutdown(std::net::Shutdown::Both);

                                // self._clients.remove(&token);
                                to_disconnect.push(token);
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
                                    let token = client.get_token();
                                    drop(client);
                                    // let mut s = Server::new(5555);
                                    _command_manager.add_to_queue(
                                        name.to_string(),
                                        token,
                                        arg.to_string(),
                                    );
                                } else if client.r#type == define::ROLE_WELCOMED {
                                    let cmd = String::from_utf8_lossy(&buf[..n]).trim().to_string();
                                    if cmd == define::GRAPHICAL_CLIENT {
                                        client.r#type = define::GRAPHICAL_CLIENT.to_string();
                                        //TODO : Mrozniec : start the routine for comunicate with graphical interface
                                        if client
                                            .get_socket_mut()
                                            .write(
                                                format!("{} connected\n", define::GRAPHICAL_CLIENT)
                                                    .as_bytes(),
                                            )
                                            .is_err()
                                        {
                                            self._clients.remove(&token);
                                            to_disconnect.push(token);
                                        }
                                    } else if self.teams.contains_key(&cmd) {
                                        println!(
                                            "Client {:?} wants to join team '{}' = cmd",
                                            token, cmd
                                        );
                                        println!("Current teams: {:?}", self.teams);
                                        println!(
                                            "Max clients for team '{}': {:?}",
                                            cmd,
                                            self._max_clients.get(&cmd)
                                        );
                                        println!(
                                            "Current clients in team '{}': {:?}",
                                            cmd,
                                            self.teams.get(&cmd)
                                        );
                                        if self.teams[&cmd].len() < self._max_clients[&cmd] as usize
                                        {
                                            self.teams.get_mut(&cmd).unwrap().push(token);
                                            client.r#type = define::ROLE_PLAYER.to_string();
                                            client.position = (if !self._game.starting {
                                                (
                                                    self._game.map.rng.random_range(
                                                        0..self._game.map.get_width(),
                                                    ),
                                                    self._game.map.rng.random_range(
                                                        0..self._game.map.get_height(),
                                                    ),
                                                )
                                            } else {
                                                self._game.spawn_player(token, &cmd)
                                            });

                                            self._game
                                                .update_player_position(token, client.position);
                                            client.orientation = "NESW"
                                                .chars()
                                                .nth(self._game.map.rng.random_range(0..3))
                                                .unwrap();
                                            self._game.team.get_mut(&cmd).unwrap().push(token); //push the client token into the team
                                            let response = format!(
                                                "{}\n{} {}\n",
                                                self._max_clients[&cmd] as usize
                                                    - self.teams[&cmd].len()
                                                    + 1,
                                                self._game.map.get_height(),
                                                self._game.map.get_width()
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
                                            client.get_socket_mut().write(
                                                format!(
                                                    "0\n{} {}\n",
                                                    self._game.map.get_height(),
                                                    self._game.map.get_width()
                                                )
                                                .as_bytes(),
                                            );

                                            // let _ = client
                                            //     .get_socket_mut()
                                            //     .shutdown(std::net::Shutdown::Both);
                                            to_disconnect.push(token);
                                        }
                                    } else {
                                        let response = format!(
                                            "0\n{} {}\n",
                                            self._game.map.get_height(),
                                            self._game.map.get_width()
                                        );
                                        if client
                                            .get_socket_mut()
                                            .write(response.as_bytes())
                                            .is_err()
                                        {
                                            // client
                                            //     .get_socket_mut()
                                            //     .shutdown(std::net::Shutdown::Both);
                                            to_disconnect.push(token);
                                        }
                                    }
                                }
                            }
                            Err(_) => {
                                // let _ = client.get_socket_mut().shutdown(std::net::Shutdown::Both);
                                // self._clients.remove(&token);
                                #[cfg(feature = "log")]
                                println!("Client {:?} disconnected (error)", token);
                                to_disconnect.push(token);
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
                _command_manager.process_queue(self);

                for client in self.get_clients_by_type_mut("player") {
                    client.hunger_tick();
                    #[cfg(feature = "debug")]
                    println!("Client {:?} hunger: {}", client.get_token(), client.hunger);
                    if client.hunger == 0 {
                        let _ = client.get_socket_mut().write(b"mort\n");
                        to_disconnect.push(client.get_token());
                    }
                }
                for token in &to_disconnect {
                    self.disconnect_client_by_token(&token);
                }
                to_disconnect.clear();
            }
        }
    }

    pub fn get_team_for_player(&self, token: &Token) -> String {
        for (team_name, tokens) in &self.teams {
            if tokens.contains(token) {
                return team_name.clone();
            }
        }
        return "unknown".to_string();
    }

	pub fn incantation_success(&mut self, token: Token) -> bool {
		if !self._game.check_inventory(&token, self) {
			if let Some(player) = self._clients.get_mut(&token) {
				let player_level = player.level;
				for i in 1..7 {
					player.inventory[i] -= define::INCANTATION_REQ[player_level as usize - 1][i];
				}
			} else {
				eprintln!("Player with token {:?} not found", token);
			}
			return false;
		}
		let player = match self._clients.get(&token) {
			Some(p) => p,
			None => return false,
		};
		let player_level = player.level;
		if (self._incantation_list[&token].len() as u32 + 1) < define::INCANTATION_REQ[player_level as usize - 1][0] {
			return false;
		}
		true
	}
}