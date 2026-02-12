const { app, BrowserWindow } = require('electron');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        // [TEMPORARY]
        // minWidth: 1200,
        // minHeight: 800,
        // maxWidth: 1200,
        // maxHeight: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('src/index.html');

    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();
});
