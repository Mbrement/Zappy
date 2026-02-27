use crate::server;
use crate::server::graphic;
#[cfg(feature = "log")]
use crate::server::utils;
use crate::server::{Server, client::Client, define};
use mio::Token;
use std::collections::{HashMap, VecDeque};
use std::io::Write;

pub type CommandFn = Box<dyn Fn(mio::Token, &mut Server, &str)>;
pub type CommandArgs = (String, mio::Token, String);
pub struct CommandManager {
    internal_queue: HashMap<Token, u8>,
    order: HashMap<Token, VecDeque<CommandArgs>>,
    pub(crate) next_execute: HashMap<Token, u128>,
    commands: HashMap<String, CommandFn>,
}

impl CommandManager {
    pub fn new() -> Self {
        Self {
            internal_queue: HashMap::new(),
            order: HashMap::new(),
            next_execute: HashMap::new(),
            commands: HashMap::new(),
        }
    }

    pub fn add_to_queue(&mut self, name: String, token: mio::Token, arg: String) {
        #[cfg(feature = "log")]
        println!(
            "Try to dded command '{}' to queue for token {:?} withargs: {}. queu len : {}",
            name,
            token,
            arg.clone(),
            self.order.entry(token).or_insert_with(VecDeque::new).len()
        );
        if !define::COMMANDLIST.contains(&name.as_str()) {
            #[cfg(feature = "log")]
            println!("Commande '{}' non reconnue.", name);
            return;
        }
        if self.order.entry(token).or_insert_with(VecDeque::new).len()
            < 10 + *self.internal_queue.get(&token).unwrap_or(&0) as usize
        {
            #[cfg(feature = "log")]
            println!(
                "Adding command '{}' to queue for token {:?} with args: {}. queue len : {}",
                name,
                token,
                arg.clone(),
                self.order.entry(token).or_insert_with(VecDeque::new).len()
            );
            self.order
                .entry(token)
                .or_insert_with(VecDeque::new)
                .push_back((name.clone(), token, arg.clone()));
            if self.next_execute.entry(token).or_insert(0) == &0 {
                self.next_execute.insert(token, 0);
            }
        }
    }

    pub(crate) fn add_to_queue_internal(&mut self, name: String, token: mio::Token, arg: String) {
        *self.internal_queue.entry(token).or_insert(0) += 1;
        self.order
            .entry(token)
            .or_insert_with(VecDeque::new)
            .push_front((name.clone(), token, arg.clone()));
    }

    pub fn register<F>(&mut self, name: &str, func: F)
    where
        F: Fn(mio::Token, &mut Server, &str) + 'static,
    {
        self.commands.insert(name.to_string(), Box::new(func));
    }

    pub fn execute(&self, name: &str, token: mio::Token, arg: &str, server: &mut Server) {
        if let Some(func) = self.commands.get(name) {
            #[cfg(feature = "log")]
            println!("Executing command '{}' with args: {}", name, arg);
            func(token, server, arg);
        } else {
            #[cfg(feature = "log")]
            println!("Commande '{}' non trouvée.", name);
        }
    }
    // default configuration of commande for a server
    pub fn new_server() -> Self {
        let mut command_manager = CommandManager::new();

        command_manager.admin_command();
        command_manager.movement_command();
        command_manager.default_command();
        command_manager.fork_command();
        #[cfg(feature = "debug")]
        command_manager.debug_command();
        command_manager
    }

    fn movement_command(&mut self) {
        self.register(
            "droite",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("droite", _c, server, _arg);
                if let Some(client) = server._clients.get_mut(&_c) {
                    server
                        ._game
                        .change_player_orientation(client, "droite".into());
                    let _ = client
                        .get_socket_mut()
                        .write(format!("{}", define::R_OK).as_bytes());
                    server.send_to_graph += &graphic::player_pos(client);
                }
            },
        );
        self.register(
            "gauche",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("gauche", _c, server, _arg);
                if let Some(client) = server._clients.get_mut(&_c) {
                    server
                        ._game
                        .change_player_orientation(client, "gauche".into());
                    let _ = client
                        .get_socket_mut()
                        .write(format!("{}", define::R_OK).as_bytes());
                    server.send_to_graph += &graphic::player_pos(client);
                }
            },
        );
        self.register(
            "avance",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("avance", _c, server, _arg);
                let client = server._clients.get_mut(&_c);
                if client.is_none() {
                    #[cfg(feature = "log")]
                    println!("No client found for token {:?}", _c);
                    return;
                }
                let client: &mut Client = client.unwrap();
                server._game.move_player(client);
                client.position = server._game.get_player_position(_c);
                let _ = client
                    .get_socket_mut()
                    .write(format!("{}", define::R_OK).as_bytes());
                server.send_to_graph += &graphic::player_pos(client);
            },
        );
    }

    #[cfg(feature = "debug")]
    fn debug_command(&mut self) {
        self.register(
            "position",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                let client = server._clients.get_mut(&_c).unwrap();
                let _ = client.get_socket().write(
                    format!(
                        "command {} recived {{{}}}\n{} {}",
                        "position", _arg, client.position.0, client.position.1
                    )
                    .as_bytes(),
                );
                println!("command {} recived {{{}}} {:?}", "position", _arg, _c);
            },
        );
        self.register(
            "death",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                utils::debug_manager_register("death", _c, server, _arg);
                server.disconnect_client_by_token(&_c);
            },
        );
    }

    fn default_command(&mut self) {
        self.register("voir", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            utils::debug_manager_register("voir", _c, server, _arg);
            let client = server._clients.get_mut(&_c);
            if client.is_none() {
                #[cfg(feature = "log")]
                println!("No client found for token {:?}", _c);
                return;
            }
            let client = client.unwrap();
            let visible_cells =
                server
                    ._game
                    .get_visible_cells(client.position, client.orientation, client.level);
            #[cfg(feature = "log")]
            println!("{:?}", visible_cells);
            let response = format!("{{{}}}\n", visible_cells.join(", "));
            let _ = client.get_socket_mut().write(response.as_bytes());
        });
        self.register(
            "inventaire",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("inventaire", _c, server, _arg);
                let client = server._clients.get_mut(&_c);
                if client.is_none() {
                    #[cfg(feature = "log")]
                    println!("No client found for token {:?}", _c);
                    return;
                }
                let client = client.unwrap();
                let inventory = client.get_inventory();
                let _ = client.get_socket_mut().write(
                    format!(
                        "{{{} {}, {} {}, {} {}, {} {}, {} {}, {} {}, {} {}}}\n",
                        define::FOOD,
                        inventory[define::FOOD_INV],
                        define::T1_MAT,
                        inventory[define::T1_MAT_INV],
                        define::T2_MAT,
                        inventory[define::T2_MAT_INV],
                        define::T3_MAT,
                        inventory[define::T3_MAT_INV],
                        define::T4_MAT,
                        inventory[define::T4_MAT_INV],
                        define::T5_MAT,
                        inventory[define::T5_MAT_INV],
                        define::T6_MAT,
                        inventory[define::T6_MAT_INV]
                    )
                    .as_bytes(),
                );
            },
        );

        self.register(
            "prend",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("prend", _c, server, _arg);
                let mut sucess: bool = false;
                if let Some(client) = server._clients.get_mut(&_c) {
                    if server._game.take_item_from_cell(client, _arg) {
                        let _ = client
                            .get_socket_mut()
                            .write(format!("{}", define::R_OK).as_bytes());
                        sucess = true;
                    } else {
                        let _ = client
                            .get_socket_mut()
                            .write(format!("{}", define::R_KO).as_bytes());
                    }
                }
                if sucess {
                    server.send_to_graph +=
                        &graphic::event_take_an_item(server, &_c, define::ITEMS_DICT[_arg]);
                }
            },
        );
        self.register("pose", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            utils::debug_manager_register("pose", _c, server, _arg);
            let mut sucess: bool = false;
            if let Some(client) = server._clients.get_mut(&_c) {
                if server._game.put_item_on_cell(client, _arg) {
                    let _ = client
                        .get_socket_mut()
                        .write(format!("{}", define::R_OK).as_bytes());
                    sucess = true;
                } else {
                    let _ = client
                        .get_socket_mut()
                        .write(format!("{}", define::R_KO).as_bytes());
                }
            }
            if sucess {
                server.send_to_graph +=
                    &graphic::event_drop_an_item(server, &_c, define::ITEMS_DICT[_arg]);
            }
        });
        self.register(
            "expulse",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("expulse", _c, server, _arg);
                if expulse_player(server, _c) {
                    let _ = server
                        ._clients
                        .get_mut(&_c)
                        .unwrap()
                        .get_socket_mut()
                        .write(format!("{}", define::R_OK).as_bytes());
                } else {
                    let _ = server
                        ._clients
                        .get_mut(&_c)
                        .unwrap()
                        .get_socket_mut()
                        .write(format!("{}", define::R_KO).as_bytes());
                }
            },
        );
        self.register(
            "broadcast",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("broadcast", _c, server, _arg);
                // Broadcast the message to all clients

                let tmp = server._game.map.player_position.get(&_c);
                if tmp.is_none() {
                    #[cfg(feature = "log")]
                    println!("No player found for token {:?}", _c);
                    return;
                }
                let (position_x, position_y) = tmp.unwrap();

                let _ = server
                    ._clients
                    .get_mut(&_c)
                    .unwrap()
                    .get_socket_mut()
                    .write(format!("{}", define::R_OK).as_bytes());
                for (token, client) in &mut server._clients {
                    if token != &_c {
                        let dir = client.orientation;
                        let tmp = server._game.map.player_position.get(token);
                        if tmp.is_none() {
                            #[cfg(feature = "log")]
                            println!("No player found for token {:?}", token);
                            continue;
                        }
                        let (target_x, target_y) = tmp.unwrap();
                        let _ = client.get_socket_mut().write(
                            format!(
                                "message {},{}\n",
                                get_message_transmission_direction_orientation(
                                    *position_x as i32,
                                    *position_y as i32,
                                    *target_x as i32,
                                    *target_y as i32,
                                    server._game.map.get_width() as i32,
                                    server._game.map.get_height() as i32,
                                    dir
                                ),
                                _arg
                            )
                            .as_bytes(),
                        );
                    }
                }
                server.send_to_graph += &graphic::player_broadcast(&_c, _arg);
            },
        );
        self.register(
            "incantation",
            |_c: mio::Token, _server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("incantation", _c, _server, _arg);
            },
        );
        self.register(
            "incantation_internal",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("incantation_internal", _c, server, _arg);
                #[cfg(feature = "log")]
                println!("\n\nincantation_internal for token {:?}\n\n", _c);
                let org_player_level = server._clients.get(&_c).unwrap().level;
                let sucess = server.incantation_success(_c);
                if server._incantation_list.contains_key(&_c) {
                    let mut victory = String::new();
                    let Some(tkn_list) = server._incantation_list.get(&_c) else {
                        return;
                    };
                    for client in tkn_list {
                        let client = server._clients.get_mut(client);
                        if client.is_none() {
                            #[cfg(feature = "log")]
                            println!("No client found for token {:?}", _c);
                            continue;
                        }
                        let client = client.unwrap();
                        client.is_incanting = Token(0);
                        if sucess {
                            if client.level <= org_player_level {
                                client.level = org_player_level + 1;
                            }
                        }
                        let level_to_send = client.level;

                        let _ = client
                            .get_socket_mut()
                            .write(format!("niveau actuel : {}\n", level_to_send).as_bytes());
                    }
                    if sucess && org_player_level + 1 == 8 {
                        for player in server._incantation_list.get(&_c).unwrap() {
                            if server.check_win_condition(player) {
                                victory = graphic::end_game(server.get_team_for_player(player));
                                break;
                            }
                        }
                    }
                    if !victory.is_empty() {
                        graphic::send_graphic_clients(victory, server);
                        println!("Team {} wins!", server.get_team_for_player(&_c));
                        println!("{:?}", server._game.team[&server.get_team_for_player(&_c)]);
                        std::thread::sleep(std::time::Duration::from_secs(1)); // wait for the message to be sent to all clients before exiting the game
                        server::exit_game(server);
                    }
                    let send_to_graph: String = graphic::event_incant_end(server, sucess, _c);
                    server.send_to_graph += &send_to_graph;
                }
            },
        );

        self.register(
            "connect_nbr",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("connect_nbr", _c, server, _arg);
                let tmp = server.get_team_for_player(&_c);
                let d: u32;
                if server._max_clients[&tmp] < server._game.team[&tmp].len() as u32 {
                    d = 0;
                } else {
                    d = server._max_clients[&tmp] - server._game.team[&tmp].len() as u32;
                }
                let client = server._clients.get_mut(&_c);
                if client.is_none() {
                    #[cfg(feature = "log")]
                    println!("No client found for token {:?}", _c);
                    return;
                }
                let client = client.unwrap();
                let _ = client.get_socket_mut().write(format!("{}\n", d).as_bytes());
            },
        );
    }

    fn fork_command(&mut self) {
        self.register("fork", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            utils::debug_manager_register("fork", _c, server, _arg);
            let client = server._clients.get_mut(&_c);
            if client.is_none() {
                #[cfg(feature = "log")]
                println!("No client found for token {:?}", _c);
                return;
            }
            let client = client.unwrap();

            //debut de fork
            server.send_to_graph += &graphic::fork(&client.token);
        });
        self.register(
            "spawning",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("spawning", _c, server, _arg);
                //player hatch
                if server._clients.contains_key(&_c) {
                    server.send_to_graph += &graphic::egg_hatches(&_c, server);
                }
                if let Some(client) = server._clients.get_mut(&_c) {
                    client.inventory[0] = 1260;
                    client.level = 1;
                    //oeuf retirer ici en cas d'eclosion avec client lié
                    server._game.map.egg_position.remove(&client.was_egg);
                    client.was_egg = 0;
                }
            },
        );
        self.register(
            "end_fork",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("end_fork", _c, server, _arg);
                let team = server.get_team_for_player(&_c);
                let client = server._clients.get_mut(&_c);
                if client.is_none() {
                    #[cfg(feature = "log")]
                    println!("No client found for token {:?}", _c);
                    return;
                }
                let client = client.unwrap();
                let _ = client
                    .get_socket_mut()
                    .write(format!("{}", define::R_OK).as_bytes());
                let (x, y) = client.position;
                server._game.map.egg_position.insert(
                    server._game.map.egg_id_counter,
                    (x, y, team.clone(), server._game._tick + 600, false),
                );
                server._game.map.egg_id_counter += 1;
                if let Some(max_player) = server._max_clients.get_mut(&team) {
                    *max_player += 1;
                }
                server.send_to_graph +=
                    &graphic::end_fork(team, server._game.map.egg_id_counter - 1, x, y);
                //end fork
            },
        );
    }

    fn admin_command(&mut self) {
        self.register(
            "status",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("status", _c, server, _arg);
                let len = server.get_clients_by_type(define::ROLE_PLAYER).len();
				let graphics = server.get_clients_by_type(define::ROLE_GRAPHIC).len();
				let admins = server.get_clients_by_type(define::ROLE_ADMIN).len();
                let teams = server._game.team.keys().cloned().collect::<Vec<String>>();
                let ticks = server._ticks;
                let tick = server._game._tick;
                let width = server._game.map.get_width();
                let height = server._game.map.get_height();
				let player_by_team: HashMap<String, usize> = server
					._game
					.team
					.iter()
					.map(|(team_name, player_tokens)| (team_name.clone(), player_tokens.len()))
					.collect();
				let max_players_by_team: HashMap<String, u32> = server
					._max_clients
					.iter()
					.map(|(team_name, max_players)| (team_name.clone(), *max_players))
					.collect();

                let response = format!(
                    "Server status:\nTick/s: {}\nTicks since game started : {}\nPlayers: {}\nGraphics clients: {}\nAdmins: {}\nTeams: {:?}\nMap size: {}x{}\nPlayers by team: {:?}\nMax players by team: {:?}\n",
                    ticks, tick, len, graphics, admins, teams, width, height, player_by_team, max_players_by_team
                );
                for client in server.get_clients_by_type_mut(define::ROLE_ADMIN) {
                    let _ = client.get_socket_mut().write(response.as_bytes());
                }
            },
        );
        self.register("tick", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            utils::debug_manager_register("tick", _c, server, _arg);
            if _arg.parse::<u32>().is_ok() && _arg.parse::<u64>().unwrap() < 120 && _arg.parse::<u64>().unwrap() != 0 {
                let arg = _arg.parse::<u64>().unwrap();
                server.set_ticks(arg);
                for client in server.get_clients_by_type_mut(define::ROLE_ADMIN) {
                    let _ = client
                        .get_socket_mut()
                        .write(format!("A admin change the tick to {}\n", _arg).as_bytes());
                }
            } else {
                for client in server.get_clients_by_type_mut(define::ROLE_ADMIN) {
                    let _ = client.get_socket_mut().write(
                        format!(
                            "A admin try to set tick with a {} argument, bully them !\n",
                            _arg
                        )
                        .as_bytes(),
                    );
                }
            }
            let tick = server.get_ticks();
            graphic::send_graphic_clients(graphic::get_time_unit(tick), server);
        });
        self.register("stop", |_c: mio::Token, server: &mut Server, _arg: &str| {
            let mut to_disconnect: Vec<mio::Token> = Vec::new();
            for client in server.get_clients_by_type_mut("player") {
                let _ = client
                    .get_socket_mut()
                    .write(format!("{}\n", "mort").as_bytes());
                to_disconnect.push(client.get_token());
            }
            for token in to_disconnect {
                server.disconnect_client_by_token(&token);
            }
            std::thread::sleep(std::time::Duration::from_secs(1)); // Give clients time to receive the message before shutting down
            panic!("\nServer stopped by admin command\nByebye! 😉\n");
        });
        self.register("kick", |_c: mio::Token, server: &mut Server, _arg: &str| {
            let target_token = _arg.parse::<u128>();
            if target_token.is_err() {
                #[cfg(feature = "log")]
                println!("Invalid token provided for kick command: {}", _arg);
                return;
            }
            let target_token = mio::Token(target_token.unwrap() as usize);
            let client = server._clients.get_mut(&target_token);
            if client.is_none() {
                #[cfg(feature = "log")]
                println!("No client found for token {:?}", target_token);
                return;
            }
            let client = client.unwrap();
            let _ = client
                .get_socket_mut()
                .write(format!("{}\n", "mort").as_bytes());
            server.send_to_graph += &graphic::player_death(&target_token);
            server.disconnect_client_by_token(&target_token);
        });
    }

    pub fn process_queue(&mut self, server: &mut Server) {
        let tokens: Vec<Token> = self.order.keys().cloned().collect();
        for token in tokens {
            if self.order.contains_key(&token) && self.next_execute.contains_key(&token) {
                if let Some((command, tkn, arg)) =
                    self.order.get(&token).and_then(|queue| queue.front())
                {
                    if self.next_execute.get(&token).unwrap() <= &server._game._tick {
                        let _ = match command.as_str() {
                            "voir" | "prend" | "pose" | "droite" | "gauche" | "avance"
                            | "expulse" | "broadcast" => {
                                self.next_execute.insert(token, server._game._tick + 7)
                            }
                            "inventaire" => self.next_execute.insert(token, server._game._tick + 1),
                            "fork" => self.next_execute.insert(token, server._game._tick),
                            "egg_death" => self.next_execute.insert(token, server._game._tick),
                            "connect_nbr" | "incantation" | "incantation_internal" | "end_fork" => {
                                self.next_execute.insert(token, server._game._tick)
                            }
                            _ => None,
                        };
                        if token == mio::Token(0) || !server._clients.get(&token).is_none() {
                            self.execute(&command, *tkn, &arg, server);
                        }
                        // Only pop the command if it was not handled by the match arms above
                        if command.as_str() == "incantation" {
                            if let Some(&(x, y)) = server._game.map.player_position.get(tkn) {
                                if (self.order.entry(token).or_insert_with(VecDeque::new))
                                    .is_empty()
                                    == false
                                {
                                    self.order.get_mut(&token).unwrap().pop_front();
                                }
                                let player_incanting: Vec<Token> = server
                                    ._game
                                    .map
                                    .player_position
                                    .iter()
                                    .filter(|(tok, pos)| {
                                        *pos == &(x, y)
                                            && server._clients.get(tok).is_some()
                                            && server._clients.get(tok).unwrap().is_incanting
                                                == Token(0)
                                            && server._clients.get(tok).unwrap().level
                                                == server._clients.get(&token).unwrap().level
                                    })
                                    .map(|(tok, _)| *tok)
                                    .collect();
                                server
                                    ._incantation_list
                                    .insert(token, player_incanting.clone());
                                for player in &player_incanting {
                                    if self.next_execute.get(&player).is_none() {
                                        self.next_execute.insert(*player, 0);
                                    }
                                    self.next_execute.insert(*player, server._game._tick + 300);
                                    self.add_to_queue_internal(
                                        "incantation_internal".to_string(),
                                        *player,
                                        "".to_string(),
                                    );
                                    let client = server._clients.get_mut(&player);
                                    if client.is_none() {
                                        #[cfg(feature = "log")]
                                        println!("No client found for token {:?}", player);
                                        return;
                                    }
                                    let client = client.unwrap();
                                    let _ = client
                                        .get_socket_mut()
                                        .write(format!("{}\n", "elevation en cours").as_bytes());
                                    client.is_incanting = token;
                                }
                                server.send_to_graph +=
                                    &graphic::start_incant(player_incanting, token, server);
                            }
                        } else if command.as_str() == "fork" {
                            self.order.get_mut(&token).unwrap().pop_front();
                            self.add_to_queue_internal(
                                "end_fork".to_string(),
                                token,
                                "".to_string(),
                            );
                            self.next_execute.insert(token, server._game._tick + 42);
                        } else {
                            self.order.get_mut(&token).unwrap().pop_front();
                        }
                    }
                }
            }
        }
        graphic::send_graphic_clients(server.send_to_graph.clone(), server);
        server.send_to_graph.clear();
    }
}

fn distance_along_wrapped_dimension(p1: i32, p2: i32, dim: i32) -> i32 {
    let mut d;

    d = p2 - p1;
    if d.abs() > dim / 2 {
        d = dim - d.abs();
        if p2 > p1 {
            d *= -1;
        }
    }
    return d;
}

fn point_to_greater_abs_value(a: i32, b: i32) -> i32 {
    if a.abs() == b.abs() {
        return 0;
    } else if a.abs() > b.abs() {
        return a;
    } else {
        return b;
    }
}

fn expulse_player(server: &mut Server, token: Token) -> bool {
    let position = server._game.get_player_position(token);
    let mut expelled = false;
    let next_pos = match server._clients.get(&token) {
        Some(client) => match client.orientation {
            'N' => (
                position.0,
                if position.1 != 0 {
                    (position.1 - 1) % server._game.map.get_height()
                } else {
                    server._game.map.get_height() - 1
                },
            ),
            'E' => ((position.0 + 1) % server._game.map.get_width(), position.1),
            'S' => (position.0, (position.1 + 1) % server._game.map.get_height()),
            'O' => (
                if position.0 != 0 {
                    (position.0 - 1) % server._game.map.get_width()
                } else {
                    server._game.map.get_width() - 1
                },
                position.1,
            ),
            _ => position,
        },
        _ => position,
    };

    let dir = get_message_transmission_direction(
        position.0 as i32,
        position.1 as i32,
        next_pos.0 as i32,
        next_pos.1 as i32,
        server._game.map.get_width() as i32,
        server._game.map.get_height() as i32,
    );

    let mut players = server.get_clients_by_pos_mut(position);
    for player in players.iter_mut() {
        if player.token != token {
            player.position = next_pos;
            let _ = player
                .get_socket_mut()
                .write(format!("kick {}\n", dir).as_bytes());
            expelled = true;
        }
    }
    let send_to_graph: String = graphic::event_fus_ro_dah(players, token);
    server.send_to_graph += &send_to_graph;

    expelled
}

fn get_message_transmission_direction(
    sourcex: i32,
    sourcey: i32,
    destx: i32,
    desty: i32,
    map_height: i32,
    map_width: i32,
) -> i32 {
    let dx;
    let dy;
    let larger_delta;
    dx = distance_along_wrapped_dimension(sourcex, destx, map_width);
    dy = distance_along_wrapped_dimension(sourcey, desty, map_height);
    larger_delta = point_to_greater_abs_value(dx, dy);
    if dx == 0 && dy == 0 {
        return 0;
    }
    if larger_delta == dy {
        if dy > 0 {
            return 1;
        }
        return 5;
    }
    if larger_delta == 0 {
        if dx > 0 {
            if dy > 0 {
                return 2;
            }
            return 4;
        }
        return 6;
    }
    if larger_delta == dx {
        if dy > 0 {
            return 3;
        }
        return 7;
    }
    return 8;
}

fn get_message_transmission_direction_orientation(
    sourcex: i32,
    sourcey: i32,
    destx: i32,
    desty: i32,
    map_height: i32,
    map_width: i32,
    orientation: char,
) -> i32 {
    let dx;
    let dy;
    let larger_delta;
    dx = distance_along_wrapped_dimension(sourcex, destx, map_width);
    dy = distance_along_wrapped_dimension(sourcey, desty, map_height);
    larger_delta = point_to_greater_abs_value(dx, dy);
    if dx == 0 && dy == 0 {
        return 0;
    }
    let dir = match orientation {
        'N' => 0,
        'E' => 2,
        'S' => 4,
        'O' => 6,
        _ => 0, // Default case, should not happen if orientation is always valid
    };
    if larger_delta == dy {
        if dy > 0 {
            return 1 + dir;
        }
        return (5 + dir) % 8;
    }
    if larger_delta == 0 {
        if dx > 0 {
            if dy > 0 {
                return 2 + dir;
            }
            if dir == 4 {
                return 8;
            }
            return (4 + dir) % 8;
        }
        if dir == 2 {
            return 8;
        }
        return (6 + dir) % 8;
    }
    if larger_delta == dx {
        if dy > 0 {
            return (3 + dir) % 8;
        }
        return (7 + dir) % 8;
    }
    if dir == 0 {
        return 8;
    }
    return dir;
}
