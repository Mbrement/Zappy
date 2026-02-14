const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
    const mainWindow = new BrowserWindow({
        //width: 1200,
        //height: 800,
        // [TEMPORARY]
        minWidth: 1200,
        minHeight: 800,
        maxWidth: 1200,
        maxHeight: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('src/index.html');

    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    protocol.handle('static', async (request) => {
        const filePath = request.url.slice('static://'.length);

        const fullPath = path.join(__dirname, '../static', filePath);

        return net.fetch(url.pathToFileURL(fullPath).toString());
    });

    createWindow();
});
