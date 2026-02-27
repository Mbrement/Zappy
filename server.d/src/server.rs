use mio::net::{TcpListener, TcpStream};
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
use rand::*;
use std::{process, time};

pub struct Server {
    _address: String,
    _port: u16,
    _client_token: Token,
    _next_token: u32,
    _poll: Poll,
    _events: Events,
    __pass__: String,
    _clients: HashMap<Token, Client>,
    pub(crate) _max_clients: HashMap<String, u32>,
    pub _max_clients_per_team: u32,
    _socket: TcpListener,
    _ticks: u64,
    _incantation_list: HashMap<Token, Vec<Token>>,
    pub(crate) _game: game::Game,
    send_to_graph: String,
}

struct ClientBuffer {
    data: HashMap<Token, ([u8; 500_000], usize)>,
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
        let pwd = if passwd.is_empty() {
            "ADMIN".to_string()
        } else {
            passwd.clone()
        };
        Server {
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
            _game: game::Game::new(10, 10),
            _incantation_list: HashMap::new(),
            send_to_graph: String::new(),
        }
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
        for team in self._game.team.keys() {
            self._max_clients.insert(team.clone(), clients);
        }
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

    pub fn get_clients_by_pos_mut(&mut self, clients_pos: (u32, u32)) -> Vec<&mut Client> {
        self._clients
            .values_mut()
            .filter(|client| client.position == clients_pos && client.level != 0)
            .collect()
    }

    pub fn get_ticks(&self) -> u64 {
        self._ticks
    }
    pub fn get_map(&self) -> &map::Map {
        &self._game.map
    }
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

    pub fn disconnect_client_mut(&mut self, client: &mut Client) {
        let _ = client.get_socket_mut().shutdown(std::net::Shutdown::Both);
        if client.r#type == define::ROLE_PLAYER {
            if client.is_incanting != Token(0) {
                self._incantation_list
                    .get_mut(&client.is_incanting)
                    .expect("Failed to remove token from incantation list")
                    .retain(|t| t != &client.token);
            }
            self._game.map.player_position.remove(&client.token);
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

    fn connect_attempt(&mut self, client_stream: TcpStream) -> bool {
        let token = Token(self._next_token as usize);
        if self._clients.contains_key(&token) {
            eprintln!("Client with token {:?} already exists", token);
            return false;
        }
        self._next_token += 1;
        self._clients
            .insert(token, Client::new(client_stream, token));
        let tmp = self._clients.get_mut(&token);
        if tmp.is_none() {
            eprintln!("Failed to get client socket");
            self._clients.remove(&token);
            return false;
        }
        let check = self._poll.registry().register(
            tmp.unwrap().get_socket_mut(),
            token,
            Interest::READABLE,
        );
        if check.is_err() {
            eprintln!("Failed to register client");
            self._clients.remove(&token);
            return false;
        }
        let response = "BIENVENUE\n".to_string();
        if self
            ._clients
            .get_mut(&token)
            .unwrap()
            .get_socket_mut()
            .write(response.as_bytes())
            .is_err()
        {
            self._clients.remove(&token);
            return false;
        }
        self._clients.get_mut(&token).unwrap().r#type = "welcomed".to_string();
        true
    }

    fn get_position_new_client(
        &mut self,
        token: Token,
        cmd: &String,
        _command_manager: &mut CommandManager,
    ) -> ((u32, u32), u128) {
        let mut egg: (u128, u32, u32, String, u128, bool) = (0, 0, 0, cmd.clone(), 0, false);
        if self._game.starting
            && let Some(egg_found) = self
                ._game
                .map
                .egg_position
                .iter()
                .find(|(_, pos)| *cmd == pos.2 && !pos.4)
                .map(|(k, v)| (*k, v.0, v.1, v.2.clone(), v.3, v.4))
        {
            egg = egg_found
        };

        if egg.0 == 0 {
            return (
                (
                    self._game
                        .map
                        .rng
                        .random_range(0..self._game.map.get_width()),
                    self._game
                        .map
                        .rng
                        .random_range(0..self._game.map.get_height()),
                ),
                0,
            );
        }
        let egg_mut = self._game.map.egg_position.get_mut(&egg.0).unwrap();
        egg_mut.4 = true;
        _command_manager.next_execute.insert(token, egg.4);
        _command_manager.add_to_queue_internal("spawning".to_string(), token, egg.0.to_string());
        #[cfg(feature = "log")]
        {
            if _command_manager.next_execute.contains_key(&token) {
                println!(
                    "{:?}, {:?}",
                    _command_manager.next_execute[&token], self._game._tick
                );
            };
        }
        ((egg.1, egg.2), egg.0)
    }

    fn update_new_client_info(
        &mut self,
        token: &Token,
        cmd: &String,
        _command_manager: &mut CommandManager,
    ) {
        let mut position = (0, 0);
        let mut egg_id = 0;
        if self._clients.contains_key(token) {
            (position, egg_id) = self.get_position_new_client(*token, cmd, _command_manager);
        }
        if let Some(client) = self._clients.get_mut(token) {
            let player_token = client.get_token();
            client.r#type = define::ROLE_PLAYER.to_string();
            client.position = position;
            client.was_egg = egg_id;
            if egg_id != 0 {
                client.level = 0;
            }
            self._game
                .update_player_position(player_token, client.position);
            client.orientation = "NESW"
                .chars()
                .nth(self._game.map.rng.random_range(0..3))
                .unwrap();
            self._game.team.get_mut(cmd).unwrap().push(player_token); //push the client token into the team
            let response = format!(
                "{}\n{} {}\n",
                self._max_clients[cmd] as usize - self._game.team[cmd].len() + 1,
                self._game.map.get_height(),
                self._game.map.get_width()
            );
            if client.get_socket_mut().write(response.as_bytes()).is_err() {
                self._clients.remove(&player_token);
            }

            if egg_id == 0 {
                graphic::send_graphic_clients(graphic::egg_hatches(&player_token, self), self);
            }
        }
        self._game.starting = true;
    }

    fn not_enough_space(&mut self, token: &Token, to_disconnect: &mut Vec<Token>) {
        if let Some(client) = self._clients.get_mut(token) {
            let _ = client.get_socket_mut().write(
                format!(
                    "0\n{} {}\n",
                    self._game.map.get_height(),
                    self._game.map.get_width()
                )
                .as_bytes(),
            );
        }
        to_disconnect.push(*token);
    }

    fn admin_cmd(
        &mut self,
        buffer: &[u8],
        n: usize,
        token: &Token,
        _command_manager: &mut CommandManager,
    ) {
        let cmd = String::from_utf8_lossy(&buffer[..n]).trim().to_string();
        let mut parts = cmd.splitn(2, ' ');
        let name = parts.next().unwrap_or("");
        let arg = parts.next().unwrap_or("");
        #[cfg(feature = "log")]
        println!("Received command '{}' from {:?} 3", cmd, token);
        _command_manager.execute(name, *token, arg, self);
    }

    fn graph_connect(&mut self, token: &Token, to_disconnect: &mut Vec<Token>) {
        let client = self._clients.get(token).unwrap();
        if client
            .get_socket()
            .write(graphic::event_graph_connect(self).as_bytes())
            .is_err()
        {
            self._clients.remove(token);
            to_disconnect.push(*token);
        }
    }

    fn clients_hunger(&mut self, to_disconnect: &mut Vec<Token>) {
        for client in self.get_clients_by_type_mut(define::ROLE_PLAYER) {
            if client.level != 0 {
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
        }
    }

    //check natural death of the eggs without clients
    fn egg_life(&mut self, ticks_to_remove: &mut Vec<u128>) {
        for (egg_id, (_, _, team, tick, _)) in self._game.map.egg_position.iter() {
            if tick < &self._game._tick {
                let tmp = self._max_clients.get_mut(team);
                if let Some(v) = tmp
                    && *v > self._max_clients_per_team {
                    *v -= 1;
                }
                ticks_to_remove.push(*egg_id);
            }
        }
    }

    fn register_listener(&mut self) -> bool {
        if let Err(e) = self._poll.registry().register(
            &mut self._socket,
            self._client_token,
            Interest::READABLE,
        ) {
            eprintln!("Failed to register socket: {}", e);
            return true;
        }
        false
    }

    fn check_poll(&mut self) -> bool {
        let check = self._poll.poll(
            &mut self._events,
            Some(time::Duration::from_millis(1000 / self._ticks)),
        );
        if check.is_err() {
            eprintln!("Failed to poll events");
            return true;
        }
        false
    }

    fn on_tick(
        &mut self,
        to_disconnect: &mut Vec<Token>,
        _command_manager: &mut CommandManager,
    ) -> bool {
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

            self.clients_hunger(to_disconnect);
            let mut ticks_to_remove: Vec<u128> = Vec::new();
            self.egg_life(&mut ticks_to_remove);
            for t in ticks_to_remove {
                self.send_to_graph += &graphic::rotten_egg(t);
                self._game.map.egg_position.remove(&t);
            }
            for token in to_disconnect {
                if self
                    ._clients
                    .get(token)
                    .is_some_and(|c| c.r#type == define::ROLE_PLAYER)
                {
                    self.send_to_graph += &graphic::player_death(token);
                }
                self.disconnect_client_by_token(token);
            }
            graphic::send_graphic_clients(self.send_to_graph.clone(), self);
            self.send_to_graph.clear();
            return true;
        }
        false
    }

    pub fn run(&mut self) {
        let mut _command_manager = CommandManager::new_server();
        let mut buf: ClientBuffer = ClientBuffer {
            data: HashMap::new(),
        };
        #[cfg(feature = "log")]
        println!("Server is running...");
        if self.register_listener() {
            return;
        }
        let mut to_disconnect = Vec::new();
        loop {
            if self.check_poll() {
                return;
            }
            let events_snapshot: Vec<mio::event::Event> = self._events.iter().cloned().collect();
            for event in events_snapshot.iter() {
                if event.token() == self._client_token {
                    match self._socket.accept() {
                        Ok((client_stream, _)) => {
                            if !self.connect_attempt(client_stream) {
                                break;
                            }
                        }
                        Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                        Err(e) => {
                            eprintln!("Error accepting connection: {}", e);
                            break;
                        }
                    }
                } else {
                    let mut graphic_ok: bool = false;
                    let token = event.token();
                    if let Some(client) = self._clients.get_mut(&token) {
                        let entry = buf.data.entry(token).or_insert(([0; 500_000], 0));
                        let start = entry.1;
                        match client.get_socket_mut().read(&mut entry.0[start..]) {
                            Ok(0) => {
                                to_disconnect.push(token);
                                #[cfg(feature = "log")]
                                println!("Client {:?} disconnected", token);
                            }
                            Ok(n) => {
                                #[cfg(feature = "debug")]
                                println!("Received {} bytes from {:?} 1", n, token);
                                if client.r#type == define::ROLE_PLAYER {
                                    // pass the whole ClientBuffer so command_received can manage lengths
                                    command_received(&mut buf, n, client, &mut _command_manager);
                                } else if client.r#type == define::ROLE_WELCOMED {
                                    // interpret only the newly read bytes
                                    let cmd = String::from_utf8_lossy(&entry.0[start..start + n])
                                        .trim()
                                        .to_string();
                                    if cmd == define::GRAPHICAL_CLIENT {
                                        client.r#type = define::GRAPHICAL_CLIENT.to_string();
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
                                            self.update_new_client_info(
                                                &token,
                                                &cmd,
                                                &mut _command_manager,
                                            );
                                        } else {
                                            self.not_enough_space(&token, &mut to_disconnect)
                                        }
                                    } else if cmd
                                        == format!("{} {}", define::ADMIN_CLIENT, self.__pass__)
                                    {
                                        admin_client_connect(&token, client, &mut to_disconnect);
                                    } else {
                                        default_response(
                                            &token,
                                            client,
                                            &mut to_disconnect,
                                            self._game.map.get_height(),
                                            self._game.map.get_width(),
                                        );
                                    }
                                } else if client.r#type == define::ADMIN_CLIENT {
                                    // pass a byte slice of the newly-read data
                                    self.admin_cmd(
                                        &entry.0[start..start + n],
                                        n,
                                        &token,
                                        &mut _command_manager,
                                    );
                                }
                            }
                            Err(_) => {
                                #[cfg(feature = "log")]
                                println!("Client {:?} disconnected (error)", token);
                                to_disconnect.push(token);
                            }
                        }
                    }
                    if graphic_ok {
                        self.graph_connect(&token, &mut to_disconnect);
                    }
                }
            }
            if self.on_tick(&mut to_disconnect, &mut _command_manager) {
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
        "unknown".to_string()
    }

    pub fn incantation_success(&mut self, token: Token) -> bool {
        let mut level_checker = 0;
        if !self._incantation_list.contains_key(&token) {
            return false;
        }
        let player_level = match self._clients.get(&token) {
            Some(p) => p.level,
            _ => return false,
        };
        if self._game.check_inventory(&token, self) {
            if let Some(player) = self._clients.get_mut(&token) {
                for i in 1..6 {
                    player.inventory[i] -=
                        define::INCANTATION_REQ[player_level as usize - 1][i];
                }
            } else {
                eprintln!("Player with token {:?} not found", token);
            }
        } else {
            return false;
        }

        if self._incantation_list[&token].len() as u128 + 1
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
            if level_checker >= define::INCANTATION_REQ[player_level as usize - 1][0] {
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
    }
    process::exit(0);
}

fn command_received(
    buffer: &mut ClientBuffer,
    n: usize,
    client: &mut Client,
    _command_manager: &mut CommandManager,
) {
    let token = client.get_token();
    let entry = buffer.data.entry(token).or_insert(([0; 500_000], 0));
    let buf = &mut entry.0;
    let buf_len = &mut entry.1;
    let end = (*buf_len).saturating_add(n);
    if end > buf.len() {
        return;
    }
    let content_str = String::from_utf8_lossy(&buf[..end]);
    if let Some(last_newline) = content_str.rfind('\n') {
        let complete_part = &content_str[..last_newline];

        for line in complete_part.lines() {
            let mut parts = line.splitn(2, ' ');
            let name = parts.next().unwrap_or("");
            let arg = parts.next().unwrap_or("");
            _command_manager.add_to_queue(name.to_string(), token, arg.to_string());
        }
        let leftover_start = last_newline + 1;
        let leftover_len = end - leftover_start;
        buf.copy_within(leftover_start..end, 0);

        *buf_len = leftover_len;
    } else {
        *buf_len = end;
    }
}

fn admin_client_connect(token: &Token, client: &mut Client, to_disconnect: &mut Vec<Token>) {
    client.r#type = define::ADMIN_CLIENT.to_string();
    let response = "Welcome to the admin client!\n\n".to_string();
    if client.get_socket_mut().write(response.as_bytes()).is_err() {
        to_disconnect.push(*token);
    }
}

fn default_response(
    token: &Token,
    client: &mut Client,
    to_disconnect: &mut Vec<Token>,
    height: u32,
    width: u32,
) {
    let response = format!("0\n{} {}\n", height, width);
    if client.get_socket_mut().write(response.as_bytes()).is_err() {
        to_disconnect.push(*token);
    }
}
