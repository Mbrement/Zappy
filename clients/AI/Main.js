import process from 'node:process'
import {ARGV_ERROR, DEFAULT_HOSTNAME} from "./constant.js";
import NetworkClient from "./NetworkClient.js";

class Main {
    constructor() {
        this.config = {
            teamName: null,
            port: null,
            hostname: DEFAULT_HOSTNAME,
        }

        const argv = process.argv.slice(2);

        try {
            this.parseArgv(argv);
            console.log('current config :', this.config)
        } catch (error) {
            console.error(error.message);
            process.exit(1);
        }

        this.networkClient = new NetworkClient(this.config.hostname, this.config.port)
        this.networkClient.on('connect', () => {
            this.networkClient.send("Hii from the AI client\n");
        });
        this.networkClient.on('message', (message) => {
            console.log('Server has send: ', message)
        })
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Check validity of input argument will throw an Error on failure
     * @param argv {String[]} - The argument list to parse
     */
    parseArgv(argv) {
        if (argv.length !== 4 && argv.length !== 6) {
            throw new Error(ARGV_ERROR);
        }

        if (argv[0] !== '-n' || argv[2] !== '-p') {
            throw new Error(ARGV_ERROR)
        }

        if (argv.length === 6 && argv[4] !== '-h') {
            throw new Error(ARGV_ERROR)
        }

        this.config.teamName = argv[1]
        this.config.port = this.parsePort(argv[3])
        this.config.hostname = argv[5] || DEFAULT_HOSTNAME
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Try to transform a given String into a valid Int Port
     * @param portStr {String} - The string Port to parse and convert to a Number(Int)
     * @returns {number} - The parsed port in Int.
     */
    parsePort(portStr) {
        if (!/^\d+$/.test(portStr)) {
            throw new Error(`Port "${portStr}" is not a valid Int.\n\n${ARGV_ERROR}`);
        }

        const port = parseInt(portStr);

        if (port < 1 || port > 65535) {
            throw new Error(`Port ${port} is not in range (1-65535).\n\n${ARGV_ERROR}`);
        }

        return port;
    }
}

new Main();