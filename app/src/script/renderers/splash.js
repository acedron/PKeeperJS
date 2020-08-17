const { ipcRenderer } = require('electron');

const login = () => {
  ipcRenderer.send('resizeWindow', 400, 175);
  ipcRenderer.send('changeHtml', `${__dirname}/login.html`);
};

const register = () => {
  ipcRenderer.send('resizeWindow', 400, 175);
  ipcRenderer.send('changeHtml', `${__dirname}/register.html`);
};
