const {app, BrowserWindow, ipcMain }  = require('electron');

let win;

app.on('ready', () => {
    win = new BrowserWindow({
        width:800,
        height:600,
        webPreferences : {
            nodeIntegration : true,
            enableRemoteModule: true
        }
    })
    win.loadFile('index.html');
});

ipcMain.on('playlist', (event, data) => {
    win.webContents.send('playlist', data);
})
