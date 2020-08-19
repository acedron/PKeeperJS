const { ipcRenderer } = require('electron');
const fs = require('fs');
const parser = require('xml2json-light');
const jsonxml = require('jsontoxml');
const crypto = require('crypto');
const crypter = require('../script/modules/crypter.js');

var uname;
var cate;

document.addEventListener('DOMContentLoaded', event => {
  ipcRenderer.send('getVars', 'currentUser', 'currentCategory');
  ipcRenderer.on('var-reply', (e, getvarval) => {
    uname = getvarval[0];
    cate = getvarval[1];
  });
});

var maindir = ((process.platform === 'win32') ? `${process.env.APPDATA}/pkeeperjs` : `${process.env.HOME}/.pkeeperjs`);
fs.mkdirSync(maindir, { recursive: true });

const errcall = msg => {
  ipcRenderer.send('resizeWindow', 400, 205);
  document.getElementById('createcallback').textContent = msg;
};

const create = () => {
  var passname = document.getElementById('passwordname').value;
  var password = document.getElementById('pass').value;
  var cpassword = document.getElementById('passre').value;
  if ((passname.toLowerCase().replace(' ', '') == '') || (password.toLowerCase().replace(' ', '') == '') || (cpassword.toLowerCase().replace(' ', '') == '')) errcall('Missing some inputs!');
  else if (password != cpassword) errcall('Passwords don\'t match!');
  else {
    ipcRenderer.send('info', `Creating password ${passname}.`, Error().stack);
    fs.readFile(`${maindir}/users.xml`, 'utf8', (errus, dataus) => {
      var jsonoutus = parser.xml2json(dataus);
      var users = jsonoutus['users']['user'];
      var enpass = '';
      if (users.length == undefined) enpass = users.pass;
      else {
        for (var i = 0; i < users.length; i++) {
          if (users[i].name == uname) {
            enpass = users[i].pass;
            break;
          }
        }
      }
      crypter.decrypt(enpass, 'p3s6v9y$B&E(H+Mb', depass => {
        var k = crypto.scryptSync(depass, 'salt', 16);
        crypter.encrypt(password, k, encrypted => {
          fs.readFile(`${maindir}/passwords/${uname}.xml`, 'utf8', (err, data) => {
            var jsonout = parser.xml2json(data);
            var categories = jsonout['xml']['category'];
            var passwords = [];
            if (categories.length == undefined) {
              try {
                var p = categories['password'];
                if (p.length == undefined) {
                  if (p.name == passname) {
                    callerr(`Password ${passname} already exists!`);
                    return;
                  } else passwords.push({
                    name: "password", attrs: { name: p.name, pass: p.pass }
                  });
                }
                else {
                  for (var i = 0; i < p.length; i++) {
                    if (p[i].name == passname) {
                      callerr(`Password ${passname} already exists!`);
                      return;
                      break;
                    } else passwords.push({
                      name: "password", attrs: { name: p[i].name, pass: p[i].pass }
                    });
                  }
                }
              } catch (err) {}
            } else {
              for (var i = 0; i < categories.length; i++) {
                if (categories[i].name == cate) {
                  try {
                    var p = categories[i]['password'];
                    if (p.length == undefined) {
                      if (p.name == passname) {
                        callerr(`Password ${passname} already exists!`);
                        return;
                      } else passwords.push({
                        name: "password", attrs: { name: p.name, pass: p.pass }
                      });
                    } else {
                      for (var i = 0; i < p.length; i++) {
                        if (p[i].name == passname) {
                          callerr(`Password ${passname} already exists!`);
                          return;
                          break;
                        } else passwords.push({
                          name: "password", attrs: { name: p[i].name, pass: p[i].pass }
                        });
                      }
                    }
                  } catch (err) {}
                }
              }
            }
            var ncate = [];
            passwords.push({
              name: "password", attrs: { name: passname, pass: encrypted }
            });
            if (categories.length == undefined) ncate.push({
              name: "category", attrs: { name: categories.name }, children: passwords
            });
            else {
              for (var i = 0; i < categories.length; i++) {
                if (categories[i].name == cate) ncate.push({
                  name: "category", attrs: { name: categories[i].name }, children: passwords
                });
                else {
                  var plar = [];
                  try {
                    var passes = categories[i]['password'];
                    if (passes.length == undefined) plar.push({
                      name: "password", attrs: { name: passes.name, pass: passes.pass }
                    });
                    else {
                      for (var j = 0; j < passes.length; j++) plar.push({
                        name: "password", attrs: { name: passes[j].name, pass: passes[j].pass }
                      });
                    }
                    ncate.push({
                      name: "category", attrs: { name: categories[i].name }, children: plar
                    });
                  } catch (err) {
                    ncate.push({
                      name: "category", attrs: { name: categories[i].name }
                    });
                  }
                }
              }
            }
            var tw = ncate;
            if (ncate.length == undefined) tw = [ncate];
            fs.writeFile(`${maindir}/passwords/${uname}.xml`, jsonxml({
              xml: tw
            }), err => {
              if (err) errcall('Couldn\'t create password');
              else {
                ipcRenderer.send('resizeWindow', 400, 500);
                ipcRenderer.send('changeHtml', `${__dirname}/passwords.html`);
              }
            });
          });
        });
      });
    });
  }
};

const cancel = () => {
  ipcRenderer.send('resizeWindow', 400, 500);
  ipcRenderer.send('changeHtml', `${__dirname}/passwords.html`);
};
