const { app, BrowserWindow } = require('electron');

function createWindow() {
    const mainWindow = new BrowserWindow({
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

    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();
});
