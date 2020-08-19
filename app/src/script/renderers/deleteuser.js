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

const errcall = msg => {
  ipcRenderer.send('resizeWindow', 400, 205);
  document.getElementById('deletecallback').textContent = msg;
};

const deleteuser = () => {
  var username = document.getElementById('deleteuname').value;
  var password = document.getElementById('deletepass').value;
  var cpassword = document.getElementById('deletepassre').value;
  if ((username.toLowerCase().replace(' ', '') == '') || (password.toLowerCase().replace(' ', '') == '') || (cpassword.toLowerCase().replace(' ', '') == '')) errcall('Missing some inputs!');
  else if (password != cpassword) errcall('Passwords don\'t match!');
  else {
    ipcRenderer.send('info', `Creating user ${username}.`, Error().stack);
    if (fs.existsSync(`${maindir}/users.xml`)) {
      fs.readFile(`${maindir}/users.xml`, 'utf8', (err, data) => {
        var jsonout = parser.xml2json(data);
        var users = jsonout["users"]["user"];
        var user;
        if (users.length == undefined) {
          if (users.name == username) user = users;
        }
        else {
          for (var i = 0; i < users.length; i++) {
            if (users[i].name == username) user = users[i];
          }
        }
        if (user == undefined) errcall(`User "${username}" not found!`);
        else {
          crypter.decrypt(user.pass, 'p3s6v9y$B&E(H+Mb', decrypted => {
            if (decrypted == password) {
              var nus = [];
              if (user.length != undefined) {
                for (var i = 0; i < users.length; i++) {
                  if (users[i].name != user.name) nus.push({
                    name: "user", attrs: { name: users[i].name, pass: users[i].pass }
                  });
                }
              }
              var towrite = nus;
              if (nus.length == undefined) towrite = [nus];
              fs.writeFile(`${maindir}/users.xml`, jsonxml({
                users: towrite
              }), err => {
                if (err) errcall('Couldn\'t delete user!');
                else {
                  fs.unlink(`${maindir}/passwords/${user.name}.xml`, err => {
                    ipcRenderer.send('resizeWindow', 435, 90);
                    ipcRenderer.send('changeHtml', `${__dirname}/splash.html`);
                  });
                }
              });
            } else errcall('Incorrect password!');
          });
        }
      });
    } else errcall('No users found!');
  }
};

const cancel = () => {
  ipcRenderer.send('resizeWindow', 435, 90);
  ipcRenderer.send('changeHtml', `${__dirname}/splash.html`);
};
