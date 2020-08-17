const { ipcRenderer } = require('electron');
const fs = require('fs');
const parser = require('xml2json-light');
const crypter = require('../script/modules/crypter.js');

var maindir;

if (process.platform === 'win32') {
  maindir = `${process.env.APPDATA}/pkeeperjs`;
} else {
  maindir = `${process.env.HOME}/.pkeeperjs`;
}
fs.mkdirSync(maindir, { recursive: true });

const login = () => {
  var username = document.getElementById('loginuname').value;
  var password = document.getElementById('loginpass').value;
  if (username.toLowerCase().replace(' ', '') == '' || password.toLowerCase().replace('', '') == '') {
    ipcRenderer.send('resizeWindow', 400, 225);
    document.getElementById('logincallback').textContent = 'Missing some inputs!';
  } else {
    ipcRenderer.send('info', 'Logging in...', Error().stack);
    try {
      if (fs.existsSync(`${maindir}/users.xml`)) {
        fs.readFile(`${maindir}/users.xml`, 'utf8', (err, data) => {
          var jsonout = parser.xml2json(data);
          var users = jsonout["users"]["user"];
          if (users.length == undefined) {
            if (username == users.name) {
              crypter.decrypt(users.pass, 'p3s6v9y$B&E(H+Mb', pass => {
                if (password == pass) {
                  ipcRenderer.send('setVar', 'currentUser', users.name);
                  ipcRenderer.send('resizeWindow', 400, 500);
                  ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                } else {
                  ipcRenderer.send('resizeWindow', 400, 225);
                  document.getElementById('logincallback').textContent = 'Password doesn\'t match!';
                }
              });
            } else {
              ipcRenderer.send('resizeWindow', 400, 225);
              document.getElementById('logincallback').textContent = `Couldn't find "${username}"!`;
            }
          } else {
            var found = false;
            var user;
            for (var i = 0; i < users.length; i++){
              if (username == users[i].name) {
                found = true;
                user = users[i];
                break;
              }
            }
            if (found == true) {
              crypter.decrypt(user.pass, 'p3s6v9y$B&E(H+Mb', pass => {
                if (password == pass) {
                  ipcRenderer.send('setVar', 'currentUser', user.name);
                  ipcRenderer.send('resizeWindow', 400, 500);
                  ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                } else {
                  ipcRenderer.send('resizeWindow', 400, 225);
                  document.getElementById('logincallback').textContent = 'Password doesn\'t match!';
                }
              });
            } else {
              ipcRenderer.send('resizeWindow', 400, 225);
              document.getElementById('logincallback').textContent = `Couldn't find "${username}"!`;
            }
          }
        });
      } else {
        ipcRenderer.send('resizeWindow', 400, 225);
        document.getElementById('logincallback').textContent = 'Create an user first!';
      }
    } catch (err) { ipcRenderer.send('info', `${err}`, Error().stack); }
  }
};

const cancel = () => {
  ipcRenderer.send('resizeWindow', 275, 90);
  ipcRenderer.send('changeHtml', `${__dirname}/splash.html`);
};
