
class Main {
    constructor() {
        this.nwWindow = nw.Window.get()
        this.setNwWindow()
    }

    setNwWindow() {
        this.nwWindow.showDevTools()
        this.nwWindow.setMaximumSize(1200, 800)
        this.nwWindow.setMinimumSize(1200, 800)
    }
}

const main = new Main()