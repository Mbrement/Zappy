use crate::server::Server;
use std::io::Write;

fn debug_manager_register(s: String, _c: mio::Token, server: &mut Server, _arg: &str) {
    #[cfg(feature = "debug")]
    let client = server._clients.get_mut(&_c).unwrap();
    #[cfg(feature = "debug")]
    let _ = client
        .get_socket_mut()
        .write(format!("command {} recived {{{}}}\n", s, _arg).as_bytes());
	#[cfg(feature = "debug")]
    println!("command {} recived {{{}}} {:?}", s, _arg, _c);
}