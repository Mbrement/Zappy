
class MessageHandler {
    constructor() {

        this.handleMessageBind = this.handleMessage.bind(this)
        this.handleErrorBind = this.handleError.bind(this)

        this.networkClient = null
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Sets up the server communication handlers
     * @param networkClient - The network client that's connected to the server
     */
    setupHandlers(networkClient) {
        this.networkClient = networkClient
        this.networkClient.on('message', this.handleMessageBind)
        this.networkClient.on('error', this.handleErrorBind)
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description If socket connection fails or if an error occurs we show
     * the connection screen and display an error
     */
    handleError() {
        window.mainInstance.eventManager.modules.ConnectMenu.showConnectMenu()
        // TODO : Display error
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Handles the messages comming in from the server
     */
    handleMessage(msg) {
        console.log("Just recieved message", msg)
        switch (msg) {
            case "BIENVENUE":
                this.welcome()
        }
    }

    /**
     * @author Emma (epolitze) Politzer
     * @description Once the server welcomes us we launches the 3D visualisation
     */
    welcome() {
        window.mainInstance.startVisualisation()
    }
}

module.exports = MessageHandler