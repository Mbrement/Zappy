use crate::server;
use crate::server::utils::debug_manager_register;
use crate::server::{Server, define, utils};
use crate::server::{client, graphic};
use mio::Token;
use std::collections::{HashMap, VecDeque};
use std::io::Write;
use std::process;

pub type CommandFn = Box<dyn Fn(mio::Token, &mut Server, &str)>;
pub type CommandArgs = (String, mio::Token, String);
pub struct CommandManager {
    order: HashMap<Token, VecDeque<CommandArgs>>,
    pub(crate) next_execute: HashMap<Token, u128>,
    egg_waiting: HashMap<String, Vec<u128>>,
    commands: HashMap<String, CommandFn>,
}

impl CommandManager {
    pub fn new() -> Self {
        Self {
            order: HashMap::new(),
            next_execute: HashMap::new(),
            commands: HashMap::new(),
            egg_waiting: HashMap::new(),
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
        if self.order.entry(token).or_insert_with(VecDeque::new).len() < 10 {
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

    // This function is used to add commands to the queue without checking if the command is valid. it pop the current command in the queue and replace it with the new one

    pub fn add_to_queue_admin(&mut self, name: String, arg: String) {
        let token: mio::Token = mio::Token(0); // Admin token
        self.order
            .entry(token)
            .or_insert_with(VecDeque::new)
            .push_back((name.clone(), token, arg.clone()));
    }

    pub(crate) fn add_to_queue_internal(&mut self, name: String, token: mio::Token, arg: String) {
        // #[cfg(feature = "log")]
        // println!(
        //     "Try to dded command '{}' to queue for token {:?} withargs: {}. queu len : {}",
        //     name,
        //     token,
        //     arg.clone(),
        //     self.order.entry(token).or_insert_with(VecDeque::new).len()
        // );
        // if !define::COMMANDLIST.contains(&name.as_str()) {			//keep this commented
        //     return;
        // }
        // if self.order.entry(token).or_insert_with(VecDeque::new).len() {

        self.order
            .entry(token)
            .or_insert_with(VecDeque::new)
            // .push_back((name.clone(), token, arg.clone()));
            .push_front((name.clone(), token, arg.clone()));
        // if self.next_execute.entry(token).or_insert(0) == &0 {
        //     self.next_execute.insert(token, 0);
        // }
        // }
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
    pub fn new_server(server: &mut Server) -> Self {
        let mut command_manager = CommandManager::new();

        command_manager.admin_command(server);
        command_manager.movement_command(server);
        command_manager.default_command(server);
        command_manager.fork_command(server);
        #[cfg(feature = "debug")]
        command_manager.debug_command(server);
        command_manager
    }

    fn movement_command(&mut self, server: &mut Server) {
        self.register(
            "droite",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                // _game.change_player_orientation(_c, "droite".into());
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
                debug_manager_register("avance", _c, server, _arg);
                let mut client = server._clients.get_mut(&_c);
                if client.is_none() {
                    #[cfg(feature = "log")]
                    println!("No client found for token {:?}", _c);
                    return;
                }
                let client = client.unwrap();
                server._game.move_player(client);
                // ? pourquoi la ligne suivante quand tu actualise déjà la position du joueur
                //   dans la fonction précédente?
                client.position = server._game.get_player_position(_c);
                let _ = client
                    .get_socket_mut()
                    .write(format!("{}", define::R_OK).as_bytes());
                server.send_to_graph += &graphic::player_pos(client);
            },
        );
    }

    fn debug_command(&mut self, server: &mut Server) {
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

    fn default_command(&mut self, server: &mut Server) {
        self.register("voir", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            utils::debug_manager_register("voir", _c, server, _arg);
            let mut client = server._clients.get_mut(&_c);
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
            let carrote = client.get_socket_mut().write(response.as_bytes());
        });
        self.register(
            "inventaire",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("inventaire", _c, server, _arg);
                let mut client = server._clients.get_mut(&_c);
                if client.is_none() {
                    #[cfg(feature = "log")]
                    println!("No client found for token {:?}", _c);
                    return;
                }
                let client = client.unwrap();
                let inventory = client.get_inventory();
                client.get_socket_mut().write(
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
                // doublon ?
                //if tmp.is_none() {
                //    #[cfg(feature = "log")]
                //    println!("No player found for token {:?}", _c);
                //    return;
                //}
                // server._clients va envoyer a tous les clients dont ADMIN et graphic
                // utilise plutot ca : get_clients_by_type_mut(define::ROLE_PLAYER)
                server
                    ._clients
                    .get_mut(&_c)
                    .unwrap()
                    .get_socket_mut()
                    .write(format!("{}", define::R_OK).as_bytes());
                for (token, client) in &mut server._clients {
                    if token != &_c {
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
                                get_message_transmission_direction(
                                    *position_x as i32,
                                    *position_y as i32,
                                    *target_x as i32,
                                    *target_y as i32,
                                    server._game.map.get_width() as i32,
                                    server._game.map.get_height() as i32
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
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("incantation", _c, server, _arg);
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
                    //il faut vérifier pour chacune des teams qui ont un membre qui est passé lvl8 lors de l'incantation
                    //proposition de solution:
                    for player in server._incantation_list.get(&_c).unwrap() {
                        if sucess && org_player_level + 1 == 8 && server.check_win_condition(player)
                        {
                            victory = graphic::end_game(server.get_team_for_player(player));
                        }
                    }
                    if !victory.is_empty() {
                        graphic::send_graphic_clients(victory, server);
                        server::exit_game(server);
                    }
                    /*
                    if sucess && org_player_level + 1 == 8 && server.check_win_condition(&_c) {
                        server::exit_game(server);
                    }*/
                    for client in server._incantation_list.get(&_c) {
                        if !client.contains(&_c) {
                            #[cfg(feature = "log")]
                            println!("No client found for token {:?}", client);
                            continue;
                        }
                        let client = client.get(0).unwrap();
                        let mut client = server._clients.get_mut(client);
                        if client.is_none() {
                            #[cfg(feature = "log")]
                            println!("No client found for token {:?}", _c);
                            return;
                        }
                        let client = client.unwrap();
                        client.is_incanting = false;
                        if sucess {
                            if client.level < org_player_level {
                                client.level = org_player_level + 1;
                            }
                            let level_to_send = client.level;
                            let _ = client
                                .get_socket_mut()
                                .write(format!("niveau actuel : {}\n", level_to_send).as_bytes());
                        }
                    }
                    //graphic::event_incant_end(server, sucess, _c);
                    let send_to_graph: String = graphic::event_incant_end(server, sucess, _c);
                    server.send_to_graph += &send_to_graph;
                }
            },
        );

        self.register(
            "connect_nbr",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                // #[cfg(feature = "log")]
                utils::debug_manager_register("connect_nbr", _c, server, _arg);
                let tmp = server.get_team_for_player(&_c);
                let d = server._max_clients[&tmp] - server._game.team[&tmp].len() as u32;
                let mut client = server._clients.get_mut(&_c);
                if client.is_none() {
                    #[cfg(feature = "log")]
                    println!("No client found for token {:?}", _c);
                    return;
                }
                let client = client.unwrap();
                let _ = client.get_socket_mut().write(format!("{}\n", d).as_bytes()); // TODO check error here
            },
        );
    }

    fn fork_command(&mut self, server: &mut Server) {
        self.register("fork", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            utils::debug_manager_register("fork", _c, server, _arg);
            // server._game.fork_player(_c);
            let mut client = server._clients.get_mut(&_c);
            if client.is_none() {
                #[cfg(feature = "log")]
                println!("No client found for token {:?}", _c);
                return;
            }
            let client = client.unwrap();
            let (x, y) = client.position;
            server._game.map.egg_position.insert(
                server._game.map.egg_id_counter,
                (x, y, client.get_token(), server._game._tick),
            );
            server._game.map.egg_id_counter += 1;
            client
                .get_socket_mut()
                .write(format!("{}", define::R_OK).as_bytes());

            //debut de fork
            server.send_to_graph += &graphic::fork(&client.token);
        });
        self.register(
            "spawning",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                utils::debug_manager_register("spawning", _c, server, _arg);
                //player hatch
                let mut client = server._clients.get_mut(&_c).unwrap();
                //client.hunger = 1260; //this line scare me
                client.inventory[0] = 1260;
                client.was_egg = _arg.parse().unwrap_or(0);
                server.send_to_graph += &graphic::egg_hatches(&_c, server);
            },
        );
        self.register(
            "egg_waiting",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("egg_waiting", _c, server, _arg);
                for (egg_id, (x, y, token, tick)) in &server._game.map.egg_position {
                    if tick < &server._game._tick {
                        let team_name = server.get_team_for_player(&token);
                        let tmp = server._max_clients.get_mut(&team_name);
                        if let Some(v) = tmp {
                            *v += 1;
                        }
                        server.send_to_graph += &graphic::end_fork(&token, *egg_id, *x, *y);
                    }
                }
                //end fork
            },
        );
        self.register(
            "egg_death",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("egg_death", _c, server, _arg);
                // Collect ticks to remove first to avoid mutably borrowing egg_position
                let mut ticks_to_remove: Vec<u128> = Vec::new();
                for (egg_id, (x, y, token, tick)) in server._game.map.egg_position.iter() {
                    if tick < &server._game._tick {
                        let team_name = server.get_team_for_player(&token);
                        let tmp = server._max_clients.get_mut(&team_name);
                        if let Some(v) = tmp {
                            if *v > server._max_clients_per_team {
                                *v -= 1;
                            }
                        }
                        ticks_to_remove.push(*egg_id);
                        break;
                    }
                }
                for t in ticks_to_remove {
                    server.send_to_graph += &graphic::rotten_egg(t);
                    server._game.map.egg_position.remove(&t);
                }
            },
        );
    }

    fn admin_command(&mut self, server: &mut Server) {
        self.register(
            "status",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("status", _c, server, _arg);
                // Collect immutable data before taking a mutable borrow of the client map
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
				println!("{:?}", server._game.team);
                for client in server.get_clients_by_type_mut(define::ROLE_ADMIN) {
                    let _ = client.get_socket_mut().write(response.as_bytes());
                }
            },
        );
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
            let mut client = server._clients.get_mut(&target_token);
            if client.is_none() {
                #[cfg(feature = "log")]
                println!("No client found for token {:?}", target_token);
                return;
            }
            let client = client.unwrap();
            let _ = client
                .get_socket_mut()
                .write(format!("{}\n", "mort").as_bytes());
            server.disconnect_client_by_token(&target_token);
        });
    }

    pub fn process_queue(&mut self, server: &mut Server) {
        let mut tokens: Vec<Token> = self.order.keys().cloned().collect();
        for token in tokens {
            if self.order.contains_key(&token) && self.next_execute.contains_key(&token) {
                if let Some((command, tkn, arg)) =
                    self.order.get(&token).and_then(|queue| queue.front())
                {
                    if self.next_execute.get(&token).unwrap() <= &server._game._tick {
                        let res = match command.as_str() {
                            "voir" | "prend" | "pose" | "droite" | "gauche" | "avance"
                            | "expulse" | "broadcast" => {
                                self.next_execute.insert(token, server._game._tick + 7)
                            }
                            "inventaire" => self.next_execute.insert(token, server._game._tick + 1),
                            "fork" => self.next_execute.insert(token, server._game._tick + 42),
                            "incantation_internal" => {
                                self.next_execute.insert(token, server._game._tick + 300)
                            }
                            "egg_waiting" => {
                                self.next_execute.insert(token, server._game._tick + 42)
                            }
                            "egg_death" => self.next_execute.insert(token, server._game._tick),
                            "connect_nbr" | "incantation" => {
                                self.next_execute.insert(token, server._game._tick)
                            }
                            _ => None,
                        };
                        if (token == mio::Token(0) || !server._clients.get(&token).is_none()) {
                            self.execute(&command, *tkn, &arg, server);
                        }
                        //TODO-mrozniec: recup command
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
                                            && !server._clients.get(tok).unwrap().is_incanting
                                    })
                                    .map(|(tok, _)| *tok)
                                    .collect();
                                for player in &player_incanting {
                                    if (self.next_execute.get(&player).is_none()) {
                                        self.next_execute.insert(*player, 0);
                                    }
                                    self.next_execute
                                        .insert(*player, self.next_execute[&player] + 300);
                                    self.add_to_queue_internal(
                                        "incantation_internal".to_string(),
                                        *player,
                                        "".to_string(),
                                    );
                                    let mut client = server._clients.get_mut(&player);
                                    if client.is_none() {
                                        #[cfg(feature = "log")]
                                        println!("No client found for token {:?}", player);
                                        return;
                                    }
                                    let client = client.unwrap();
                                    let _ = client
                                        .get_socket_mut()
                                        .write(format!("{}\n", "elevation en cours").as_bytes());
                                    client.is_incanting = true;
                                }
                                server.send_to_graph +=
                                    &graphic::start_incant(player_incanting, token, server);
                            }
                            // self.add_to_queue_internal(
                            //     "incantation_internal".to_string(),
                            //     *tkn,
                            //     "".to_string(),
                            // );
                        } else if command.as_str() == "fork" {
                            // For fork, we want to add the new command to the front of the queue, so we use add_to_queue_internal

                            self.egg_waiting
                                .entry(server.get_team_for_player(&token))
                                .or_insert_with(Vec::new)
                                .push(server._game._tick + 642);
                            self.order.get_mut(&token).unwrap().pop_front();
                            self.add_to_queue_internal(
                                "egg_waiting".to_string(),
                                token,
                                "".to_string(),
                            );
                            // println!("{} {}", server._game._tick, self.next_execute.get(token));
                            self.next_execute.insert(token, server._game._tick + 42);
                        } else {
                            self.order.get_mut(&token).unwrap().pop_front();
                        }
                    }
                }
            }
        }
        // self.execute_admin_commands(server);
        let mut egg_remove = Vec::new();
        for (team, eggs) in self.egg_waiting.iter() {
            for egg in eggs {
                if *egg <= server._game._tick {
                    self.execute("egg_death", mio::Token(0), team, server);
                    egg_remove.push(egg.clone());
                    break;
                }
            }
        }
        for egg in egg_remove {
            self.egg_waiting.iter_mut().for_each(|(_team, eggs)| {
                eggs.retain(|e| e != &egg);
            });
        }
        graphic::send_graphic_clients(server.send_to_graph.clone(), server);
        server.send_to_graph.clear();
    }

    // fn execute_admin_commands(&mut self, server: &mut Server) {
    // 	let token = mio::Token(0);
    // 	for command in self.order[token]{}

    // 	}

    // }

    pub fn next_command_time(&self, token: &Token) -> Option<u128> {
        self.next_execute.get(token).cloned()
    }
    pub fn set_next_command_time(&mut self, token: Token, time: u128) {
        self.next_execute.insert(token, time);
    }
}

fn distance_along_wrapped_dimension(p1: i32, p2: i32, dim: i32) -> i32 {
    let mut d;

    d = p2 - p1;
    if (d.abs() > dim / 2) {
        d = dim - d.abs();
        if (p2 > p1) {
            d *= -1;
        }
    }
    return (d);
}

fn point_to_greater_abs_value(a: i32, b: i32) -> i32 {
    if (a.abs() == b.abs()) {
        return (0);
    } else if (a.abs() > b.abs()) {
        return (a);
    } else {
        return (b);
    }
}

fn expulse_player(server: &mut Server, token: Token) -> bool {
    let position = server._game.get_player_position(token);
    let mut expelled = false;
    let next_pos = match server._clients.get(&token) {
        Some(client) => match client.orientation {
            'N' => (position.0, position.1.saturating_sub(1)),
            'E' => (position.0 + 1, position.1),
            'S' => (position.0, position.1 + 1),
            'O' => (position.0.saturating_sub(1), position.1),
            _ => position,
        },
        None => position,
    };
    /*
    let others: Vec<Token> = server
        ._game
        .map
        .player_position
        .iter()
        .filter(|(other_token, other_pos)| *other_token != &token && *other_pos == &position)
        .map(|(t, _)| *t)
        .collect();*/

    let dir = get_message_transmission_direction(
        position.0 as i32,
        position.1 as i32,
        next_pos.0 as i32,
        next_pos.1 as i32,
        server._game.map.get_width() as i32,
        server._game.map.get_height() as i32,
    );
    /*
    for other_token in others {
        if let Some(other_client) = server._clients.get_mut(&other_token) {
            other_client.position = next_pos;
            let _ = other_client
                .get_socket_mut()
                .write(format!("kick {}\n", dir).as_bytes());
        }
        expelled = true;
    }*/

    // j'ai fait une fonction pour récupérer les clients en fonction de leur position, utilise la
    let mut players = server.get_clients_by_pos_mut(position);
    for player in players.iter_mut() {
        if (player.token != token) {
            player.position = next_pos;
            player
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

    // println!("src {} {} dest {} {}", sourcex, sourcey, destx, desty);
    dx = distance_along_wrapped_dimension(sourcex, destx, map_width);
    dy = distance_along_wrapped_dimension(sourcey, desty, map_height);
    larger_delta = point_to_greater_abs_value(dx, dy);
    if (dx == 0 && dy == 0) {
        return (0);
    }
    if (larger_delta == dy) {
        if dy > 0 {
            return (1);
        }
        return (5);
    }
    if (larger_delta == 0) {
        if dx > 0 {
            if dy > 0 {
                return (2);
            }
            return (4);
        }
        return (6);
    }
    if (larger_delta == dx) {
        if (dy > 0) {
            return (3);
        }
        return (7);
    }
    return (8);
}
