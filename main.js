const { app, BrowserWindow } = require('electron', 'app');

app.commandLine.appendSwitch('remote-debugging-port', '8315');
app.commandLine.appendSwitch("host-rules", 'MAP * 127.0.0.1');

function createWindow () {
  const win = new BrowserWindow({
    show: false,
    icon: "img/burnearth.ico",
    webPreferences: {
      nodeIntegration: true,
      devTools: true
    }
  })

  win.maximize();
  //win.removeMenu(true);
  win.loadFile('index.html');
  win.show();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
