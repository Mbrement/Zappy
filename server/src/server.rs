use mio::net::TcpListener;
use mio::{Events, Interest, Poll, Token};
use std::collections::HashMap;
use std::io::{Read, Write};
mod client;
pub mod command_manager;
pub mod define;
mod game;
pub mod graphic;
mod map;
pub mod utils;
use crate::server::client::Client;
use crate::server::command_manager::CommandManager;
//use crate::server::{self};
use rand::*;
//use std::collections::VecDeque;
use std::{process, time};

pub struct Server {
    _address: String,
    _port: u16,
    _client_token: Token,
    _next_token: u32,
    _poll: Poll,
    _events: Events,
    __pass__: String,
    _clients: HashMap<Token, client::Client>,
    // pub teams: HashMap<String, Vec<Token>>,
    pub(crate) _max_clients: HashMap<String, u32>,
    pub _max_clients_per_team: u32,
    _socket: mio::net::TcpListener,
    _ticks: u64,
    _incantation_list: HashMap<Token, Vec<Token>>,
    // _command_manager: CommandManager,
    pub(crate) _game: game::Game,
    send_to_graph: String,
}

impl Server {
    pub fn new(port: u16, passwd: String) -> Self {
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
        let pwd;
        if passwd.is_empty() {
            pwd = "ADMIN".to_string();
        } else {
            pwd = passwd.clone();
        }
        let tmp = Server {
            _address: "0.0.0.0".to_string(),
            _port: port,
            _client_token: Token(0),
            _poll: tmp_poll.unwrap(),
            _events: Events::with_capacity(1024),
            _max_clients: HashMap::new(),
            _clients: HashMap::new(),
            _socket: tmp_socket.unwrap(),
            _ticks: 100,
            _next_token: 1,
            _max_clients_per_team: 10,
            __pass__: pwd,
            // _command_manager: CommandManager::new_server(),
            _game: game::Game::new(10, 10),
            _incantation_list: HashMap::new(),
            send_to_graph: String::new(),
        };
        tmp
    }

    // ________________Setters
    /*
    fn set_passwd(&mut self, passwd: String) {
        self.__pass__ = passwd;
    }

    pub fn set_address(&mut self, addr: String) {
        self._address = format!("{}", addr);
        let tmp_socket =
            TcpListener::bind(format!("{}:{}", "127.0.0.1", self._port).parse().unwrap());
        if tmp_socket.is_err() {
            eprintln!("Failed to bind to address");
            process::exit(1);
        }
        #[cfg(feature = "log")]
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
        #[cfg(feature = "log")]
        println!("Server port changed to: {}", self._port);
        self._socket = tmp_socket.unwrap();
    }*/

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
        for team in self._game.team.keys() {
            self._max_clients.insert(team.clone(), clients);
        }
    }

    // ________________Getters
    /*
    pub fn get_port(&self) -> u16 {
        self._port
    }*/

    pub fn get_height(&self) -> u32 {
        self._game.map.get_height()
    }

    pub fn get_width(&self) -> u32 {
        self._game.map.get_width()
    }
    /*
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
    */
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
    /*
    pub fn get_clients_by_pos(&self, clients_pos: (u32, u32)) -> Vec<&Client> {
        self._clients
            .values()
            .filter(|client| client.position == clients_pos)
            .collect()
    }*/

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
    /*
        pub fn get_socket(&self) -> &mio::net::TcpListener {
            &self._socket
        }

        pub fn get_socket_mut(&mut self) -> &mut mio::net::TcpListener {
            &mut self._socket
        }
    */
    pub fn get_map(&self) -> &map::Map {
        &self._game.map
    }
    /*
        pub fn get_map_mut(&mut self) -> &mut map::Map {
            &mut self._game.map
        }
    */
    pub fn disconnect_client_by_token(&mut self, token: &Token) {
        // Remove the client first to avoid double mutable borrow
        let mut client = match self._clients.remove(token) {
            Some(client) => client,
            _ => {
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
            if client.is_incanting != Token(0) {
                self._incantation_list
                    .get_mut(&client.is_incanting)
                    .expect("Failed to remove token from incantation list")
                    .retain(|t| t != &client.token);
            }
            if let Some(team_name) = self._game.team.iter_mut().find_map(|(name, tokens)| {
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
                    #[cfg(feature = "log")]
                    println!("Decreasing max clients for team {}", team_name);
                    *max -= 1;
                }
            }
        }
        #[cfg(feature = "log")]
        println!("Client {:?} disconnected", client.get_token());
    }

    pub fn run(&mut self) {
        let mut _command_manager = CommandManager::new_server();
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
                Some(time::Duration::from_millis(1000 / self._ticks)),
            );
            if check.is_err() {
                eprintln!("Failed to poll events");
                return;
            }
            let events_snapshot: Vec<mio::event::Event> = self._events.iter().cloned().collect();
            for event in events_snapshot.iter() {
                if event.token() == self._client_token {
                    // loop {
                    match self._socket.accept() {
                        Ok((client_stream, _)) => {
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
                            let response = format!("BIENVENUE\n");
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
                    let mut graphic_ok: bool = false;
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
                                    for line in cmd.lines() {
                                        let mut parts = line.splitn(2, ' ');
                                        let name = parts.next().unwrap_or("");
                                        let arg = parts.next().unwrap_or("");
                                        #[cfg(feature = "debug")]
                                        println!("Received command '{}' from {:?}", cmd, token);
                                        let token = client.get_token();
                                        // drop(client);
                                        // let mut s = Server::new(5555);
                                        _command_manager.add_to_queue(
                                            name.to_string(),
                                            token,
                                            arg.to_string(),
                                        );
                                    }
                                } else if client.r#type == define::ROLE_WELCOMED {
                                    let cmd = String::from_utf8_lossy(&buf[..n]).trim().to_string();
                                    if cmd == define::GRAPHICAL_CLIENT {
                                        client.r#type = define::GRAPHICAL_CLIENT.to_string();

                                        //TODO : Mrozniec : start the routine for comunicate with graphical interface
                                        //je ne peut pas le faire ici, j'ai besoin de self hors a cet endroit il est déjà utiliser a la ligne 330
                                        /*if client
                                            .get_socket_mut()
                                            .write(
                                                event_graph_connect(self)
                                                    .as_bytes(),
                                            )
                                            .is_err()
                                        {
                                            self._clients.remove(&token);
                                            to_disconnect.push(token);
                                        }*/
                                        graphic_ok = true;
                                    } else if self._game.team.contains_key(&cmd) {
                                        #[cfg(feature = "log")]
                                        {
                                            println!(
                                                "Client {:?} wants to join team '{}' = cmd",
                                                token, cmd
                                            );
                                            println!("Current teams: {:?}", self._game.team);
                                            println!(
                                                "Max clients for team '{}': {:?}",
                                                cmd,
                                                self._max_clients.get(&cmd)
                                            );
                                        }
                                        if self._game.team[&cmd].len()
                                            < self._max_clients[&cmd] as usize
                                        {
                                            let player_token = token;
                                            //drop(client);
                                            // self._game
                                            //     .team
                                            //     .get_mut(&cmd)
                                            //     .unwrap()
                                            //     .push(player_token);

                                            let position = if !self._game.starting {
                                                (
                                                    self._game.map.rng.random_range(
                                                        0..self._game.map.get_width(),
                                                    ),
                                                    self._game.map.rng.random_range(
                                                        0..self._game.map.get_height(),
                                                    ),
                                                )
                                            } else {
                                                let found = self
                                                    ._game
                                                    .map
                                                    .egg_position
                                                    .iter()
                                                    .find(|(_, pos)| {
                                                        cmd == self.get_team_for_player(&pos.2)
                                                    })
                                                    .map(|(k, v)| (*k, v.0, v.1, v.2, v.3));
                                                let (egg_id, _, _, _, tick) =
                                                    found.unwrap_or((0, 0, 0, mio::Token(0), 0));
                                                if egg_id != 0 {
                                                    _command_manager
                                                        .next_execute
                                                        .insert(token, tick + 600); //get the tick of the hatching of the egg);
                                                }
                                                _command_manager.add_to_queue_internal(
                                                    "spawning".to_string(),
                                                    token,
                                                    egg_id.to_string(),
                                                );
                                                #[cfg(feature = "log")]
                                                {
                                                    if _command_manager
                                                        .next_execute
                                                        .contains_key(&token)
                                                    {
                                                        println!(
                                                            "{:?}, {:?}",
                                                            _command_manager.next_execute[&token],
                                                            self._game._tick
                                                        );
                                                    }
                                                }
                                                self._game.spawn_player(player_token, &cmd, found)
                                            };

                                            // re-borrow the client to set its fields and write responses
                                            if let Some(client) =
                                                self._clients.get_mut(&player_token)
                                            {
                                                client.r#type = define::ROLE_PLAYER.to_string();
                                                client.position = position;

                                                self._game.update_player_position(
                                                    player_token,
                                                    client.position,
                                                );
                                                client.orientation = "NESW"
                                                    .chars()
                                                    .nth(self._game.map.rng.random_range(0..3))
                                                    .unwrap();
                                                self._game
                                                    .team
                                                    .get_mut(&cmd)
                                                    .unwrap()
                                                    .push(player_token); //push the client token into the team
                                                let response = format!(
                                                    "{}\n{} {}\n",
                                                    self._max_clients[&cmd] as usize
                                                        - self._game.team[&cmd].len()
                                                        + 1,
                                                    self._game.map.get_height(),
                                                    self._game.map.get_width()
                                                );
                                                if client
                                                    .get_socket_mut()
                                                    .write(response.as_bytes())
                                                    .is_err()
                                                {
                                                    self._clients.remove(&player_token);
                                                }
                                                if !self._game.starting {
                                                    graphic::send_graphic_clients(
                                                        graphic::egg_hatches(&player_token, self),
                                                        self,
                                                    );
                                                }
                                            }
                                            self._game.starting = true;
                                        } else {
                                            // still need to use the client; re-borrow it
                                            if let Some(client) = self._clients.get_mut(&token) {
                                                let _ = client.get_socket_mut().write(
                                                    format!(
                                                        "0\n{} {}\n",
                                                        self._game.map.get_height(),
                                                        self._game.map.get_width()
                                                    )
                                                    .as_bytes(),
                                                );
                                            }

                                            // let _ = client
                                            //     .get_socket_mut()
                                            //     .shutdown(std::net::Shutdown::Both);
                                            to_disconnect.push(token);
                                        }
                                    } else if cmd
                                        == format!("{} {}", define::ADMIN_CLIENT, self.__pass__)
                                    {
                                        #[cfg(feature = "log")]
                                        println!("Received command '{}' from {:?} 2", cmd, token);
                                        client.r#type = define::ADMIN_CLIENT.to_string();
                                        let response =
                                            "Welcome to the admin client!\n\n".to_string();
                                        if client
                                            .get_socket_mut()
                                            .write(response.as_bytes())
                                            .is_err()
                                        {
                                            to_disconnect.push(token);
                                        }
                                        let response = format!(
                                            "0\n{} {}\n\n",
                                            self._game.map.get_height(),
                                            self._game.map.get_width()
                                        );
                                        if client
                                            .get_socket_mut()
                                            .write(response.as_bytes())
                                            .is_err()
                                        {
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
                                } else if client.r#type == define::ADMIN_CLIENT {
                                    let cmd = String::from_utf8_lossy(&buf[..n]).trim().to_string();
                                    let mut parts = cmd.splitn(2, ' ');
                                    let name = parts.next().unwrap_or("");
                                    let arg = parts.next().unwrap_or("");
                                    #[cfg(feature = "log")]
                                    println!("Received command '{}' from {:?} 3", cmd, token);
                                    _command_manager.execute(name, token, arg, self);
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
                    if graphic_ok {
                        let client = self._clients.get(&token).unwrap();
                        if client
                            .get_socket()
                            .write(graphic::event_graph_connect(self).as_bytes())
                            .is_err()
                        {
                            self._clients.remove(&token);
                            to_disconnect.push(token);
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
                self.send_to_graph += &self._game.routine();
                _command_manager.process_queue(self);

                for client in self.get_clients_by_type_mut(define::ROLE_PLAYER) {
                    client.hunger_tick();
                    #[cfg(feature = "debug")]
                    println!(
                        "Client {:?} hunger: {}",
                        client.get_token(),
                        client.inventory[0]
                    );
                    if client.inventory[0] == 0 {
                        let _ = client.get_socket_mut().write(b"mort\n");
                        to_disconnect.push(client.get_token());
                    }
                }
                let mut graph_msg = String::new();
                for token in &to_disconnect {
                    graph_msg += &graphic::player_death(&token);
                    self.disconnect_client_by_token(&token);
                }
                graphic::send_graphic_clients(graph_msg, self);
                to_disconnect.clear();
            }
        }
    }

    pub fn get_team_for_player(&self, token: &Token) -> String {
        for (team_name, tokens) in &self._game.team {
            if tokens.contains(token) {
                return team_name.clone();
            }
        }
        return "unknown".to_string();
    }

    pub fn incantation_success(&mut self, token: Token) -> bool {
        let mut level_checker = 0;
        let player_level = match self._clients.get(&token) {
            Some(p) => p.level,
            _ => return false,
        };
        if self._game.check_inventory(&token, self) {
            if let Some(player) = self._clients.get_mut(&token) {
                for i in 1..6 {
                    player.inventory[i] -=
                        define::INCANTATION_REQ[player_level as usize - 1][i] as u128;
                }
            } else {
                eprintln!("Player with token {:?} not found", token);
            }
        } else {
            return false;
        }

        if self._incantation_list.contains_key(&token)
            && (self._incantation_list[&token].len() as u128 + 1)
                < define::INCANTATION_REQ[player_level as usize - 1][0]
        {
            return false;
        }
        for token in self._incantation_list[&token].clone() {
            let target = match self._clients.get(&token) {
                Some(p) => p,
                _ => continue,
            };
            if target.level == self._clients[&token].level {
                level_checker += 1;
            }
            if level_checker == define::INCANTATION_REQ[player_level as usize - 1][0] {
                return true;
            }
        }
        false
    }

    pub fn check_win_condition(&self, token: &Token) -> bool {
        let team_name = self.get_team_for_player(token);
        if team_name == "unknown" {
            return false;
        }
        let team_tokens = match self._game.team.get(&team_name) {
            Some(tokens) => tokens,
            _ => return false,
        };
        let mut max_level_players = 0;
        for t in team_tokens {
            if let Some(player) = self._clients.get(t) {
                if player.level == 8 {
                    max_level_players += 1;
                }
            } else {
                #[cfg(feature = "log")]
                eprintln!("Player with token {:?} not found", t);
                return false;
            }
        }
        if max_level_players >= 6 {
            return true;
        }
        false
    }
}

pub fn exit_game(server: &mut Server) {
    for client in server.get_clients_by_type_mut("player") {
        let _ = client
            .get_socket_mut()
            .write(format!("{}\n", "mort").as_bytes());

        // TODO Mrozniec : send end game to graphical client
    }
    process::exit(0);
}
