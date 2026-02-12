#![allow(warnings)]
// extern crate getopts;
use getopts::{Options, ParsingStyle};
use std::env;
use std::io::{Read, Write};
mod server;
use mio::net::{TcpListener, TcpStream};
use mio::{Events, Interest, Poll, Token};
use std::collections::HashMap;

use crate::server::{Server, define};

fn print_usage(program: &str, opts: Options) {
    let brief = format!("Usage: {} [options]", program);
    print!("{}", opts.usage(&brief));
}
const SERVER: Token = Token(0);

fn main() -> std::io::Result<()> {
    let args: Vec<String> = env::args().collect();
    let program = args[0].clone();
    let mut opts = Options::new();
    opts.optopt("p", "port", "set the port for the server", "PORT");
    opts.optopt("x", "", "set the width of the map", "WIDTH");
    opts.optopt("y", "", "set the height of the map", "HEIGHT");
    opts.reqopt("n", "", "set team", "team_name_1 team_name_2 ...");
    opts.optopt("c", "", "number of clients", "CLIENT");
    opts.optopt("t", "", "number of tick per sec", "TICK");
    opts.optflag("h", "help", "print this help menu");
    let matches = match opts.parse(&args[1..]) {
        Ok(m) => m,
        Err(f) => {
            eprintln!("{}", f.to_string());
            return Ok(());
        }
    };
    let mut server: Server;
    if matches.opt_present("p")
        && matches.opt_str("p").is_some()
        && matches.opt_str("p").unwrap().parse::<u16>().is_ok()
    {
        server = Server::new(matches.opt_str("p").unwrap().parse().unwrap());
    } else {
        println!("Default port : 4242");
        server = Server::new(4242);
    }
    #[cfg(feature = "log")]
    println!("Server running on port: {}", server.get_port());

    if matches.opt_present("h") {
        print_usage(&program, opts);
        return Ok(());
    }
    if matches.opt_present("x") {
        let width = matches.opt_str("x").unwrap();
        if width.parse::<u32>().is_ok() {
            server.set_map_width(width.parse().unwrap());
        } else {
            eprintln!(
                "Invalid map width value, keeping default value of {}",
                server.get_width()
            );
        }
    }
    if matches.opt_present("y") {
        let height = matches.opt_str("y").unwrap();
        if height.parse::<u32>().is_ok() {
            server.set_map_height(height.parse().unwrap());
        } else {
            eprintln!(
                "Invalid map height value, keeping default value of {}",
                server.get_height()
            );
        }
    }

    if matches.opt_present("t") {
        let tick = matches.opt_str("t").unwrap();
        #[cfg(feature = "log")]
        println!("Tick per second: {}", tick);
        if tick.parse::<u32>().is_ok() {
            server.set_ticks(tick.parse().unwrap());
        } else {
            eprintln!(
                "Invalid tick value, keeping default value of {}",
                server.get_ticks()
            );
        }
    }
    if matches.opt_present("n") {
        //TODO FIXE, IF LAST ARG TEAM ARE NOT ADDED
        let teams = matches.opt_positions("n");
        // let mut team_names: Vec<String> = Vec::new();
        let mut tmp = 0usize;
        for arg in &args {
            #[cfg(feature = "debug")]
            println!("{}", arg);
            if arg.starts_with("-") {
                tmp += 1;
            }
            if arg == define::GRAPHICAL_CLIENT {
                eprintln!(
                    "Found graphical client as team argument, {}, please do not use this as a team name",
                    arg
                );
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    "graphical client name used as team",
                ));
            } else if server.teams.get(&arg.clone()).is_some() {
                eprintln!(
                    "Found duplicate {} team, please do not use this as a team name",
                    arg
                );
                return Err(std::io::Error::new(
                    std::io::ErrorKind::InvalidInput,
                    "duplicate team name",
                ));
            } else if tmp == teams[0] + 1 && !arg.starts_with("-") {
                server.teams.insert(arg.clone(), Vec::new());
                server._game.team.insert(arg.clone(), Vec::new());
            }
        }
        #[cfg(feature = "log")]
        println!("Server teams: {:?}", server.teams);
        if server.teams.is_empty() {
            eprintln!("No teams found, please add teams using the -n option");
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "no teams found",
            ));
        }
    }
    if matches.opt_present("c") {
        let clients = matches.opt_str("c").unwrap();
        #[cfg(feature = "log")]
        println!("Number of clients: {}", clients);
        if clients.parse::<u32>().is_ok() {
            server.set_clients_number(clients.parse().unwrap());
        } else {
            eprintln!("Invalid client value, keeping default value of {}", 10);
        }
    } else {
        server.set_clients_number(10);
        eprintln!("No client number provided, keeping default value of {}", 10);
    }
    server.run();

    return Ok(());
}
