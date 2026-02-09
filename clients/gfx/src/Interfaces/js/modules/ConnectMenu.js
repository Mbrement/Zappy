class ConnectMenu {
    constructor() {
        this.instance = document.getElementById("connectMenu");
        this.address = "";
        this.port = "";
    }

    parsePort(portStr) {
        if (!portStr) {
            throw new Error(`Port must be provided`);
        }

        if (!/^\d+$/.test(portStr)) {
            throw new Error(`"${portStr}" is not a valid Int.`);
        }

        const port = parseInt(portStr);

        if (port < 1 || port > 65535) {
            throw new Error(`${port} is not in range (1-65535).`);
        }

        return port;
    }

    resetErrors() {
        document.getElementById('addressError').innerHTML = ""
        document.getElementById('portError').innerHTML = ""
    }

    showPortError(error) {
        document.getElementById('portError').innerHTML = error
    }

    showAddressError(error) {
        document.getElementById('addressError').innerHTML = error
    }

    connect() {
        this.resetErrors();
        this.address = document.getElementById("address").value;
        this.port = document.getElementById("port").value;

        if (!this.address) {
            this.showAddressError("Address must be provided")
            return
        }

        try {
            this.parsePort(this.port)
        }
        catch (error) {
            this.showPortError(error)
            return;
        }

        const main = require("../../../main")
        main.connectToServer(this.address, this.port)

        this.hideConnectMenu()
    }

    showConnectMenu() {
        this.instance.style.visibility = 'visible';
    }

    hideConnectMenu() {
        this.instance.style.visibility = 'hidden';
    }

}

module.exports = ConnectMenu