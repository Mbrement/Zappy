import process from 'node:process'
import {ARGV_ERROR, DEFAULT_HOSTNAME} from "./constant.js";

let singleton = null

class Main {
    constructor() {
        if (singleton) {
            return singleton
        }
        singleton = this

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

        import('./communication/NetworkClient.js').then(({ default: NetworkClient }) => {
            this.networkClient = new NetworkClient(this.config.hostname, this.config.port)
        })
        import('./communication/CommandManager.js').then(({ default: CommandManager }) => {
            this.commandManager = new CommandManager(this.networkClient)
        })
        import('./ProcessManager.js').then(({ default: ProcessManager }) => {
            this.processManager = new ProcessManager(this.config.teamName, this.config.port, this.config.hostname)
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

export default Main;

new Main()