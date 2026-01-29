// extern crate getopts;
// use getopts::Options;
// use std::env;
use std::io::{Read, Write};
// use std::net::{TcpListener, TcpStream};

// fn handle_client(mut stream: TcpStream, listener: &TcpListener) {
// 	println!("New client connected: {}", stream.peer_addr().unwrap());
//     let response;
//     stream.write_all(response).unwrap();
//     // listener.accept().unwrap();
// }

// fn print_usage(program: &str, opts: Options) {
//     let brief = format!("Usage: {} [options]", program);
//     print!("{}", opts.usage(&brief));
// }
// fn main() -> Result<(), Box<dyn std::error::Error>> {
//     let args: Vec<String> = env::args().collect();
//     let program = args[0].clone();
//     let mut opts = Options::new();
//     opts.optopt("p", "port", "set the port for the server", "PORT");
//     opts.optopt("x", "", "set the width of the map", "WIDTH");
//     opts.optopt("y", "", "set the height of the map", "HEIGHT");
//     opts.optopt("n", "", "set team", "team_name_1 team_name_2 ...");
//     opts.optopt("c", "", "number of clients", "CLIENT");
//     opts.optopt("t", "", "number of tick per sec", "TICK");
//     opts.optflag("h", "help", "print this help menu");
//     let matches = match opts.parse(&args[1..]) {
//         Ok(m) => m,
//         Err(f) => {
//             panic!("{}", f.to_string())
//         }
//     };
//     if matches.opt_present("p") {
//         let port = matches.opt_str("p").unwrap();
//         println!("Port: {}", port);
//     }
//     if matches.opt_present("h") {
//         print_usage(&program, opts);
//         return Ok(());
//     }
//     let mut listener = TcpListener::bind("127.0.0.1:4242")?;
//     for mut stream in listener.incoming() {
//         handle_client(stream?, &listener);
//     }
//     Ok(())
// }
use mio::net::{TcpListener, TcpStream};
use mio::{Events, Interest, Poll, Token};
use std::collections::HashMap;
// Tokens to identify which socket triggered an event
const SERVER: Token = Token(0);

fn main() -> std::io::Result<()> {
    let mut poll = Poll::new()?;
    let mut events = Events::with_capacity(128);

    // Setup the server socket
    let addr = "127.0.0.1:4242".parse().unwrap();
    let mut server = TcpListener::bind(addr)?;

    // Register the server to listen for "Accept" readiness
    poll.registry()
        .register(&mut server, SERVER, Interest::READABLE)?;

    // Map to keep track of active client connections
    let mut clients: HashMap<Token, TcpStream> = HashMap::new();
    let mut next_token = 1;

    println!("Event-driven server running on 4242...");

    loop {
        // This blocks the thread, but it waits for ANY event
        poll.poll(&mut events, None)?;

        for event in events.iter() {
            match event.token() {
                SERVER => {
                    // New connection ready to be accepted
                    loop {
                        match server.accept() {
                            Ok((mut client, _)) => {
                                let token = Token(next_token);
                                next_token += 1;

                                poll.registry()
                                    .register(&mut client, token, Interest::READABLE)?;
                                clients.insert(token, client);
                            }
                            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                            Err(e) => return Err(e),
                        }
                    }
                }
                token => {
                    // Existing client has sent data or closed connection
                    let mut disconnected = false;
                    // Limit the mutable borrow to this inner scope
                    {
                        if let Some(client) = clients.get_mut(&token) {
                            let response = format!(
                                "HTTP/1.1 200 OK\r\n\r\nHello, world!, you are {:?}",
                                token
                            );
                            if client.write(response.as_bytes()).is_err() {
                                // Mark disconnected and perform removal after the borrow ends
                                disconnected = true;
                            }
							let mut buf = [0; 1024];
                            let _ = client.read(&mut buf);
							println!("Received data from {:?}: {:?}", token, String::from_utf8_lossy(&buf));
                        }
                    }

                    if disconnected {
                        // Now take ownership of the client and clean up
                        if let Some(mut client) = clients.remove(&token) {

                            let _ = client.shutdown(std::net::Shutdown::Both);
                            println!("Client {:?} disconnected", token);
                        }
                    }

                }
            }
        }
    }
}
