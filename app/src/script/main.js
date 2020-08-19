const { app, BrowserWindow, ipcMain } = require('electron');
const readline = require('readline');

var variables = {
  currentUser: '',
  currentCategory: '',
  currentPassword: ''
};

var win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 275,
    height: 90,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    },
    icon: `${__dirname}/../../assets/img/icon.png`,
    titleBarStyle: 'hidden'
  });
  win.loadFile(`${__dirname}/../html/splash.html`);
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('print', (e, msg) => console.log(msg))

ipcMain.on('info', (e, msg, stack) => {
  const line = ((stack.split('\n')[1] || '…')
    .match(/\(([^)]+)\)/) || [, 'not found'])[1];
  const colons = line.split('/')[line.split('/').length - 1].split(':');
  console.log(`[${colons[0]}:${colons[1]}] ${msg}`);
});

ipcMain.on('progress', (e, msg) => {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(msg);
});

ipcMain.on('changeHtml', (e, path) => win.loadFile(path));

ipcMain.on('resizeWindow', (e, width, height) => {
  win.setResizable(true);
  win.setSize(width, height, true);
  win.center();
  win.setResizable(false);
});

ipcMain.on('setVar', (e, name, value) => {
  variables[name] = value;
});

ipcMain.on('getVar', (e, name) => e.sender.send('var-reply', variables[name]));

ipcMain.on('getVars', (e, ...args) => {
  var ret = [];
  for (var i = 0; i < args.length; i++) ret.push(variables[args[i]]);
  e.sender.send('var-reply', ret);
});

ipcMain.on('quitApp', e => app.quit());
