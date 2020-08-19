const { ipcRenderer } = require('electron');
const fs = require('fs');
const parser = require('xml2json-light');
const crypter = require('../script/modules/crypter.js');

var maindir = ((process.platform === 'win32') ? `${process.env.APPDATA}/pkeeperjs` : `${process.env.HOME}/.pkeeperjs`);
fs.mkdirSync(maindir, { recursive: true });

const errcall = msg => {
  ipcRenderer.send('resizeWindow', 400, 205);
  document.getElementById('logincallback').textContent = msg;
};

const login = () => {
  var username = document.getElementById('loginuname').value;
  var password = document.getElementById('loginpass').value;
  if (username.toLowerCase().replace(' ', '') == '' || password.toLowerCase().replace('', '') == '') errcall('Missing some inputs!');
  else {
    ipcRenderer.send('info', 'Logging in...', Error().stack);
    if (fs.existsSync(`${maindir}/users.xml`)) {
      fs.readFile(`${maindir}/users.xml`, 'utf8', (err, data) => {
        var jsonout = parser.xml2json(data);
        try {
          var users = jsonout["users"]["user"];
          if (users.length == undefined) {
            if (username == users.name) {
              crypter.decrypt(users.pass, 'p3s6v9y$B&E(H+Mb', pass => {
                if (password == pass) {
                  ipcRenderer.send('setVar', 'currentUser', users.name);
                  ipcRenderer.send('resizeWindow', 400, 500);
                  ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                } else errcall('Incorrect password!');
              });
            } else errcall(`Couldn't find user "${username}"!`);
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
            if (found == true) crypter.decrypt(user.pass, 'p3s6v9y$B&E(H+Mb', pass => {
              if (password == pass) {
                ipcRenderer.send('setVar', 'currentUser', user.name);
                ipcRenderer.send('resizeWindow', 400, 500);
                ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
              } else errcall('Incorrect password!');
            });
            else errcall(`Couldn't find user "${username}"!`);
          }
        } catch (err) { errcall('No users found!'); }
      });
    } else errcall('No users found!');
  }
};

const cancel = () => {
  ipcRenderer.send('resizeWindow', 435, 90);
  ipcRenderer.send('changeHtml', `${__dirname}/splash.html`);
};
