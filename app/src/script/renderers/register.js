const { ipcRenderer } = require('electron');
const fs = require('fs');
const parser = require('xml2json-light');
const jsonxml = require('jsontoxml');
const crypter = require('../script/modules/crypter.js');

var maindir;

if (process.platform === 'win32') {
  maindir = `${process.env.APPDATA}/pkeeperjs`;
} else {
  maindir = `${process.env.HOME}/.pkeeperjs`;
}
fs.mkdirSync(maindir, { recursive: true });

const create = () => {
  var username = document.getElementById('registeruname').value;
  var password = document.getElementById('registerpass').value;
  var cpassword = document.getElementById('registerpassre').value;
  if ((username.toLowerCase().replace(' ', '') == '') || (password.toLowerCase().replace(' ', '') == '') || (cpassword.toLowerCase().replace(' ', '') == '')) {
    ipcRenderer.send('resizeWindow', 400, 225);
    document.getElementById('registercallback').textContent = 'Missing some inputs!';
  } else if (password != cpassword) {
    ipcRenderer.send('resizeWindow', 400, 225);
    document.getElementById('registercallback').textContent = 'Passwords don\'t match!';
  } else {
    ipcRenderer.send('info', `Creating user ${username}.`, Error().stack);
    try {
      if (fs.existsSync(`${maindir}/users.xml`)) {
        fs.readFile(`${maindir}/users.xml`, 'utf8', (err, data) => {
          var jsonout = parser.xml2json(data);
          var users = jsonout["users"]["user"];
          if (users.length == undefined) {
            if (users.name != username) {
              crypter.encrypt(password, 'p3s6v9y$B&E(H+Mb', pass => {
                fs.writeFile(`${maindir}/users.xml`, jsonxml({
                  users: [
                    {name: "user", attrs: users},
                    {name: "user", attrs: { name: username, pass: pass} }
                  ]
                }), err => {
                  if (err) {
                    ipcRenderer.send('info', `Couldn't create users file!`, Error().stack);
                    ipcRenderer.send('resizeWindow', 400, 225);
                    document.getElementById('registercallback').textContent = 'Couldn\'t create user!';
                  }
                  else {
                    ipcRenderer.send('setVar', 'currentUser', username);
                    ipcRenderer.send('resizeWindow', 400, 500);
                    ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                  }
                });
              });
            } else {
              ipcRenderer.send('resizeWindow', 400, 225);
              document.getElementById('registercallback').textContent = 'User already exists!';
            }
          } else {
            var valid = true;
            for (var i = 0; i < users.length; i++) {
              if (users[i].name == username) {
                valid = false;
                break;
              }
            }
            if (valid == true) {
              crypter.encrypt(password, 'p3s6v9y$B&E(H+Mb', pass => {
                var nusers = [];
                for (var i = 0; i < users.length; i++) {
                  nusers.push({name: "user", attrs: users[i]});
                }
                nusers.push({name: "user", attrs: { name: username, pass: pass} });
                fs.writeFile(`${maindir}/users.xml`, jsonxml({
                  users: nusers
                }), err => {
                  if (err) {
                    ipcRenderer.send('info', `Couldn't create users file!`, Error().stack);
                    ipcRenderer.send('resizeWindow', 400, 225);
                    document.getElementById('registercallback').textContent = 'Couldn\'t create user!';
                  }
                  else {
                    ipcRenderer.send('setVar', 'currentUser', username);
                    ipcRenderer.send('resizeWindow', 400, 500);
                    ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                  }
                });
              });
            } else {
              ipcRenderer.send('resizeWindow', 400, 225);
              document.getElementById('registercallback').textContent = 'User already exists!';
            }
          }
        });
      } else {
        crypter.encrypt(password, 'p3s6v9y$B&E(H+Mb', pass => {
          fs.writeFile(`${maindir}/users.xml`, jsonxml({
            users:[
              {name: "user", attrs:{name: username, pass: pass} }
            ]
          }), err => {
            if (err) {
              ipcRenderer.send('info', `Couldn't create users file!`, Error().stack);
              ipcRenderer.send('resizeWindow', 400, 225);
              document.getElementById('registercallback').textContent = 'Couldn\'t create users file!';
            }
            else {
              ipcRenderer.send('setVar', 'currentUser', username);
              ipcRenderer.send('resizeWindow', 400, 500);
              ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
            }
          });
        });
      }
    } catch(err) { ipcRenderer.send('info', `${err}`, Error().stack); }
  }
};

const cancel = () => {
  ipcRenderer.send('resizeWindow', 275, 90);
  ipcRenderer.send('changeHtml', `${__dirname}/splash.html`);
};
