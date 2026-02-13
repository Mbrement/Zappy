use crate::server::{Server, define};
use mio::Token;
use std::collections::{HashMap, VecDeque};
use std::io::Write;
use crate::server::utils::*;

pub type CommandFn = Box<dyn Fn(mio::Token, &mut Server, &str)>;
pub type CommandArgs = (String, mio::Token, String);
pub struct CommandManager {
    order: HashMap<Token, VecDeque<CommandArgs>>,
    next_execute: HashMap<Token, u128>,
    commands: HashMap<String, CommandFn>,
}

impl CommandManager {
    pub fn new() -> Self {
        Self {
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

        if self.order.entry(token).or_insert_with(VecDeque::new).len() < 10 {
            self.order
                .entry(token)
                .or_insert_with(VecDeque::new)
                .push_back((name.clone(), token, arg.clone()));
            if self.next_execute.entry(token).or_insert(0) == &0 {
                self.next_execute.insert(token, 0);
            }
        }
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
        #[cfg(feature = "debug")]
        command_manager.register(
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
        #[cfg(feature = "debug")]
        command_manager.register(
            "death",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                debug_manager_register("death", _c, server, _arg);
            },
        );
        command_manager.register(
            "droite",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                // _game.change_player_orientation(_c, "droite".into());
                #[cfg(feature = "log")]
                debug_manager_register("droite", _c, server, _arg);
                if let Some(client) = server._clients.get_mut(&_c) {
                    server
                        ._game
                        .change_player_orientation(client, "droite".into());
                    let _ = client
                        .get_socket_mut()
                        .write(format!("{}", define::R_OK).as_bytes());
                }
            },
        );
        command_manager.register(
            "gauche",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("gauche", _c, server, _arg);
                if let Some(client) = server._clients.get_mut(&_c) {
                    server
                        ._game
                        .change_player_orientation(client, "gauche".into());
                    let _ = client
                        .get_socket_mut()
                        .write(format!("{}", define::R_OK).as_bytes());
                }
            },
        );
        command_manager.register("voir", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            debug_manager_register("voir", _c, server, _arg);
        });
        command_manager.register(
            "inventaire",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("inventaire", _c, server, _arg);
                let mut client = server._clients.get_mut(&_c).unwrap();
				let inventory = client.get_inventory();
                client.get_socket_mut().write(format!(
                    "{} {}, {} {}, {} {}, {} {}, {} {}, {} {}, {} {}",
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
				).as_bytes());
            },
        );
        command_manager.register(
            "avance",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("avance", _c, server, _arg);
                let client = server._clients.get_mut(&_c).unwrap();
                server._game.move_player(client);
                client.position = server._game.get_player_position(_c);
            },
        );
        command_manager.register(
            "prend",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("prend", _c, server, _arg);
            },
        );
        command_manager.register("pose", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            debug_manager_register("pose", _c, server, _arg);
        });
        command_manager.register(
            "expluse",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("expluse", _c, server, _arg);
            },
        );
        command_manager.register(
            "broadcast",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("broadcast", _c, server, _arg);
                // Broadcast the message to all clients

                let tmp = server._game.map.player_position.get(&_c);
                if tmp.is_none() {
                    #[cfg(feature = "log")]
                    println!("No player found for token {:?}", _c);
                    return;
                }
                let (position_x, position_y) = tmp.unwrap();
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
            },
        );
        command_manager.register(
            "incantation",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("incantation", _c, server, _arg);
            },
        );
        command_manager.register("fork", |_c: mio::Token, server: &mut Server, _arg: &str| {
            #[cfg(feature = "log")]
            debug_manager_register("fork", _c, server, _arg);
            server._game.fork_player(_c);
        });
        command_manager.register(
            "connect_nbr",
            |_c: mio::Token, server: &mut Server, _arg: &str| {
                #[cfg(feature = "log")]
                debug_manager_register("connect_nbr", _c, server, _arg);
                let tmp = server.get_team_for_player(&_c);
                let d = server._max_clients[&tmp] - server._game.team[&tmp].len() as u32;
                let mut client = server._clients.get_mut(&_c).unwrap();
                let _ = client.get_socket_mut().write(format!("{}\n", d).as_bytes()); // TODO check error here
            },
        );
        command_manager
    }

    pub fn process_queue(&mut self, server: &mut Server) {
        let tokens: Vec<Token> = self.order.keys().cloned().collect();
        for token in tokens {
            if self.order.contains_key(&token) && self.next_execute.contains_key(&token) {
                // println!("Processing command queue: {:?}", "here");

                // println!(
                //     "Executing command for token {:?}: {:?}",
                //     token,
                //     self.order.get(&token)
                // );
                if let Some((command, tkn, arg)) =
                    self.order.get(&token).and_then(|queue| queue.front())
                {
                    println!(
                        "current tick: {}, next execute for token {:?}: {}, command queue length: {}",
                        server._game._tick,
                        token,
                        self.next_execute.get(&token).unwrap_or(&0),
                        self.order.get(&token).unwrap_or(&VecDeque::new()).len()
                    );

                    if self.next_execute.get(&token).unwrap() == &server._game._tick
                        || self.next_execute.get(&token).unwrap() == &0
                    {
                        let res = match command.as_str() {
                            "voir" | "prend" | "pose" | "droite" | "gauche" | "avance"
                            | "expulse" | "broadcast" => {
                                self.next_execute.insert(token, server._game._tick + 7)
                            }
                            "inventaire" => self.next_execute.insert(token, server._game._tick + 1),
                            "fork" => self.next_execute.insert(token, server._game._tick + 42),
                            "incantation" => {
                                self.next_execute.insert(token, server._game._tick + 300)
                            }
                            "connect_nbr" => self.next_execute.insert(token, server._game._tick),
                            _ => None,
                        };
                        self.execute(&command, *tkn, &arg, server);
						//TODO-mrozniec: recup command

                        if res.is_some() {
                            // Only pop the command if it was not handled by the match arms above
                            self.order.get_mut(&token).unwrap().pop_front();
                        }
                    }
                }
            }
        }
        //TODO-mrozniec: send all graph client
    }

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

    println!("src {} {} dest {} {}", sourcex, sourcey, destx, desty);
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
