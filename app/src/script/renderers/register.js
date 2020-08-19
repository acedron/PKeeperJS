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

const errcall = () => {
  ipcRenderer.send('resizeWindow', 400, 205);
  document.getElementById('logincallback').textContent = msg;
};

const create = () => {
  var username = document.getElementById('registeruname').value;
  var password = document.getElementById('registerpass').value;
  var cpassword = document.getElementById('registerpassre').value;
  if ((username.toLowerCase().replace(' ', '') == '') || (password.toLowerCase().replace(' ', '') == '') || (cpassword.toLowerCase().replace(' ', '') == '')) errcall('Missing some inputs!');
  else if (password != cpassword) errcall('Passwords don\t match!');else {
    ipcRenderer.send('info', `Creating user ${username}.`, Error().stack);
    try {
      if (fs.existsSync(`${maindir}/users.xml`)) {
        fs.readFile(`${maindir}/users.xml`, 'utf8', (err, data) => {
          var jsonout = parser.xml2json(data);
          try {
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
                    if (err) errcall('Couldn\'t create user!');
                    else {
                      fs.mkdirSync(`${maindir}/passwords/`, { recursive: true });
                      fs.writeFile(`${maindir}/passwords/${username}.xml`, jsonxml({
                        xml: []
                      }), err => {
                        ipcRenderer.send('setVar', 'currentUser', username);
                        ipcRenderer.send('resizeWindow', 400, 500);
                        ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                      });
                    }
                  });
                });
              } else errcall('User already exists!');
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
                  for (var i = 0; i < users.length; i++) nusers.push({name: "user", attrs: users[i]});
                  nusers.push({name: "user", attrs: { name: username, pass: pass} });
                  fs.writeFile(`${maindir}/users.xml`, jsonxml({
                    users: nusers
                  }), err => {
                    if (err) errcall('Couldn\'t create user!');
                    else {
                      fs.mkdirSync(`${maindir}/passwords/`, { recursive: true });
                      fs.writeFile(`${maindir}/passwords/${username}.xml`, jsonxml({
                        xml: []
                      }), err => {
                        ipcRenderer.send('setVar', 'currentUser', username);
                        ipcRenderer.send('resizeWindow', 400, 500);
                        ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                      });
                    }
                  });
                });
              } else errcall('User already exists!');
            }
          } catch (err) {
            crypter.encrypt(password, 'p3s6v9y$B&E(H+Mb', encrypted => {
              fs.writeFile(`${maindir}/users.xml`, jsonxml({
                users: [
                  { name: "user", attrs: { name: username, pass: encrypted} }
                ]
              }), err => {
                if (err) errcall('Couldn\'t create user!');
                else {
                  fs.mkdirSync(`${maindir}/passwords/`, { recursive: true });
                  fs.writeFile(`${maindir}/passwords/${username}.xml`, jsonxml({
                    xml: []
                  }), err => {
                    ipcRenderer.send('setVar', 'currentUser', username);
                    ipcRenderer.send('resizeWindow', 400, 500);
                    ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                  });
                }
              });
            });
          }
        });
      } else {
        crypter.encrypt(password, 'p3s6v9y$B&E(H+Mb', pass => {
          fs.writeFile(`${maindir}/users.xml`, jsonxml({
            users:[
              {name: "user", attrs:{name: username, pass: pass} }
            ]
          }), err => {
            if (err) errcall('Couldn\'t create user!');
            else {
              fs.mkdirSync(`${maindir}/passwords/`, { recursive: true });
              fs.writeFile(`${maindir}/passwords/${username}.xml`, jsonxml({
                xml: []
              }), err => {
                ipcRenderer.send('setVar', 'currentUser', username);
                ipcRenderer.send('resizeWindow', 400, 500);
                ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
              });
            }
          });
        });
      }
    } catch(err) { ipcRenderer.send('info', `${err}`, Error().stack); }
  }
};

const cancel = () => {
  ipcRenderer.send('resizeWindow', 435, 90);
  ipcRenderer.send('changeHtml', `${__dirname}/splash.html`);
};
