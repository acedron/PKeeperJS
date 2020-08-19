const { ipcRenderer } = require('electron');
const fs = require('fs');
const parser = require('xml2json-light');
const jsonxml = require('jsontoxml');
const customTitlebar = require('custom-electron-titlebar');
const crypto = require('crypto');
const crypter = require('../script/modules/crypter.js');
const clipboardy = require('clipboardy');

var maindir;

if (process.platform === 'win32') {
  maindir = `${process.env.APPDATA}/pkeeperjs`;
} else {
  maindir = `${process.env.HOME}/.pkeeperjs`;
}
fs.mkdirSync(maindir, { recursive: true });

var cate = '';
var uname = '';
var cpass = '';

const errcall = msg => {
  ipcRenderer.send('resizeWindow', 400, 205);
  document.getElementById('passcallback').textContent = msg;
};

document.addEventListener('DOMContentLoaded', event => {
  ipcRenderer.send('getVars', 'currentUser', 'currentCategory', 'currentPassword');
  ipcRenderer.on('var-reply', (e, getvarval) => {
    uname = getvarval[0];
    cate = getvarval[1];
    cpass = getvarval[2];
    window.document.title = `PKeeperJS - ${uname}/${cate}/${cpass}`;
    new customTitlebar.Titlebar({
      backgroundColor: customTitlebar.Color.fromHex('#28353b'),
      icon: `${__dirname}/../../assets/img/icon.png`,
      menu: null,
      maximizable: false
    });
    document.getElementById('password').innerHTML = `${cpass} : <input class="spassinput" type="text" id="pass" name="pass" value="Loading..." readonly>`;
    fs.readFile(`${maindir}/users.xml`, 'utf8', (errus, dataus) => {
      var jsonoutus = parser.xml2json(dataus);
      var users = jsonoutus['users']['user'];
      var user;
      if (users.length == undefined) user = users;
      else {
        for (var i = 0; i < users.length; i++) {
          if (users[i].name == uname) user = users[i];
        }
      }
      crypter.decrypt(user.pass, 'p3s6v9y$B&E(H+Mb', depass => {
        var k = crypto.scryptSync(depass, 'salt', 16);
        fs.readFile(`${maindir}/passwords/${uname}.xml`, 'utf8', (err, data) => {
          var jsonout = parser.xml2json(data);
          var categories = jsonout['xml']['category'];
          var category, passwords, password;
          if (categories.length == undefined) category = categories;
          else {
            for (var i = 0; i < categories.length; i++) {
              if (categories[i].name == cate) category = categories[i];
            }
          }
          passwords = category['password'];
          if (passwords.length == undefined) password = passwords;
          else {
            for (var i = 0; i < passwords.length; i++) {
              if (passwords[i].name == cpass) password = passwords[i];
            }
          }
          crypter.decrypt(password.pass, k, decrypted => {
            document.getElementById('password').innerHTML = `${password.name} : <input class="spassinput" type="password" id="pass" name="pass" value="${decrypted}" readonly>`;
          });
        });
      });
    });
  });
});

const deletePassword = () => {
  ipcRenderer.send('info', `Deleting password "${cpass}"`, Error().stack);
  fs.readFile(`${maindir}/passwords/${uname}.xml`, 'utf8', (err, data) => {
    var jsonout = parser.xml2json(data);
    var categories = jsonout['xml']['category'];
    var category, passwords, password;
    var ncate = [];
    if (categories.length == undefined) category = categories;
    else {
      for (var i = 0; i < categories.length; i++) {
        if (categories[i].name == cate) category = categories[i];
        else {
          try {
            var p = categories[i]['password'];
            if (p.length == undefined) ncate.push({
              name: "category", attrs: categories[i], children: [
                { name: "password", attrs: { name: p.name, pass: p.pass } }
              ]
            });
            else {
              var parr = [];
              for (var i = 0; i < p.length; i++) {
                parr.push({
                  name: "password", attrs: { name: p[i].name, pass: p[i].pass }
                });
              }
              ncate.push({
                name: "category", attrs: { name: categories[i].name }, children: parr
              })
            }
          } catch (err) {
            ncate.push({
              name: "category", attrs: { name: categories[i].name }
            });
          }
        }
      }
    }
    passwords = category['password'];
    if (passwords.length == undefined) ncate.push({
      name: "category", attrs: { name: category.name }
    });
    else {
      var npass = [];
      for (var i = 0; i < passwords.length; i++) {
        if (passwords[i].name != cpass) npass.push({
          name: "password", attrs: { name: passwords[i].name, pass: passwords[i].pass }
        });
      }
      ncate.push({
        name: "category", attrs: { name: category.name }, children: npass
      });
    }
    var towrite = ncate;
    if (ncate.length == undefined) towrite = [ncate];
    fs.writeFile(`${maindir}/passwords/${uname}.xml`, jsonxml({
      xml: towrite
    }), err => {
      ipcRenderer.send('setVar', 'currentPassword', '');
      ipcRenderer.send('resizeWindow', 400, 500);
      ipcRenderer.send('changeHtml', `${__dirname}/passwords.html`);
    });
  });
};

const copy = () => {
  try {
    clipboardy.writeSync(document.getElementById('pass').value);
    if (clipboardy.readSync() == document.getElementById('pass').value) errcall('Successfully copied password!');
    else throw 'Couldn\'t copy password!';
  }
  catch (err) { errcall('Couldn\'t copy password!'); }
};

const showtoggle = () => {
  document.getElementById('showtoggle').textContent = ((document.getElementById('pass').type == 'text') ? 'Show Password' : 'Hide Password');
  document.getElementById('pass').type = ((document.getElementById('pass').type == 'text') ? 'password' : 'text');
};

const back = () => {
  ipcRenderer.send('resizeWindow', 400, 500);
  ipcRenderer.send('changeHtml', `${__dirname}/passwords.html`);
};
