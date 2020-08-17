const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', event => {
  ipcRenderer.send('getVar', 'currentUser');
  ipcRenderer.on('var-reply', (e, value) => {
    document.getElementById('logg').innerHTML = `Logged in as ${value}. <button onclick="logout()" id="logoutbutton">Logout</button>`;
  });
});

const logout = () => {
  ipcRenderer.send('setVar', 'currentUser', '');
  ipcRenderer.send('resizeWindow', 275, 90);
  ipcRenderer.send('changeHtml', `${__dirname}/splash.html`);
};
