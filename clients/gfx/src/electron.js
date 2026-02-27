const { app, BrowserWindow, protocol, net, ipcMain } = require('electron')
const path = require('path')
const url = require('url')

/**
 * @author Emma (epolitze) Politzer
 * @description Registers the static scheme to have
 * sufficient privileges to load media content
 */
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'static',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true,
        }
    }
]);

/**
 * @author Emma (epolitze) Politzer
 * @description Create the electron window
 */
function createWindow() {
    const mainWindow = new BrowserWindow({
        minWidth: 1200,
        minHeight: 800,
        maxWidth: 1920,
        maxHeight: 1080,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('src/index.html');
}

/**
 * @author Emma (epolitze) Politzer
 * @description Defines a protocol so that the static can be called
 * without leading '../'
 */
app.whenReady().then(() => {
    protocol.handle('static', async (request) => {
        let filePath = request.url.slice('static://'.length);

        if (filePath.endsWith('/')) {
            filePath = filePath.slice(0, -1);
        }

        const fullPath = path.join(__dirname, '../static', filePath);

        return net.fetch(url.pathToFileURL(fullPath).toString());
    });

    createWindow();
});

/**
 * @author Emma (epolitze) Politzer
 * @description Closes the electron window upon receiving close-app event
 */
ipcMain.on('close-app', () => {
    app.quit()
})