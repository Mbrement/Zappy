import { spawn } from 'node:child_process';
import fs from 'node:fs';


class ProcessManager {
    constructor(teamName, port, hostname) {
        this.teamName = teamName;
        this.port = port;
        this.hostname = hostname;
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Create a fork of this process with logging information into file.
     */
    fork() {
        if (!fs.existsSync('./logs')) {
            fs.mkdirSync('./logs');
        }

        const logPath = `./logs/bot_${this.teamName}_${process.pid}_${new Date().toISOString()}.log`;
        const logStream = fs.openSync(logPath, 'a');

        const subprocess = spawn(process.argv[0], ['-n', this.teamName, '-p', this.port, '-h', this.hostname], {
            detached: true,
            stdio: ['ignore', logStream, logStream]
        });

        subprocess.unref();
    }
}

export default ProcessManager