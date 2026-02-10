class ConnectMenu {
    constructor() {
        this.instance = document.getElementById("connectMenu");
        this.address = "";
        this.port = "";
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Checks if the given string contains a usable port
     * @param portStr - the string containing the port number
     * @returns {number} - the port
     */
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

    /**
     * @author Emma (epolitze) Politzer
     * @description Removes errors from the connectMenu
     */
    resetErrors() {
        document.getElementById('addressError').innerHTML = ""
        document.getElementById('portError').innerHTML = ""
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Shows port error on the connectMenu
     * @param error - the error message
     */
    showPortError(error) {
        document.getElementById('portError').innerHTML = error
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Shows address error on the connectMenu
     * @param error - the error message
     */
    showAddressError(error) {
        document.getElementById('addressError').innerHTML = error
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description If address and port are given and usable we try to connect to the server
     * This is called when the "connect" button is clicked
     */
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

        window.mainInstance.connectToServer(this.address, this.port)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Shows connectMenu
     */
    showConnectMenu() {
        this.instance.style.visibility = 'visible';
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Hides connectMenu
     */
    hideConnectMenu() {
        this.instance.style.visibility = 'hidden';
    }

}

module.exports = ConnectMenu