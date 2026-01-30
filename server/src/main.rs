extern crate getopts;
use getopts::Options;
use std::env;
use std::io::{Read, Write};
mod server;
use mio::net::{TcpListener, TcpStream};
use mio::{Events, Interest, Poll, Token};
use std::collections::HashMap;

use crate::server::Server;

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
    opts.optopt("n", "", "set team", "team_name_1 team_name_2 ...");
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
    if matches.opt_present("p") {
        let port = matches.opt_str("p").unwrap();
        server = Server::new(port.parse().unwrap());
    } else {
        server = Server::new(4242);
    }
    println!("Server running on port: {}", server.get_port());
    // server.set_port(8080);
    // return Ok(());

    if matches.opt_present("h") {
        print_usage(&program, opts);
        return Ok(());
    }
    if matches.opt_present("x") {
        let width = matches.opt_str("x").unwrap();
    }
    if matches.opt_present("y") {
        let height = matches.opt_str("y").unwrap();
        println!("Map height: {}", height);
    }
    if matches.opt_present("n") {
        let teams = matches.opt_str("n").unwrap();
        println!("Teams: {}", teams);
    }
    if matches.opt_present("c") {
        let clients = matches.opt_str("c").unwrap();
        println!("Number of clients: {}", clients);
    }
    if matches.opt_present("t") {
        let tick = matches.opt_str("t").unwrap();
        println!("Tick per second: {}", tick);
    }

    //

    // let addr = "127.0.0.1:4242".parse().unwrap();
    // let mut server = TcpListener::bind(addr)?;

    // let mut poll = server.get_poll_mut();
    // let mut events = server.get_events_mut();

    // poll.registry()
    //     .register(server.get_socket_mut(), SERVER, Interest::READABLE)?;

    // let mut clients: HashMap<Token, TcpStream> = HashMap::new();
    // let mut next_token = 1;

    // loop {
    //     poll.poll(&mut events, None)?;

    //     for event in events.iter() {
    //         match event.token() {
    //             SERVER => loop {
    //                 match server.get_socket().accept() {
    //                     Ok((mut client, _)) => {
    //                         let token = Token(next_token);
    //                         next_token += 1;

    //                         poll.registry()
    //                             .register(&mut client, token, Interest::READABLE)?;
    //                         clients.insert(token, client);
    //                     }
    //                     Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
    //                     Err(e) => return Err(e),
    //                 }
    //             },
    //             token => {
    //                 let mut disconnected = false;
    //                 {
    //                     if let Some(client) = clients.get_mut(&token) {
    //                         let response = format!("Bienvenue\n");
    //                         if client.write(response.as_bytes()).is_err() {
    //                             disconnected = true;
    //                         }
    //                         let mut buf = [0; 1024];
    //                         let _ = client.read(&mut buf);
    //                         println!(
    //                             "Received data from {:?}: {:?}",
    //                             token,
    //                             String::from_utf8_lossy(&buf)
    //                         );
    //                     }
    //                 }

    //                 if disconnected {
    //                     if let Some(mut client) = clients.remove(&token) {
    //                         let _ = client.shutdown(std::net::Shutdown::Both);
    //                         println!("Client {:?} disconnected", token);
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }
	return Ok(());
}
